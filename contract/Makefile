.PHONY: Add

Add:
	@echo "Building target Add"
	@bash -c 'source /home/gitpod/.bashrc && echo ".bashrc sourced"'

fork:
	anvil --fork-url https://eth-sepolia.g.alchemy.com/v2/gFkrlIRMg8SzDl-0M2Gr_rVL0af-yF33


# anvil --fork-url https://rpc.ankr.com/eth

# Define the variable with a default value
TEST_NAME ?= testDepositETH

run:
	forge test --fork-url http://127.0.0.1:8545 --mt $(TEST_NAME) -vv
