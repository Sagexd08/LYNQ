export const CONTRACT_ADDRESSES = {
  mantle: {
    LoanCore: '0x28d19bce67566423719B2E471f578b765F4375BA',
    CollateralVault: '0x52F3f3C2d1610454E6c3345b5E02DA767dC4f4D2',
    CreditScoreVerifier: '0x146038F8b136596f9C3EaBb9e531d9548d593d62',
    GovernanceToken: '0xeD42659476443dE01d113322E156913EA056332F', 
    
    CollateralToken: '0xA386808b7ed83be964caB5c022A19d58cca8039e', 
    StableToken: '0xA386808b7ed83be964caB5c022A19d58cca8039e',     
  },
  mantleSepolia: {
    LoanCore: '0x16fB626C9Ef59aa865366d086931FAcfDc70490F',
    CollateralVault: '0x8D65d4bbED41a9BbDDEdA63c5798e16058e31A4A',
    CreditScoreVerifier: '0x47B887406f3773fdc45C50692ba8e37732036b01',
    GovernanceToken: '0x9cbC3Fb3Bb48c70a0feB5EF7487187AC298C537C',
    CollateralToken: '0x12345Fb3Bb48c70a0feB5EF7487187AC298C537D', 
    StableToken: '0x56789Fb3Bb48c70a0feB5EF7487187AC298C537E'  
  }
};

export const LOAN_CORE_ABI = [
  "function repay(uint256 loanId, uint256 amount) external",
  "function getLoan(uint256 loanId) external view returns (uint256 amount, uint256 collateral, uint256 interestRate, uint256 dueDate, uint8 status)",
  "function createLoan(uint256 amount, uint256 collateralAmount, address collateralToken) external",
  "event LoanRepaid(uint256 indexed loanId, uint256 amount, address indexed payer)",
  "event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 amount)",
  "function refinanceLoan(uint256 loanId, uint256 newInterestRate, uint256 newDuration, uint256 timestamp, bytes memory signature) external"
];

export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)"
];

export const COLLATERAL_VAULT_ABI = [
  "function deposit(address token, uint256 amount) external",
  "function withdraw(address token, uint256 amount) external"
];
