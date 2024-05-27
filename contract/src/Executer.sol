// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Executer is ReentrancyGuard {

      enum OrderType {
        BUY,
        SELL
    }

    enum Status {
        COMPLETED,
        PENDING,
        FAILED
    }

   struct Balance {
        uint256 ethBalance;
        uint256 tokenBalance;
    }
     struct Order {
        address user;
        address traderAddress;
        uint256 amount;
        uint256 amountToTransfer;
        OrderType orderType;
        address buyToken;
        address sellToken;
        uint256 createdAt;
        Status status;

    }


    mapping(address => Balance) public userBalances;
    mapping(address => Order[]) public userOrders;
    address constant ETHER = address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);
    IERC20 public constant CCIP_TOKEN = IERC20(0xFd57b4ddBf88a4e07fF4e34C487b99af2Fe82a05);

    // Custom errors
    error DepositAmountZero();
    error WithdrawalAmountZero();
    error InsufficientBalance();
    error UndefinedToken();

    event Deposit(address indexed user, uint256 ethAmount, uint256 tokenAmount);
    event Withdrawal(address indexed user, uint256 amount);
    event OrderExecuted(
    address indexed user,
    uint256 amount,
    string orderType,
    address indexed buyToken,
    address indexed sellToken,
    Status status
);



    function depositFunds(bool isETH, uint256 amount) public payable {
        if (isETH) {
            if (msg.value == 0) {
                revert DepositAmountZero();
            }
            userBalances[msg.sender].ethBalance += msg.value;
        } else {
            if (amount == 0) {
                revert DepositAmountZero();
            }
            require(
                CCIP_TOKEN.transferFrom(msg.sender, address(this), amount),
                "Token transfer failed"
            );
            userBalances[msg.sender].tokenBalance += amount;
        }
    }

    function withdrawFunds(uint256 amount, bool isETH) public nonReentrant {
        if (amount == 0) {
            revert WithdrawalAmountZero();
        }

        if (isETH) {
            if (userBalances[msg.sender].ethBalance < amount) {
                revert InsufficientBalance();
            }
            userBalances[msg.sender].ethBalance -= amount;

            uint256 contractBalance = address(this).balance;
            if (contractBalance < amount) {
                emit Withdrawal(msg.sender, amount);
                revert InsufficientBalance();
            }

            payable(msg.sender).transfer(amount);
            emit Withdrawal(msg.sender, amount);
        } else {
            if (userBalances[msg.sender].tokenBalance < amount) {
                revert InsufficientBalance();
            }
            userBalances[msg.sender].tokenBalance -= amount;

            uint256 contractBalance = CCIP_TOKEN.balanceOf(address(this));
            if (contractBalance < amount) {
                emit Withdrawal(msg.sender, amount);
                revert InsufficientBalance();
            }

            require(
                CCIP_TOKEN.transfer(msg.sender, amount),
                "Token transfer failed"
            );
            emit Withdrawal(msg.sender, amount);
        }
    }


    function executeOrders(Order[] calldata orders) public nonReentrant {
        
        for (uint256 i = 0; i < orders.length; i++) {
            Order memory order = orders[i];

            uint256 contractBalance ;

            if ( order.buyToken == ETHER ) {
                 contractBalance = address(this).balance;

                userBalances[order.user].ethBalance += order.amountToTransfer;
                userBalances[order.user].tokenBalance -= order.amount;

                // order.status = Status.PENDING; 

                // if (order.amountToTransfer > 0 && contractBalance > order.amountToTransfer) { 
                //     (bool sent, ) = order.user.call{value: order.amountToTransfer}("");
                //     order.status` = sent ? Status.COMPLETED : Status.PENDING;
                // }

                 order.status = Status.COMPLETED;

            } 
            else if ( order.buyToken == address(CCIP_TOKEN) ) {
                contractBalance = IERC20(order.buyToken).balanceOf(address(this));

                userBalances[order.user].ethBalance -= order.amount;
                userBalances[order.user].tokenBalance += order.amountToTransfer;

                //   order.status = Status.PENDING; 

                // if (order.amountToTransfer > 0 && contractBalance > order.amountToTransfer) { 
                //     IERC20(order.buyToken).transfer(order.user, order.amountToTransfer);
                // }
                    order.status = Status.COMPLETED;
            }
            else {
            order.status = Status.FAILED; 
            revert UndefinedToken();
            }

            userOrders[order.user].push(order);

        }

    }

    
      function getUserOrders(address user) external view returns (Order[] memory) {
        return userOrders[user];
    }

    function getUserBalance(address user) public view returns (Balance memory) {
        return userBalances[user];
    }
}
