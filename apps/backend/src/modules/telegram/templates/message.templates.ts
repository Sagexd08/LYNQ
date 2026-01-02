import {
    NotificationType,
    LoanNotificationData,
    CreditScoreNotificationData,
    VouchNotificationData,
    HealthFactorNotificationData,
    TransactionNotificationData,
} from '../types/notification.types';
import { DecimalUtil } from '../../../common/utils/decimal.util';

const escapeMarkdown = (text: string): string => {
    return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
};

const formatAmount = (amount: string, decimals = 2): string => {
    if (!DecimalUtil.isValidNumericString(amount)) {
        return '0.00';
    }
    const dec = DecimalUtil.fromString(amount);
    const fixed = DecimalUtil.toFixed(dec, decimals);
    const num = DecimalUtil.toNumber(dec);
    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
};

const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const getHealthFactorEmoji = (hf: number): string => {
    if (hf >= 2.0) return '🟢';
    if (hf >= 1.5) return '🟡';
    if (hf >= 1.2) return '🟠';
    return '🔴';
};

const getTierEmoji = (tier: string): string => {
    const emojis: Record<string, string> = {
        BRONZE: '🥉',
        SILVER: '🥈',
        GOLD: '🥇',
        PLATINUM: '💎',
        DIAMOND: '👑',
    };
    return emojis[tier.toUpperCase()] || '⭐';
};

