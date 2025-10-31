module lynq_lending::loan_platform {
    use std::signer;
    use std::event;
    use std::error;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::timestamp;
    use aptos_framework::account;

    const E_NOT_BORROWER: u64 = 1;
    const E_LOAN_NOT_FOUND: u64 = 2;
    const E_LOAN_NOT_ACTIVE: u64 = 3;
    const E_INSUFFICIENT_PAYMENT: u64 = 4;
    const E_INVALID_AMOUNT: u64 = 5;
    const E_INSUFFICIENT_COLLATERAL: u64 = 6;

    struct Loan has store {
        id: u64,
        borrower: address,
        principal: u64,
        remaining_principal: u64,
        interest_accrued: u64,
        late_fee: u64,
        interest_rate_bps: u64,
        created_at: u64,
        due_date: u64,
        status: u8,
        collateral_amount: u64,
    }

    struct LoanStore has key {
        loans: Table<u64, Loan>,
        next_loan_id: u64,
        total_loans_issued: u64,
        total_amount_lent: u64,
        total_repaid: u64,
    }

    struct LoanCreatedEvent has drop, store {
        loan_id: u64,
        borrower: address,
        amount: u64,
        interest_rate_bps: u64,
        due_date: u64,
    }

    struct LoanRepaidEvent has drop, store {
        loan_id: u64,
        borrower: address,
        principal_paid: u64,
        interest_paid: u64,
        late_fee_paid: u64,
        fully_repaid: bool,
    }

    #[event]
    struct LoanEvents has key {
        loan_created_events: event::EventHandle<LoanCreatedEvent>,
        loan_repaid_events: event::EventHandle<LoanRepaidEvent>,
    }

    const LOAN_STATUS_PENDING: u8 = 0;
    const LOAN_STATUS_ACTIVE: u8 = 1;
    const LOAN_STATUS_REPAID: u8 = 2;
    const LOAN_STATUS_DEFAULTED: u8 = 3;

    fun init_module(aptos_framework: &signer) {
        let resource_signer = account::create_resource_account(aptos_framework, b"lynq_lending", b"");

        move_to(&resource_signer, LoanStore {
            loans: table::new(),
            next_loan_id: 1,
            total_loans_issued: 0,
            total_amount_lent: 0,
            total_repaid: 0,
        });

        let aptos_addr = signer::address_of(aptos_framework);
        move_to(aptos_framework, LoanEvents {
            loan_created_events: account::new_event_handle<LoanCreatedEvent>(aptos_framework),
            loan_repaid_events: account::new_event_handle<LoanRepaidEvent>(aptos_framework),
        });
    }

    public fun create_loan(
        borrower: &signer,
        amount: u64,
        duration_seconds: u64,
        interest_rate_bps: u64,
        collateral_amount: u64,
    ): u64 acquires LoanStore {
        let borrower_addr = signer::address_of(borrower);
        
        assert!(amount > 0, error::invalid_argument(E_INVALID_AMOUNT));
        assert!(collateral_amount >= amount, error::invalid_argument(E_INSUFFICIENT_COLLATERAL));

        let now = timestamp::now_seconds();
        let due_date = now + duration_seconds;

        let loan_id = loan_store_next_id();
        
        let loan = Loan {
            id: loan_id,
            borrower: borrower_addr,
            principal: amount,
            remaining_principal: amount,
            interest_accrued: 0,
            late_fee: 0,
            interest_rate_bps,
            created_at: now,
            due_date,
            status: LOAN_STATUS_ACTIVE,
            collateral_amount,
        };

        table::add(&mut borrow_global_mut<LoanStore>(get_module_address()).loans, loan_id, loan);
        loan_store_increment_total_loans();
        loan_store_add_to_total_lent(amount);

        event::emit_event<LoanCreatedEvent>(
            borrow_global_mut<LoanEvents>(get_events_address()).loan_created_events,
            LoanCreatedEvent {
                loan_id,
                borrower: borrower_addr,
                amount,
                interest_rate_bps,
                due_date,
            },
        );

        loan_id
    }

    public fun repay_loan(
        borrower: &signer,
        loan_id: u64,
        payment_amount: u64,
        _coin: Coin<aptos_framework::aptos_coin::AptosCoin>
    ) acquires LoanStore, LoanEvents {
        let borrower_addr = signer::address_of(borrower);
        let loan_store = borrow_global_mut<LoanStore>(get_module_address());
        
        assert!(table::contains(&loan_store.loans, loan_id), error::not_found(E_LOAN_NOT_FOUND));
        
        let loan = table::borrow_mut(&mut loan_store.loans, loan_id);
        assert!(loan.borrower == borrower_addr, error::invalid_argument(E_NOT_BORROWER));
        assert!(loan.status == LOAN_STATUS_ACTIVE, error::invalid_state(E_LOAN_NOT_ACTIVE));

        update_interest_and_fees(loan);

        let total_owed = calculate_total_owed(loan);
        assert!(payment_amount <= total_owed, error::invalid_argument(E_INSUFFICIENT_PAYMENT));

        let mut remaining = payment_amount;
        let mut late_fee_paid = 0;
        let mut interest_paid = 0;
        let mut principal_paid = 0;

        if (loan.late_fee > 0 && remaining > 0) {
            late_fee_paid = if (remaining >= loan.late_fee) loan.late_fee else remaining;
            remaining = remaining - late_fee_paid;
            loan.late_fee = loan.late_fee - late_fee_paid;
        };

        if (loan.interest_accrued > 0 && remaining > 0) {
            interest_paid = if (remaining >= loan.interest_accrued) loan.interest_accrued else remaining;
            remaining = remaining - interest_paid;
            loan.interest_accrued = loan.interest_accrued - interest_paid;
        };

        if (loan.remaining_principal > 0 && remaining > 0) {
            principal_paid = if (remaining >= loan.remaining_principal) loan.remaining_principal else remaining;
            remaining = remaining - principal_paid;
            loan.remaining_principal = loan.remaining_principal - principal_paid;
        };

        let fully_repaid = loan.remaining_principal == 0 && loan.interest_accrued == 0 && loan.late_fee == 0;
        
        if (fully_repaid) {
            loan.status = LOAN_STATUS_REPAID;
        };

        loan_store.add_to_total_repaid(payment_amount);

        event::emit_event<LoanRepaidEvent>(
            borrow_global_mut<LoanEvents>(get_events_address()).loan_repaid_events,
            LoanRepaidEvent {
                loan_id,
                borrower: borrower_addr,
                principal_paid,
                interest_paid,
                late_fee_paid,
                fully_repaid,
            },
        );

        coin::destroy_zero(_coin);
    }

    fun update_interest_and_fees(loan: &mut Loan) {
        let now = timestamp::now_seconds();
        
        if (now > loan.created_at) {
            let time_elapsed = now - loan.created_at;
            let interest = (loan.principal * loan.interest_rate_bps * time_elapsed) / (10000 * 31536000);
            loan.interest_accrued = loan.interest_accrued + interest;
        };

        if (now > loan.due_date && loan.late_fee < (loan.principal * 10 / 100)) {
            let overdue_days = (now - loan.due_date) / 86400;
            let late_fee = (loan.principal * 10 * overdue_days) / (100 * 30);
            let max_late_fee = (loan.principal * 10) / 100;
            loan.late_fee = if (late_fee > max_late_fee) max_late_fee else late_fee;
        };
    }

    fun calculate_total_owed(loan: &Loan): u64 {
        loan.remaining_principal + loan.interest_accrued + loan.late_fee
    }

    public fun get_loan(loan_id: u64): Loan acquires LoanStore {
        *table::borrow(&borrow_global<LoanStore>(get_module_address()).loans, loan_id)
    }

    fun loan_store_next_id(): u64 acquires LoanStore {
        let store = borrow_global_mut<LoanStore>(get_module_address());
        let id = store.next_loan_id;
        store.next_loan_id = store.next_loan_id + 1;
        id
    }

    fun loan_store_increment_total_loans() acquires LoanStore {
        borrow_global_mut<LoanStore>(get_module_address()).total_loans_issued = 
            borrow_global_mut<LoanStore>(get_module_address()).total_loans_issued + 1;
    }

    fun loan_store_add_to_total_lent(amount: u64) acquires LoanStore {
        borrow_global_mut<LoanStore>(get_module_address()).total_amount_lent = 
            borrow_global_mut<LoanStore>(get_module_address()).total_amount_lent + amount;
    }

    fun loan_store_add_to_total_repaid(amount: u64) acquires LoanStore {
        borrow_global_mut<LoanStore>(get_module_address()).total_repaid = 
            borrow_global_mut<LoanStore>(get_module_address()).total_repaid + amount;
    }

    fun get_module_address(): address {
        @lynq_lending
    }

    fun get_events_address(): address {
        @aptos_framework
    }
}

