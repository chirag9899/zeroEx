// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@chainlink/contracts-ccip/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/IERC20.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {OwnerIsCreator} from "@chainlink/contracts-ccip/src/v0.8/shared/access/OwnerIsCreator.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {SafeERC20} from "@chainlink/contracts-ccip/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/utils/SafeERC20.sol";

contract Executer is ReentrancyGuard, OwnerIsCreator {
    using SafeERC20 for IERC20;

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
        address buyToken;
        address sellToken;
        uint256 createdAt;
        Status status;
    }

    struct WithdrawalRequest {
        address user;
        uint256 amount;
        bool isETH;
        bool isPending;
        uint256 pendingAt;
    }

    mapping(address => Balance) public userBalances;
    mapping(address => Order[]) public userOrders;
    WithdrawalRequest[] public pendingWithdrawals;
    address constant ETHER = address(0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE);
    IERC20 public constant CCIP_TOKEN = IERC20(0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d);

    mapping(uint64 => bool) public allowlistedChains;
    IRouterClient private s_router;


    // Custom errors
    error DepositAmountZero();
    error WithdrawalAmountZero();
    error InsufficientBalance();
    error UndefinedToken();
    error InsufficientUserBalance();
    error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees);
    error NothingToWithdraw();
    error FailedToWithdrawEth(address owner, address target, uint256 value);
    error DestinationChainNotAllowed(uint64 destinationChainSelector);
    error SourceChainNotAllowed(uint64 sourceChainSelector);
    error SenderNotAllowed(address sender);
    error InvalidReceiverAddress();
    error DestinationChainNotAllowlisted(uint64 destinationChainSelector); // Used when the destination chain has not been allowlisted by the contract owner.


    event Deposit(address indexed user, uint256 ethAmount, uint256 tokenAmount);
    event Withdrawal(address indexed user, uint256 amount, bool isETH);
    event WithdrawalRequestAdded(address indexed user, uint256 amount, bool isETH);
    event WithdrawalRequestProcessed(address indexed user, uint256 amount, bool isETH);
    event OrderExecuted(address indexed user, uint256 amount, address indexed buyToken, address indexed sellToken, Status status);
    event MessageSent(bytes32 indexed messageId, uint64 indexed destinationChainSelector, address receiver, string text, address token, uint256 tokenAmount, address feeToken, uint256 fees);
    event MessageReceived(bytes32 indexed messageId, uint64 indexed sourceChainSelector, address sender, string text, address token, uint256 tokenAmount);
    event TokensTransferred(
    bytes32 indexed messageId, // The unique ID of the message.
    uint64 indexed destinationChainSelector, // The chain selector of the destination chain.
    address receiver, // The address of the receiver on the destination chain.
    address token, // The token address that was transferred.
    uint256 tokenAmount, // The token amount that was transferred.
    address feeToken, // the token address used to pay CCIP fees.
    uint256 fees // The fees paid for sending the message.
);  

    constructor(address _router) {
        s_router = IRouterClient(_router);
    }
    

     modifier onlyAllowlistedChain(uint64 _destinationChainSelector) {
        if (!allowlistedChains[_destinationChainSelector])
            revert DestinationChainNotAllowlisted(_destinationChainSelector);
        _;
    }


    modifier validateReceiver(address _receiver) {
        if (_receiver == address(0)) revert InvalidReceiverAddress();
        _;
    }


    function allowlistDestinationChain(
        uint64 _destinationChainSelector,
        bool allowed
    ) external onlyOwner {
        allowlistedChains[_destinationChainSelector] = allowed;
    }

    function depositFunds(bool isETH, uint256 amount) public payable {
        if (isETH) {
            if (msg.value == 0) revert DepositAmountZero();
            userBalances[msg.sender].ethBalance += msg.value;
        } else {
            if (amount == 0) revert DepositAmountZero();
            require(CCIP_TOKEN.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
            userBalances[msg.sender].tokenBalance += amount;
        }
        emit Deposit(msg.sender, isETH ? msg.value : 0, isETH ? 0 : amount);
    }

    function withdrawFunds(uint256 amount, bool isETH) public nonReentrant {
        if (amount == 0) revert WithdrawalAmountZero();

        if (isETH) {
            if (userBalances[msg.sender].ethBalance < amount) revert InsufficientUserBalance();
            uint256 contractBalance = address(this).balance;
            if (contractBalance < amount) {
                pendingWithdrawals.push(WithdrawalRequest(msg.sender, amount, true, true, block.timestamp));
                emit WithdrawalRequestAdded(msg.sender, amount, true);
                return;
            }
            userBalances[msg.sender].ethBalance -= amount;
            payable(msg.sender).transfer(amount);
            emit Withdrawal(msg.sender, amount, true);
        } else {
            if (userBalances[msg.sender].tokenBalance < amount) revert InsufficientUserBalance();
            uint256 contractBalance = CCIP_TOKEN.balanceOf(address(this));
            if (contractBalance < amount) {
                pendingWithdrawals.push(WithdrawalRequest(msg.sender, amount, false, true, block.timestamp));
                emit WithdrawalRequestAdded(msg.sender, amount, false);
                return;
            }
            userBalances[msg.sender].tokenBalance -= amount;
            require(CCIP_TOKEN.transfer(msg.sender, amount), "Token transfer failed");
            emit Withdrawal(msg.sender, amount, false);
        }
    }

    function processPendingWithdrawals() public nonReentrant {
        uint256 contractEthBalance = address(this).balance;
        uint256 contractTokenBalance = CCIP_TOKEN.balanceOf(address(this));

        for (uint256 i = 0; i < pendingWithdrawals.length; i++) {
            WithdrawalRequest storage request = pendingWithdrawals[i];
            if (request.isPending) {
                if (request.isETH && contractEthBalance >= request.amount) {
                    userBalances[request.user].ethBalance -= request.amount;
                    payable(request.user).transfer(request.amount);
                    request.isPending = false;
                    emit WithdrawalRequestProcessed(request.user, request.amount, true);
                } else if (!request.isETH && contractTokenBalance >= request.amount) {
                    userBalances[request.user].tokenBalance -= request.amount;
                    CCIP_TOKEN.transfer(request.user, request.amount);
                    request.isPending = false;
                    emit WithdrawalRequestProcessed(request.user, request.amount, false);
                }
            }
        }

        for (uint256 i = 0; i < pendingWithdrawals.length; ) {
            if (!pendingWithdrawals[i].isPending) {
                pendingWithdrawals[i] = pendingWithdrawals[pendingWithdrawals.length - 1];
                pendingWithdrawals.pop();
            } else {
                i++;
            }
        }
    }

    function executeOrders(Order[] calldata orders) public nonReentrant {
        for (uint256 i = 0; i < orders.length; i++) {
            Order memory order = orders[i];
            if (order.buyToken == ETHER) {
                userBalances[order.user].ethBalance += order.amountToTransfer;
                userBalances[order.user].tokenBalance -= order.amount;
                order.status = Status.COMPLETED;
            } else if (order.buyToken == address(CCIP_TOKEN)) {
                userBalances[order.user].ethBalance -= order.amount;
                userBalances[order.user].tokenBalance += order.amountToTransfer;
                order.status = Status.COMPLETED;
            } else {
                order.status = Status.FAILED;
                revert UndefinedToken();
            }
            userOrders[order.user].push(order);
            emit OrderExecuted(order.user, order.amount, order.buyToken, order.sellToken, order.status);
        }
    }

    function getUserOrders(address user) external view returns (Order[] memory) {
        return userOrders[user];
    }

    function getUserBalance(address user) public view returns (Balance memory) {
        return userBalances[user];
    }

    function getPendingWithdrawals() external view returns (WithdrawalRequest[] memory) {
        return pendingWithdrawals;
    }


    function transferTokensPayNative(
    uint64 _destinationChainSelector,
    address _receiver,
    address _token,
    uint256 _amount
    )
        external
        onlyOwner
        onlyAllowlistedChain(_destinationChainSelector)
        validateReceiver(_receiver)
        returns (bytes32 messageId)
    {
        // Create an EVM2AnyMessage struct in memory with necessary information for sending a cross-chain message
        // address(0) means fees are paid in native gas
        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(
            _receiver,
            _token,
            _amount,
            address(0)
        );


        // Get the fee required to send the message
        uint256 fees = s_router.getFee(
            _destinationChainSelector,
            evm2AnyMessage
        );

        if (fees > address(this).balance)
            revert NotEnoughBalance(address(this).balance, fees);

        // approve the Router to spend tokens on contract's behalf. It will spend the amount of the given token
        IERC20(_token).approve(address(s_router), _amount);

        // Send the message through the router and store the returned message ID
        messageId = s_router.ccipSend{value: fees}(
            _destinationChainSelector,
            evm2AnyMessage
        );

        // Emit an event with message details
        emit TokensTransferred(
            messageId,
            _destinationChainSelector,
            _receiver,
            _token,
            _amount,
            address(0),
            fees
        );

        // Return the message ID
        return messageId;
    }



    function _buildCCIPMessage(
        address _receiver,
        address _token,
        uint256 _amount,
        address _feeTokenAddress
    ) private pure returns (Client.EVM2AnyMessage memory) {
        // Set the token amounts
        Client.EVMTokenAmount[]
            memory tokenAmounts = new Client.EVMTokenAmount[](1);
        tokenAmounts[0] = Client.EVMTokenAmount({
            token: _token,
            amount: _amount
        });

        // Create an EVM2AnyMessage struct in memory with necessary information for sending a cross-chain message
        return
            Client.EVM2AnyMessage({
                receiver: abi.encode(_receiver), // ABI-encoded receiver address
                data: "", // No data
                tokenAmounts: tokenAmounts, // The amount and type of token being transferred
                extraArgs: Client._argsToBytes(
                    // Additional arguments, setting gas limit to 0 as we are not sending any data
                    Client.EVMExtraArgsV1({gasLimit: 0})
                ),
                // Set the feeToken to a feeTokenAddress, indicating specific asset will be used for fees
                feeToken: _feeTokenAddress
            });
    }

    receive() external payable {}
}