export const MessageTemplates = {
    [NotificationType.LOAN_CREATED]: (data: LoanNotificationData): string => `
🆕 *New Loan Request Created*
📊 *Loan Details:*
├ Amount: \`${escapeMarkdown(formatAmount(data.amount))}\` USDC
├ Chain: ${escapeMarkdown(data.chain)}
├ Collateral: \`${escapeMarkdown(data.collateralAmount || 'N/A')}\`
├ Interest Rate: ${escapeMarkdown(data.interestRate || 'TBD')}%
└ Loan ID: \`${escapeMarkdown(data.loanId.slice(0, 8))}...\`
⏳ Status: *Pending Approval*
_Your loan request is being processed\\. You'll receive a notification once it's approved\\._
`,

    [NotificationType.LOAN_APPROVED]: (data: LoanNotificationData): string => `
✅ *Loan Approved\\!*
🎉 Great news\\! Your loan has been approved\\.
📊 *Loan Details:*
├ Amount: \`${escapeMarkdown(formatAmount(data.amount))}\` USDC
├ Interest Rate: ${escapeMarkdown(data.interestRate || '0')}%
├ Due Date: ${data.dueDate ? escapeMarkdown(formatDate(data.dueDate)) : 'N/A'}
└ Loan ID: \`${escapeMarkdown(data.loanId.slice(0, 8))}...\`
💡 _Deposit your collateral to activate the loan\\._
`,

    [NotificationType.LOAN_ACTIVATED]: (data: LoanNotificationData): string => `
🚀 *Loan Activated\\!*
Your loan is now *ACTIVE*\\!
📊 *Active Loan:*
├ Amount: \`${escapeMarkdown(formatAmount(data.amount))}\` USDC
├ Collateral: \`${escapeMarkdown(data.collateralAmount || 'N/A')}\`
├ Health Factor: ${getHealthFactorEmoji(data.healthFactor || 0)} ${escapeMarkdown(String(data.healthFactor?.toFixed(2) || 'N/A'))}
├ Due Date: ${data.dueDate ? escapeMarkdown(formatDate(data.dueDate)) : 'N/A'}
└ Tx: [View on Explorer](https:
💰 _Funds have been transferred to your wallet\\!_
`,

    [NotificationType.LOAN_REPAID]: (data: LoanNotificationData): string => `
🎊 *Loan Fully Repaid\\!*
Congratulations\\! You've successfully repaid your loan\\.
📊 *Repayment Summary:*
├ Total Repaid: \`${escapeMarkdown(formatAmount(data.amount))}\` USDC
├ Loan ID: \`${escapeMarkdown(data.loanId.slice(0, 8))}...\`
└ Tx: [View on Explorer](https:
⭐ *\\+100 Reputation Points Earned\\!*
_Keep up the great payment behavior to unlock better rates\\!_
`,

    [NotificationType.LOAN_LIQUIDATED]: (data: LoanNotificationData): string => `
⚠️ *Loan Liquidated*
Unfortunately, your loan position has been liquidated\\.
📊 *Liquidation Details:*
├ Loan Amount: \`${escapeMarkdown(formatAmount(data.amount))}\` USDC
├ Collateral Lost: \`${escapeMarkdown(data.collateralAmount || 'N/A')}\`
├ Loan ID: \`${escapeMarkdown(data.loanId.slice(0, 8))}...\`
└ Tx: [View on Explorer](https:
📉 *\\-200 Reputation Points*
_To avoid future liquidations, consider maintaining a higher health factor\\._
`,

    [NotificationType.LOAN_DUE_SOON]: (data: LoanNotificationData): string => `
⏰ *Loan Due Soon\\!*
Your loan payment is due in *3 days*\\.
📊 *Loan Details:*
├ Outstanding: \`${escapeMarkdown(formatAmount(data.amount))}\` USDC
├ Due Date: ${data.dueDate ? escapeMarkdown(formatDate(data.dueDate)) : 'N/A'}
└ Loan ID: \`${escapeMarkdown(data.loanId.slice(0, 8))}...\`
💡 _Repay on time to earn reputation points and avoid penalties\\!_
[Repay Now](https:
`,

    [NotificationType.LOAN_OVERDUE]: (data: LoanNotificationData): string => `
🚨 *URGENT: Loan Overdue\\!*
Your loan payment is *OVERDUE*\\!
📊 *Loan Details:*
├ Outstanding: \`${escapeMarkdown(formatAmount(data.amount))}\` USDC
├ Due Date: ${data.dueDate ? escapeMarkdown(formatDate(data.dueDate)) : 'N/A'}
├ Days Overdue: URGENT
└ Loan ID: \`${escapeMarkdown(data.loanId.slice(0, 8))}...\`
⚠️ *Risk of Liquidation\\!*
[Repay Immediately](https:
`,

    [NotificationType.HEALTH_FACTOR_WARNING]: (data: HealthFactorNotificationData): string => `
🟡 *Health Factor Warning*
Your loan health factor is below the safe threshold\\.
📊 *Position Status:*
├ Health Factor: ${getHealthFactorEmoji(data.currentHealthFactor)} \`${escapeMarkdown(data.currentHealthFactor.toFixed(2))}\`
├ Threshold: ${escapeMarkdown(String(data.threshold))}
├ Collateral: \`${escapeMarkdown(data.collateralValue)}\`
└ Debt: \`${escapeMarkdown(data.debtValue)}\`
💡 _Consider adding collateral or repaying part of the loan\\._
[Manage Position](https:
`,

    [NotificationType.HEALTH_FACTOR_CRITICAL]: (data: HealthFactorNotificationData): string => `
🔴 *CRITICAL: Health Factor Alert\\!*
Your position is at *HIGH RISK* of liquidation\\!
📊 *Position Status:*
├ Health Factor: ${getHealthFactorEmoji(data.currentHealthFactor)} \`${escapeMarkdown(data.currentHealthFactor.toFixed(2))}\`
├ Liquidation at: 1\\.00
├ Collateral: \`${escapeMarkdown(data.collateralValue)}\`
└ Debt: \`${escapeMarkdown(data.debtValue)}\`
⚠️ *IMMEDIATE ACTION REQUIRED*
[Add Collateral Now](https:
`,

    [NotificationType.LIQUIDATION_RISK]: (data: HealthFactorNotificationData): string => `
🚨 *LIQUIDATION IMMINENT\\!*
Your position will be *LIQUIDATED* if health factor drops below 1\\.0\\!
📊 *Critical Status:*
├ Health Factor: 🔴 \`${escapeMarkdown(data.currentHealthFactor.toFixed(2))}\`
├ Collateral Value: \`${escapeMarkdown(data.collateralValue)}\`
└ Outstanding Debt: \`${escapeMarkdown(data.debtValue)}\`
🆘 *ACT NOW to save your collateral\\!*
[Emergency Repay](https:
`,

    [NotificationType.CREDIT_SCORE_UPDATED]: (data: CreditScoreNotificationData): string => {
        const change = data.newScore - data.oldScore;
        const emoji = change >= 0 ? '📈' : '📉';
        const sign = change >= 0 ? '+' : '';
        return `
${emoji} *Credit Score Updated*
Your LYNQ Credit Score has been updated\\.
📊 *Score Change:*
├ Previous: \`${data.oldScore}\`
├ Current: \`${data.newScore}\`
└ Change: ${sign}${change}
${data.reason ? `📝 _Reason: ${escapeMarkdown(data.reason)}_` : ''}
[View Full Report](https:
`;
    },

    [NotificationType.TIER_UPGRADED]: (data: CreditScoreNotificationData): string => `
🎉 *Tier Upgrade\\!*
Congratulations\\! You've been promoted to a higher tier\\!
${getTierEmoji(data.oldTier)} ${escapeMarkdown(data.oldTier)} → ${getTierEmoji(data.newTier)} *${escapeMarkdown(data.newTier)}*
📊 *New Benefits:*
├ Lower interest rates
├ Higher borrowing limits
└ Priority support
🏆 _Keep up the great work\\!_
`,

    [NotificationType.TIER_DOWNGRADED]: (data: CreditScoreNotificationData): string => `
📉 *Tier Change*
Your tier has been adjusted\\.
${getTierEmoji(data.oldTier)} ${escapeMarkdown(data.oldTier)} → ${getTierEmoji(data.newTier)} ${escapeMarkdown(data.newTier)}
📝 _Reason: ${escapeMarkdown(data.reason || 'Score threshold not met')}_
💡 _Improve your score by making timely payments and maintaining healthy positions\\._
[View Analytics](https:
`,

    [NotificationType.VOUCH_RECEIVED]: (data: VouchNotificationData): string => `
🤝 *New Vouch Received\\!*
Someone has vouched for you on LYNQ\\!
📊 *Vouch Details:*
├ From: \`${escapeMarkdown(data.voucherAddress.slice(0, 6))}...${escapeMarkdown(data.voucherAddress.slice(-4))}\`
├ Amount: \`${escapeMarkdown(formatAmount(data.amount))}\` MNT
└ ${data.message ? `Message: "${escapeMarkdown(data.message)}"` : 'No message'}
⭐ _This vouch can help you get better loan terms\\!_
[View Vouches](https:
`,

    [NotificationType.VOUCH_UTILIZED]: (data: VouchNotificationData): string => `
✅ *Vouch Utilized*
Your vouch has been used to back a loan\\.
📊 *Details:*
├ Borrower: \`${escapeMarkdown(data.voucherAddress.slice(0, 6))}...${escapeMarkdown(data.voucherAddress.slice(-4))}\`
├ Staked Amount: \`${escapeMarkdown(formatAmount(data.amount))}\` MNT
└ Status: Active
💡 _Your stake is securing this loan\\. You'll be notified of any status changes\\._
`,

    [NotificationType.DEPOSIT_CONFIRMED]: (data: TransactionNotificationData): string => `
💰 *Deposit Confirmed*
Your deposit has been successfully processed\\.
📊 *Transaction Details:*
├ Amount: \`${escapeMarkdown(formatAmount(data.amount))}\` ${escapeMarkdown(data.asset)}
├ Chain: ${escapeMarkdown(data.chain)}
└ Tx: [View on Explorer](https:
✅ _Funds are now available in your account\\._
`,

    [NotificationType.WITHDRAWAL_CONFIRMED]: (data: TransactionNotificationData): string => `
📤 *Withdrawal Confirmed*
Your withdrawal has been successfully processed\\.
📊 *Transaction Details:*
├ Amount: \`${escapeMarkdown(formatAmount(data.amount))}\` ${escapeMarkdown(data.asset)}
├ Chain: ${escapeMarkdown(data.chain)}
└ Tx: [View on Explorer](https:
✅ _Funds have been sent to your wallet\\._
`,

    [NotificationType.REFINANCE_AVAILABLE]: (data: LoanNotificationData): string => `
💡 *Refinance Opportunity Available\\!*
Your improved credit score qualifies you for better loan terms\\.
📊 *Current Loan:*
├ Loan ID: \`${escapeMarkdown(data.loanId.slice(0, 8))}...\`
├ Current Rate: ${escapeMarkdown(data.interestRate || 'N/A')}%
└ Outstanding: \`${escapeMarkdown(formatAmount(data.amount))}\` USDC
🎯 _Check your dashboard for refinancing options\\!_
[Refinance Now](https:
`,

    [NotificationType.REFINANCE_COMPLETED]: (data: LoanNotificationData): string => `
✅ *Refinance Complete\\!*
Your loan has been successfully refinanced\\.
📊 *Updated Terms:*
├ New Rate: ${escapeMarkdown(data.interestRate || 'N/A')}%
├ Amount: \`${escapeMarkdown(formatAmount(data.amount))}\` USDC
└ Tx: [View on Explorer](https:
💰 _You're now saving on interest payments\\!_
`,

    [NotificationType.WELCOME]: (): string => `
👋 *Welcome to LYNQ\\!*
Your Telegram notifications are now enabled\\.
🔔 *You'll receive alerts for:*
├ Loan status changes
├ Health factor warnings
├ Credit score updates
├ Vouch notifications
└ Transaction confirmations
⚙️ _Customize your preferences in the app settings\\._
[Open Dashboard](https:
`,

    [NotificationType.DAILY_SUMMARY]: (data: Record<string, any>): string => `
📊 *Daily Summary*
Here's your LYNQ activity for today\\.
📈 *Portfolio Overview:*
├ Total Borrowed: \`$${escapeMarkdown(formatAmount(data.totalBorrowed || '0'))}\`
├ Total Collateral: \`$${escapeMarkdown(formatAmount(data.totalCollateral || '0'))}\`
├ Health Factor: ${getHealthFactorEmoji(data.avgHealthFactor || 2)} \`${escapeMarkdown(String(data.avgHealthFactor?.toFixed(2) || 'N/A'))}\`
└ Credit Score: \`${data.creditScore || 'N/A'}\`
${data.alerts?.length ? `⚠️ *Alerts:* ${data.alerts.length}` : '✅ No alerts today'}
[View Details](https:
`,

    [NotificationType.PRICE_ALERT]: (data: Record<string, any>): string => `
📊 *Price Alert*
${escapeMarkdown(data.asset || 'ETH')} has moved significantly\\.
├ Current: \`$${escapeMarkdown(formatAmount(data.currentPrice || '0'))}\`
├ Change: ${data.changePercent >= 0 ? '📈' : '📉'} ${escapeMarkdown(String(data.changePercent || 0))}%
└ 24h Volume: \`$${escapeMarkdown(formatAmount(data.volume || '0', 0))}\`
💡 _This may affect your collateral values\\._
`,
};

export type TemplateData = LoanNotificationData | CreditScoreNotificationData | VouchNotificationData | HealthFactorNotificationData | TransactionNotificationData | Record<string, any>;

export const getMessageTemplate = (type: NotificationType, data: TemplateData): string => {
    const template = MessageTemplates[type];
    if (!template) {
        return `📨 *Notification*\n\nYou have a new notification from LYNQ\\.`;
    }
    return template(data as any);
};
