// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import "../src/Executer.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ExecuterTest is Test {
    Executer executer;
    IERC20 ccipToken;

    address constant ccipTokenAddress = 0xFd57b4ddBf88a4e07fF4e34C487b99af2Fe82a05;
    address user = address(0x123);
    address ether_addr = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    function setUp() public {
        // Set the ccipToken to interact with the real token at the specific address
        ccipToken = IERC20(ccipTokenAddress);

        // Impersonate an account that has a lot of CCIP tokens
        address richAccount = 0x7962eBE98550d53A3608f9caADaCe72ef30De68C; // Replace with an actual address that holds CCIP tokens
        uint256 richAccountBalance = ccipToken.balanceOf(richAccount);
        console.log("Rich account balance: ", richAccountBalance); // Debugging line
        require(richAccountBalance > 0, "Rich account has no CCIP tokens");

        // Impersonate the rich account to transfer tokens
        vm.startPrank(richAccount);
        bool success = ccipToken.transfer(user, richAccountBalance);
        require(success, "Transfer failed");
        vm.stopPrank();

        // Verify the user's token balance
        uint256 userBalance = ccipToken.balanceOf(user);
        console.log("User balance after transfer: ", userBalance); // Debugging line
        require(userBalance > 0, "User did not receive CCIP tokens");

        // Provide some initial ETH balance to the user
        vm.deal(user, 100 ether);

        // Deploy the Executer contract
        executer = new Executer();
    }

    function testDepositETH() public {
        vm.prank(user);
        executer.depositFunds{value: 1 ether}(true, 0);

        Executer.Balance memory balance = executer.getUserBalance(user);
        assertEq(balance.ethBalance, 1 ether);
    }

    function testDepositToken() public {
        vm.prank(user);
        ccipToken.approve(address(executer), 1000 * 10 ** 18);

        vm.prank(user);
        executer.depositFunds(false, 10000000000000);

        Executer.Balance memory balance = executer.getUserBalance(user);
        assertEq(balance.tokenBalance, 10000000000000);
    }

    function testWithdrawETH() public {
        vm.prank(user);
        executer.depositFunds{value: 1 ether}(true, 0);

        vm.prank(user);
        executer.withdrawFunds(0.5 ether, true);

        Executer.Balance memory balance = executer.getUserBalance(user);
        assertEq(balance.ethBalance, 0.5 ether);
    }

    function testWithdrawToken() public {
        vm.startPrank(user);
        ccipToken.approve(address(executer), 1000 * 10 ** 18);
        executer.depositFunds(false, 10000000000000);

        executer.withdrawFunds(10000000000000, false);

        Executer.Balance memory balance = executer.getUserBalance(user);
        assertEq(balance.tokenBalance, 0);
        vm.stopPrank();
    }

    function testExecuteOrders() public {
    vm.startPrank(user);

    // Deposit ETH and tokens to the contract
    executer.depositFunds{value: 1 ether}(true, 0);
    ccipToken.approve(address(executer), 1000 * 10 ** 18);
    executer.depositFunds(false, 2060000000000000000);

    Executer.Order[] memory orders = new Executer.Order[](2);

    // Create a BUY order: Buy 2 CCIP tokens with 0.5 ETH
    orders[0] = Executer.Order({
        user: user,
        traderAddress: address(0),
        amount: 0.5 ether,
        amountToTransfer: 2000000000000000000,
        orderType: Executer.OrderType.BUY,
        buyToken: ccipTokenAddress,
        sellToken: ether_addr,
        createdAt: block.timestamp,
        status: Executer.Status.PENDING
    });

    // Create a SELL order: Sell 2 CCIP tokens for 0.5 ETH
    orders[1] = Executer.Order({
        user: user,
        traderAddress: address(0),
        amount: 2000000000000000000,
        amountToTransfer: 0.5 ether,
        orderType: Executer.OrderType.SELL,
        buyToken: ether_addr,
        sellToken: ccipTokenAddress,
        createdAt: block.timestamp,
        status: Executer.Status.PENDING
    });

    // Execute the orders
    executer.executeOrders(orders);

    // Check balances after execution
    Executer.Balance memory balance = executer.getUserBalance(user);
    assertEq(balance.ethBalance, 1 ether); // Initial 1 ETH deposit, spent 0.5 ETH on BUY order, received 0.5 ETH from SELL order
    assertEq(balance.tokenBalance, 2060000000000000000); // Initial 2.06 CCIP tokens + 2 CCIP tokens from BUY order - 2 CCIP tokens from SELL order

    // Check order statuses
    Executer.Order[] memory userOrders = executer.getUserOrders(user);
    assertEq(uint(userOrders[0].status), uint(Executer.Status.COMPLETED));
    assertEq(uint(userOrders[1].status), uint(Executer.Status.COMPLETED));

    vm.stopPrank();
}

  
}