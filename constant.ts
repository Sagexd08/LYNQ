export const abi ={
          "address": "0xcc5e97e0015543dfac2d3e686fed214a7450e5c1efe15786dfde118987c3fbec",
          "name": "elegent_defi_v2",
          "friends": [],
          "exposed_functions": [
            {
              "name": "initialize",
              "visibility": "public",
              "is_entry": true,
              "is_view": false,
              "generic_type_params": [],
              "params": [
                "&signer"
              ],
              "return": []
            },
            {
              "name": "create_trust_score",
              "visibility": "public",
              "is_entry": true,
              "is_view": false,
              "generic_type_params": [],
              "params": [
                "&signer"
              ],
              "return": []
            },
            {
              "name": "extend_loan",
              "visibility": "public",
              "is_entry": true,
              "is_view": false,
              "generic_type_params": [],
              "params": [
                "&signer",
                "u64",
                "address"
              ],
              "return": []
            },
            {
              "name": "get_loan_details",
              "visibility": "public",
              "is_entry": false,
              "is_view": true,
              "generic_type_params": [],
              "params": [
                "u64",
                "address"
              ],
              "return": [
                "u64",
                "address",
                "u64",
                "u64",
                "u64",
                "u8",
                "u64"
              ]
            },
            {
              "name": "get_max_loan_amount",
              "visibility": "public",
              "is_entry": false,
              "is_view": true,
              "generic_type_params": [],
              "params": [
                "address"
              ],
              "return": [
                "u64"
              ]
            },
            {
              "name": "get_trust_score",
              "visibility": "public",
              "is_entry": false,
              "is_view": true,
              "generic_type_params": [],
              "params": [
                "address"
              ],
              "return": [
                "u64",
                "0x1::string::String"
              ]
            },
            {
              "name": "get_user_loans",
              "visibility": "public",
              "is_entry": false,
              "is_view": true,
              "generic_type_params": [],
              "params": [
                "address",
                "address"
              ],
              "return": [
                "vector\u003Cu64\u003E"
              ]
            },
            {
              "name": "liquidate_loan",
              "visibility": "public",
              "is_entry": true,
              "is_view": false,
              "generic_type_params": [],
              "params": [
                "&signer",
                "address",
                "u64"
              ],
              "return": []
            },
            {
              "name": "refinance_loan",
              "visibility": "public",
              "is_entry": true,
              "is_view": false,
              "generic_type_params": [],
              "params": [
                "&signer",
                "u64",
                "address"
              ],
              "return": []
            },
            {
              "name": "repay_loan",
              "visibility": "public",
              "is_entry": true,
              "is_view": false,
              "generic_type_params": [],
              "params": [
                "&signer",
                "u64",
                "address"
              ],
              "return": []
            },
            {
              "name": "request_loan",
              "visibility": "public",
              "is_entry": true,
              "is_view": false,
              "generic_type_params": [],
              "params": [
                "&signer",
                "u64",
                "0x1::string::String",
                "address"
              ],
              "return": []
            },
            {
              "name": "stake_apt",
              "visibility": "public",
              "is_entry": true,
              "is_view": false,
              "generic_type_params": [],
              "params": [
                "&signer",
                "u64",
                "address"
              ],
              "return": []
            },
            {
              "name": "unstake_apt",
              "visibility": "public",
              "is_entry": true,
              "is_view": false,
              "generic_type_params": [],
              "params": [
                "&signer",
                "u64",
                "address"
              ],
              "return": []
            }
          ],
          "structs": [
            {
              "name": "EventHandles",
              "is_native": false,
              "is_event": false,
              "abilities": [
                "key"
              ],
              "generic_type_params": [],
              "fields": [
                {
                  "name": "loan_created_events",
                  "type": "0x1::event::EventHandle\u003C0xcc5e97e0015543dfac2d3e686fed214a7450e5c1efe15786dfde118987c3fbec::elegent_defi_v2::LoanCreatedEvent\u003E"
                },
                {
                  "name": "loan_repaid_events",
                  "type": "0x1::event::EventHandle\u003C0xcc5e97e0015543dfac2d3e686fed214a7450e5c1efe15786dfde118987c3fbec::elegent_defi_v2::LoanRepaidEvent\u003E"
                },
                {
                  "name": "loan_extended_events",
                  "type": "0x1::event::EventHandle\u003C0xcc5e97e0015543dfac2d3e686fed214a7450e5c1efe15786dfde118987c3fbec::elegent_defi_v2::LoanExtendedEvent\u003E"
                },
                {
                  "name": "loan_refinanced_events",
                  "type": "0x1::event::EventHandle\u003C0xcc5e97e0015543dfac2d3e686fed214a7450e5c1efe15786dfde118987c3fbec::elegent_defi_v2::LoanRefinancedEvent\u003E"
                },
                {
                  "name": "loan_liquidated_events",
                  "type": "0x1::event::EventHandle\u003C0xcc5e97e0015543dfac2d3e686fed214a7450e5c1efe15786dfde118987c3fbec::elegent_defi_v2::LoanLiquidatedEvent\u003E"
                },
                {
                  "name": "trust_score_updated_events",
                  "type": "0x1::event::EventHandle\u003C0xcc5e97e0015543dfac2d3e686fed214a7450e5c1efe15786dfde118987c3fbec::elegent_defi_v2::TrustScoreUpdatedEvent\u003E"
                },
                {
                  "name": "stake_events",
                  "type": "0x1::event::EventHandle\u003C0xcc5e97e0015543dfac2d3e686fed214a7450e5c1efe15786dfde118987c3fbec::elegent_defi_v2::StakeEvent\u003E"
                },
                {
                  "name": "rewards_claimed_events",
                  "type": "0x1::event::EventHandle\u003C0xcc5e97e0015543dfac2d3e686fed214a7450e5c1efe15786dfde118987c3fbec::elegent_defi_v2::RewardsClaimedEvent\u003E"
                }
              ]
            },
            {
              "name": "Loan",
              "is_native": false,
              "is_event": false,
              "abilities": [
                "copy",
                "drop",
                "store"
              ],
              "generic_type_params": [],
              "fields": [
                {
                  "name": "id",
                  "type": "u64"
                },
                {
                  "name": "borrower",
                  "type": "address"
                },
                {
                  "name": "token_type",
                  "type": "0x1::string::String"
                },
                {
                  "name": "amount",
                  "type": "u64"
                },
                {
                  "name": "interest_amount",
                  "type": "u64"
                },
                {
                  "name": "dynamic_interest_rate",
                  "type": "u64"
                },
                {
                  "name": "due_date",
                  "type": "u64"
                },
                {
                  "name": "status",
                  "type": "u8"
                },
                {
                  "name": "created_at",
                  "type": "u64"
                },
                {
                  "name": "last_extended",
                  "type": "u64"
                },
                {
                  "name": "extension_count",
                  "type": "u64"
                },
                {
                  "name": "collateral_amount",
                  "type": "u64"
                }
              ]
            },
            {
              "name": "LoanCreatedEvent",
              "is_native": false,
              "is_event": false,
              "abilities": [
                "drop",
                "store"
              ],
              "generic_type_params": [],
              "fields": [
                {
                  "name": "loan_id",
                  "type": "u64"
                },
                {
                  "name": "borrower",
                  "type": "address"
                },
                {
                  "name": "amount",
                  "type": "u64"
                },
                {
                  "name": "token_type",
                  "type": "0x1::string::String"
                },
                {
                  "name": "interest_rate",
                  "type": "u64"
                },
                {
                  "name": "due_date",
                  "type": "u64"
                },
                {
                  "name": "nft_id",
                  "type": "u64"
                }
              ]
            },
            {
              "name": "LoanExtendedEvent",
              "is_native": false,
              "is_event": false,
              "abilities": [
                "drop",
                "store"
              ],
              "generic_type_params": [],
              "fields": [
                {
                  "name": "loan_id",
                  "type": "u64"
                },
                {
                  "name": "borrower",
                  "type": "address"
                },
                {
                  "name": "new_due_date",
                  "type": "u64"
                },
                {
                  "name": "extension_count",
                  "type": "u64"
                }
              ]
            },
            {
              "name": "LoanLiquidatedEvent",
              "is_native": false,
              "is_event": false,
              "abilities": [
                "drop",
                "store"
              ],
              "generic_type_params": [],
              "fields": [
                {
                  "name": "loan_id",
                  "type": "u64"
                },
                {
                  "name": "borrower",
                  "type": "address"
                },
                {
                  "name": "amount",
                  "type": "u64"
                },
                {
                  "name": "liquidator",
                  "type": "address"
                }
              ]
            },
            {
              "name": "LoanNFT",
              "is_native": false,
              "is_event": false,
              "abilities": [
                "store",
                "key"
              ],
              "generic_type_params": [],
              "fields": [
                {
                  "name": "id",
                  "type": "u64"
                },
                {
                  "name": "metadata_uri",
                  "type": "0x1::string::String"
                },
                {
                  "name": "loan_id",
                  "type": "u64"
                },
                {
                  "name": "borrower",
                  "type": "address"
                }
              ]
            },
            {
              "name": "LoanRefinancedEvent",
              "is_native": false,
              "is_event": false,
              "abilities": [
                "drop",
                "store"
              ],
              "generic_type_params": [],
              "fields": [
                {
                  "name": "old_loan_id",
                  "type": "u64"
                },
                {
                  "name": "new_loan_id",
                  "type": "u64"
                },
                {
                  "name": "borrower",
                  "type": "address"
                },
                {
                  "name": "old_rate",
                  "type": "u64"
                },
                {
                  "name": "new_rate",
                  "type": "u64"
                }
              ]
            },
            {
              "name": "LoanRepaidEvent",
              "is_native": false,
              "is_event": false,
              "abilities": [
                "drop",
                "store"
              ],
              "generic_type_params": [],
              "fields": [
                {
                  "name": "loan_id",
                  "type": "u64"
                },
                {
                  "name": "borrower",
                  "type": "address"
                },
                {
                  "name": "amount",
                  "type": "u64"
                },
                {
                  "name": "interest",
                  "type": "u64"
                },
                {
                  "name": "early_repayment",
                  "type": "bool"
                }
              ]
            },
            {
              "name": "PlatformState",
              "is_native": false,
              "is_event": false,
              "abilities": [
                "key"
              ],
              "generic_type_params": [],
              "fields": [
                {
                  "name": "total_loans",
                  "type": "u64"
                },
                {
                  "name": "total_volume",
                  "type": "u64"
                },
                {
                  "name": "active_loans",
                  "type": "0x1::table::Table\u003Cu64, 0xcc5e97e0015543dfac2d3e686fed214a7450e5c1efe15786dfde118987c3fbec::elegent_defi_v2::Loan\u003E"
                },
                {
                  "name": "user_loans",
                  "type": "0x1::table::Table\u003Caddress, vector\u003Cu64\u003E\u003E"
                },
                {
                  "name": "treasury_balance",
                  "type": "u64"
                },
                {
                  "name": "is_paused",
                  "type": "bool"
                },
                {
                  "name": "admin",
                  "type": "address"
                },
                {
                  "name": "loan_nft_counter",
                  "type": "u64"
                },
                {
                  "name": "supported_tokens",
                  "type": "vector\u003C0x1::string::String\u003E"
                },
                {
                  "name": "platform_fee_bps",
                  "type": "u64"
                },
                {
                  "name": "insurance_fund",
                  "type": "u64"
                }
              ]
            },
            {
              "name": "RefinanceTracker",
              "is_native": false,
              "is_event": false,
              "abilities": [
                "key"
              ],
              "generic_type_params": [],
              "fields": [
                {
                  "name": "refinanced_loans",
                  "type": "0x1::table::Table\u003Cu64, u64\u003E"
                },
                {
                  "name": "refinance_history",
                  "type": "0x1::table::Table\u003Caddress, vector\u003Cu64\u003E\u003E"
                }
              ]
            },
            {
              "name": "RewardsClaimedEvent",
              "is_native": false,
              "is_event": false,
              "abilities": [
                "drop",
                "store"
              ],
              "generic_type_params": [],
              "fields": [
                {
                  "name": "user",
                  "type": "address"
                },
                {
                  "name": "amount",
                  "type": "u64"
                },
                {
                  "name": "reward_type",
                  "type": "0x1::string::String"
                }
              ]
            },
            {
              "name": "Roles",
              "is_native": false,
              "is_event": false,
              "abilities": [
                "key"
              ],
              "generic_type_params": [],
              "fields": [
                {
                  "name": "moderators",
                  "type": "0x1::table::Table\u003Caddress, bool\u003E"
                },
                {
                  "name": "oracles",
                  "type": "0x1::table::Table\u003Caddress, bool\u003E"
                },
                {
                  "name": "admin",
                  "type": "address"
                }
              ]
            },
            {
              "name": "StakeEvent",
              "is_native": false,
              "is_event": false,
              "abilities": [
                "drop",
                "store"
              ],
              "generic_type_params": [],
              "fields": [
                {
                  "name": "user",
                  "type": "address"
                },
                {
                  "name": "amount",
                  "type": "u64"
                },
                {
                  "name": "total_staked",
                  "type": "u64"
                },
                {
                  "name": "lock_until",
                  "type": "u64"
                }
              ]
            },
            {
              "name": "StakingPool",
              "is_native": false,
              "is_event": false,
              "abilities": [
                "key"
              ],
              "generic_type_params": [],
              "fields": [
                {
                  "name": "total_staked",
                  "type": "u64"
                },
                {
                  "name": "user_stakes",
                  "type": "0x1::table::Table\u003Caddress, u64\u003E"
                },
                {
                  "name": "user_rewards",
                  "type": "0x1::table::Table\u003Caddress, u64\u003E"
                },
                {
                  "name": "pending_withdrawals",
                  "type": "0x1::table::Table\u003Caddress, u64\u003E"
                },
                {
                  "name": "last_reward_time",
                  "type": "u64"
                },
                {
                  "name": "reward_rate",
                  "type": "u64"
                },
                {
                  "name": "lock_duration",
                  "type": "u64"
                },
                {
                  "name": "user_stake_time",
                  "type": "0x1::table::Table\u003Caddress, u64\u003E"
                }
              ]
            },
            {
              "name": "TrustScoreNFT",
              "is_native": false,
              "is_event": false,
              "abilities": [
                "key"
              ],
              "generic_type_params": [],
              "fields": [
                {
                  "name": "score",
                  "type": "u64"
                },
                {
                  "name": "tier",
                  "type": "0x1::string::String"
                },
                {
                  "name": "loan_count",
                  "type": "u64"
                },
                {
                  "name": "total_borrowed",
                  "type": "u64"
                },
                {
                  "name": "total_repaid",
                  "type": "u64"
                },
                {
                  "name": "defaults",
                  "type": "u64"
                },
                {
                  "name": "last_updated",
                  "type": "u64"
                },
                {
                  "name": "staked_amount",
                  "type": "u64"
                },
                {
                  "name": "wallet_age",
                  "type": "u64"
                },
                {
                  "name": "early_repayments",
                  "type": "u64"
                },
                {
                  "name": "refinance_count",
                  "type": "u64"
                }
              ]
            },
            {
              "name": "TrustScoreUpdatedEvent",
              "is_native": false,
              "is_event": false,
              "abilities": [
                "drop",
                "store"
              ],
              "generic_type_params": [],
              "fields": [
                {
                  "name": "user",
                  "type": "address"
                },
                {
                  "name": "old_score",
                  "type": "u64"
                },
                {
                  "name": "new_score",
                  "type": "u64"
                },
                {
                  "name": "tier",
                  "type": "0x1::string::String"
                },
                {
                  "name": "reason",
                  "type": "0x1::string::String"
                }
              ]
            }
          ]
        } as const