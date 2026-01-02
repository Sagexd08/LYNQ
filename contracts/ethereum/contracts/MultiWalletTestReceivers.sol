
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./FlashLoanProvider.sol";


contract MultiWalletFlashLoanReceiverTest is IMultiWalletFlashLoanReceiver {
    using SafeERC20 for IERC20;

    address private flashLoanProvider;
    address private token;

    constructor(address _flashLoanProvider, address _token) {
        require(_flashLoanProvider != address(0), "Invalid provider");
        require(_token != address(0), "Invalid token");
        flashLoanProvider = _flashLoanProvider;
        token = _token;
    }

    
    function executeMultiWalletOperation(
        address asset,
        uint256 totalAmount,
        uint256 premium,
        address[] calldata recipients,
        uint256[] calldata allocations,
        address, 
        bytes calldata 
    ) external override returns (bool success) {
        require(msg.sender == flashLoanProvider, "Only flashLoanProvider can call");
        require(asset == token, "Wrong token");

        
        for (uint256 i = 0; i < recipients.length; i++) {
            IERC20(asset).safeTransfer(recipients[i], allocations[i]);
        }

        
        
        

        
        
        
        
        
        for (uint256 i = 0; i < recipients.length; i++) {
            
            
            uint256 recipientBalance = IERC20(asset).balanceOf(recipients[i]);
            if (recipientBalance >= allocations[i]) {
                
                
            }
        }

        
        uint256 amountOwed = totalAmount + premium;
        require(
            IERC20(asset).balanceOf(address(this)) >= amountOwed,
            "Insufficient balance to repay"
        );

        IERC20(asset).safeTransfer(flashLoanProvider, amountOwed);

        return true;
    }

    
    receive() external payable {}
}


contract FailingMultiWalletReceiver is IMultiWalletFlashLoanReceiver {
    using SafeERC20 for IERC20;

    address private flashLoanProvider;
    address private token;

    constructor(address _flashLoanProvider, address _token) {
        flashLoanProvider = _flashLoanProvider;
        token = _token;
    }

    
    function executeMultiWalletOperation(
        address asset,
        uint256 totalAmount,
        uint256 premium,
        address[] calldata recipients,
        uint256[] calldata allocations,
        address initiator,
        bytes calldata params
    ) external override returns (bool success) {
        require(msg.sender == flashLoanProvider, "Only flashLoanProvider can call");

        
        

        
        for (uint256 i = 0; i < recipients.length; i++) {
            
        }

        
        return false;
    }

    receive() external payable {}
}


contract TestToken is IERC20 {
    string public name = "Test Token";
    string public symbol = "TEST";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(string memory _name, string memory _symbol, uint256 initialSupply) {
        name = _name;
        symbol = _symbol;
        totalSupply = initialSupply;
        balanceOf[msg.sender] = initialSupply;
    }

    function transfer(address recipient, uint256 amount) public returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[recipient] += amount;
        emit Transfer(msg.sender, recipient, amount);
        return true;
    }

    function approve(address spender, uint256 amount) public returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public returns (bool) {
        require(balanceOf[sender] >= amount, "Insufficient balance");
        require(allowance[sender][msg.sender] >= amount, "Allowance exceeded");
        balanceOf[sender] -= amount;
        balanceOf[recipient] += amount;
        allowance[sender][msg.sender] -= amount;
        emit Transfer(sender, recipient, amount);
        return true;
    }
}
