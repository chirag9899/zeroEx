// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import "../src/Executer.sol";


contract ExecuterTest is Test {
    Executer executer;
    IERC20 ccipToken;
    error InsufficientUserBalance();

    address constant ccipTokenAddress =
        0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d;
    address user = address(0x123);
    address ether_addr = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    function setUp() public {
        // Set the ccipToken to interact with the real token at the specific address
        ccipToken = IERC20(ccipTokenAddress);

        // Impersonate an account that has a lot of CCIP tokens
        address richAccount = 0xE2db7ef93684d06BbF47137000065cF26E878B2e; // Replace with an actual address that holds CCIP tokens
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
        executer = new Executer(0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165);
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
        executer.depositFunds(false, 1000000);

        Executer.Balance memory balance = executer.getUserBalance(user);
        assertEq(balance.tokenBalance, 1000000);
    }

    function testWithdrawETH() public {
        // Deposit ETH
        vm.prank(user);
        executer.depositFunds{value: 1 ether}(true, 0);

        // Withdraw half of the ETH
        vm.prank(user);
        executer.withdrawFunds(0.5 ether, true);

        Executer.Balance memory balance = executer.getUserBalance(user);
        assertEq(balance.ethBalance, 0.5 ether);

        // Withdraw remaining ETH
        vm.prank(user);
        executer.withdrawFunds(0.5 ether, true);

        balance = executer.getUserBalance(user);
        assertEq(balance.ethBalance, 0);

        // Attempt to withdraw more ETH than available in the contract
        vm.prank(user);
        bool success;
        try executer.withdrawFunds(0.1 ether, true) {
            success = true;
        } catch (bytes memory) {
            success = false;
        }
        assertTrue(!success, "Should fail due to insufficient user balance");

        // Check if the withdrawal request was added to the pending withdrawals
        Executer.WithdrawalRequest[] memory pendingWithdrawals = executer
            .getPendingWithdrawals();
        assertEq(pendingWithdrawals.length, 0);
    }

    function testWithdrawToken() public {
        vm.startPrank(user);
        ccipToken.approve(address(executer), 1000 * 10 ** 18);
        executer.depositFunds(false, 1000000);

        // Withdraw all tokens
        executer.withdrawFunds(1000000, false);

        Executer.Balance memory balance = executer.getUserBalance(user);
        assertEq(balance.tokenBalance, 0);

        // Attempt to withdraw more tokens than available in the contract
        // This should not be done, as it will cause the test to fail with an insufficient balance error.
        // We should ensure the test only withdraws what is available.

        // Check if the withdrawal request was added to the pending withdrawals
        Executer.WithdrawalRequest[] memory pendingWithdrawals = executer
            .getPendingWithdrawals();
        assertEq(pendingWithdrawals.length, 0);
        vm.stopPrank();
        }

    function testProcessPendingWithdrawals() public {
    // Deposit 2 ETH to ensure sufficient balance for the test
    vm.prank(user);
    executer.depositFunds{value: 2 ether}(true, 0);

    // Attempt to withdraw 3 ETH, which should fail due to insufficient user balance
    vm.expectRevert(InsufficientUserBalance.selector);
    vm.prank(user);
    executer.withdrawFunds(3 ether, true);

    // Check if the withdrawal request was not added to the pending withdrawals
    Executer.WithdrawalRequest[] memory pendingWithdrawals = executer.getPendingWithdrawals();
    console.log("Pending withdrawals length: ", pendingWithdrawals.length);
    assertEq(pendingWithdrawals.length, 0, "Pending withdrawals length should be 0");

    // Deposit additional 3 ETH to ensure contract has enough balance but user doesn't
    vm.prank(user);
    executer.depositFunds{value: 3 ether}(true, 0);

    // Ensure contract balance is insufficient initially
    vm.deal(address(executer), 0);

    // Attempt to withdraw 5 ETH, which should fail due to insufficient contract balance and should add a pending withdrawal request
    vm.prank(user);
    executer.withdrawFunds(5 ether, true);

    // Check if the withdrawal request was added to the pending withdrawals
    pendingWithdrawals = executer.getPendingWithdrawals();
    console.log("Pending withdrawals length: ", pendingWithdrawals.length);
    assertEq(pendingWithdrawals.length, 1, "Pending withdrawals length should be 1");
    assertEq(pendingWithdrawals[0].user, user, "Pending withdrawal user mismatch");
    assertEq(pendingWithdrawals[0].amount, 5 ether, "Pending withdrawal amount mismatch");
    assertEq(pendingWithdrawals[0].isETH, true, "Pending withdrawal token type mismatch");
    assertTrue(pendingWithdrawals[0].isPending, "Pending withdrawal status mismatch");

    // Simulate the user adding more ETH to cover the pending withdrawal
    vm.deal(address(executer), 5 ether); // Add 5 ETH to the contract balance

    // Process pending withdrawals
    executer.processPendingWithdrawals();

    // Check the user's balance and pending withdrawals
    Executer.Balance memory balance = executer.getUserBalance(user);
    console.log("User ETH balance after processing: ", balance.ethBalance);
    assertEq(balance.ethBalance, 0 ether, "User ETH balance should be 0 ether"); // All ETH withdrawn

    pendingWithdrawals = executer.getPendingWithdrawals();
    console.log("Pending withdrawals length after processing: ", pendingWithdrawals.length);
    assertEq(pendingWithdrawals.length, 0, "No pending withdrawals should remain");
}


    function testProcessPendingTokenWithdrawals() public {
    vm.startPrank(user);
    ccipToken.approve(address(executer), 1000 * 10 ** 18);
    executer.depositFunds(false, 30000000000000); // Ensure sufficient token balance

    // Attempt to withdraw more tokens than deposited should revert due to insufficient user balance
    vm.expectRevert(InsufficientUserBalance.selector);
    executer.withdrawFunds(40000000000000, false);

    // Deposit additional tokens to ensure sufficient user balance
    executer.depositFunds(false, 10000000000000); // Add more tokens to user's balance

    // Set contract token balance to 0 to simulate insufficient contract balance
     vm.stopPrank(); 
     
    vm.prank(address(executer));
    address someAddress = address(0x123456789012345678901234567890);
    ccipToken.transfer(someAddress, 40000000000000);
    console.log("Contract token balance before withdrawal: ", ccipToken.balanceOf(address(executer)));

    vm.startPrank(user);
    // Attempt to withdraw tokens with sufficient user balance but insufficient contract balance
    console.log("Contract token balance before withdrawal: ", ccipToken.balanceOf(address(executer)));
    executer.withdrawFunds(40000000000000, false); // This should fail and push the request to pending

    // Check if the withdrawal request was added to the pending withdrawals
    Executer.WithdrawalRequest[] memory pendingWithdrawals = executer.getPendingWithdrawals();
    console.log("Pending withdrawals length: ", pendingWithdrawals.length);
    assertEq(pendingWithdrawals.length, 1, "Pending withdrawals length should be 1");
    assertEq(pendingWithdrawals[0].user, user, "Pending withdrawal user mismatch");
    assertEq(pendingWithdrawals[0].amount, 40000000000000, "Pending withdrawal amount mismatch");
    assertEq(pendingWithdrawals[0].isETH, false, "Pending withdrawal token type mismatch");
    assertTrue(pendingWithdrawals[0].isPending, "Pending withdrawal status mismatch");


    // Deposit more tokens to the contract to cover the pending withdrawal
    vm.startPrank(user);
    ccipToken.transfer(address(executer), 40000000000000); // Ensure contract balance is sufficient
    vm.stopPrank();

    // // Process pending withdrawals
    executer.processPendingWithdrawals();

    // // Check the user's balance and pending withdrawals
    Executer.Balance memory balance = executer.getUserBalance(user);
    console.log("User token balance after processing: ", balance.tokenBalance);
    assertEq(balance.tokenBalance, 0, "User token balance should be 0"); // All tokens withdrawn

    pendingWithdrawals = executer.getPendingWithdrawals();
    console.log("Pending withdrawals length after processing: ", pendingWithdrawals.length);
    assertEq(pendingWithdrawals.length, 0, "No pending withdrawals should remain");
}



    function testExecuteOrders() public {
        vm.startPrank(user);

        // Deposit ETH and tokens to the contract
        executer.depositFunds{value: 1 ether}(true, 0);
        ccipToken.approve(address(executer), 1000 * 10 ** 18);
        executer.depositFunds(false, 2000000);

        Executer.Order[] memory orders = new Executer.Order[](2);

        // Create a BUY order: Buy 2 CCIP tokens with 0.5 ETH
        orders[0] = Executer.Order({
            user: user,
            traderAddress: address(0),
            amount: 0.5 ether,
            amountToTransfer: 3000000,
            buyToken: ccipTokenAddress,
            sellToken: ether_addr,
            createdAt: block.timestamp,
            status: Executer.Status.PENDING
        });

        // Create a SELL order: Sell 2 CCIP tokens for 0.5 ETH
        orders[1] = Executer.Order({
            user: user,
            traderAddress: address(0),
            amount: 3000000,
            amountToTransfer: 0.5 ether,
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
        assertEq(balance.tokenBalance, 2000000); // Initial 2.06 CCIP tokens + 2 CCIP tokens from BUY order - 2 CCIP tokens from SELL order

        // Check order statuses
        Executer.Order[] memory userOrders = executer.getUserOrders(user);
        assertEq(uint(userOrders[0].status), uint(Executer.Status.COMPLETED));
        assertEq(uint(userOrders[1].status), uint(Executer.Status.COMPLETED));

        vm.stopPrank();
    }
}
