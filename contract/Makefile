.PHONY: Add

Add:
	@echo "Building target Add"
	@bash -c 'source /home/gitpod/.bashrc && echo ".bashrc sourced"'

fork:
	anvil --fork-url https://arb-sepolia.g.alchemy.com/v2/8kt_9nM3xUNeRw9EtlZq6OPaHEf8xmTv


# anvil --fork-url https://rpc.ankr.com/eth

# Define the variable with a default value
TEST_NAME ?= testDepositETH

run:
	forge test --fork-url http://127.0.0.1:8545 --mt $(TEST_NAME) -vvv
