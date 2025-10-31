module lynq_lending::trust_score {
    use std::signer;
    use std::error;
    use aptos_framework::event;
    use aptos_framework::account;

    struct TrustScoreData has key, store {
        score: u64,
        credit_history: u64,
        repayment_record: u64,
        collateral_value: u64,
        last_updated: u64,
    }

    struct TrustScoreStore has key {
        user_scores: Table<address, u64>,
    }

    struct TrustScoreUpdatedEvent has drop, store {
        user: address,
        new_score: u64,
        credit_history: u64,
        repayment_record: u64,
        collateral_value: u64,
    }

    #[event]
    struct TrustScoreEvents has key {
        score_updated_events: event::EventHandle<TrustScoreUpdatedEvent>,
    }

    const MAX_TRUST_SCORE: u64 = 1000;
    const BASE_SCORE: u64 = 500;
    const MAX_CREDIT_HISTORY: u64 = 100;
    const MAX_REPAYMENT_RECORD: u64 = 100;

    public fun get_trust_score(user: address): u64 acquires TrustScoreData {
        if (!exists<TrustScoreData>(user)) {
            return BASE_SCORE
        };
        *borrow_global<TrustScoreData>(user).score
    }

    public fun get_trust_score_data(user: address): TrustScoreData acquires TrustScoreData {
        *borrow_global<TrustScoreData>(user)
    }

    public fun update_trust_score(
        user: &signer,
        credit_history_points: u64,
        repayment_points: u64,
        collateral_value_points: u64,
    ) acquires TrustScoreData, TrustScoreEvents {
        let user_addr = signer::address_of(user);
        
        if (!exists<TrustScoreData>(user_addr)) {
            move_to(user, TrustScoreData {
                score: BASE_SCORE,
                credit_history: 0,
                repayment_record: 0,
                collateral_value: 0,
                last_updated: 0,
            });
        };

        let score_data = borrow_global_mut<TrustScoreData>(user_addr);
        let now = aptos_framework::timestamp::now_seconds();

        if (score_data.last_updated == 0) {
            score_data.score = BASE_SCORE;
            score_data.last_updated = now;
        };

        if (credit_history_points > 0) {
            score_data.credit_history = 
                if (score_data.credit_history + credit_history_points > MAX_CREDIT_HISTORY) {
                    MAX_CREDIT_HISTORY
                } else {
                    score_data.credit_history + credit_history_points
                };
        };

        if (repayment_points > 0) {
            score_data.repayment_record = 
                if (score_data.repayment_record + repayment_points > MAX_REPAYMENT_RECORD) {
                    MAX_REPAYMENT_RECORD
                } else {
                    score_data.repayment_record + repayment_points
                };
        };

        if (collateral_value_points > 0) {
            score_data.collateral_value = score_data.collateral_value + collateral_value_points;
        };

        score_data.score = calculate_trust_score(*score_data);
        score_data.last_updated = now;

        event::emit_event<TrustScoreUpdatedEvent>(
            borrow_global_mut<TrustScoreEvents>(@aptos_framework).score_updated_events,
            TrustScoreUpdatedEvent {
                user: user_addr,
                new_score: score_data.score,
                credit_history: score_data.credit_history,
                repayment_record: score_data.repayment_record,
                collateral_value: score_data.collateral_value,
            },
        );
    }

    fun calculate_trust_score(data: TrustScoreData): u64 {
        let calculated_score = BASE_SCORE;
        calculated_score = calculated_score + (data.credit_history * 3);
        calculated_score = calculated_score + (data.repayment_record * 2);
        calculated_score = calculated_score + (data.collateral_value / 1000000000);
        
        if (calculated_score > MAX_TRUST_SCORE) {
            MAX_TRUST_SCORE
        } else {
            calculated_score
        }
    }
}

