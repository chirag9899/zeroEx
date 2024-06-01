from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from web3 import Web3
import json
import os
from eth_account import Account
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
import uvicorn
import asyncio


app = FastAPI()

private_key = "b0104cc3ae940f18c66addbb6076c5f98d1c0f350cc2fe0c1b585e66b7ec498b"
project_id = "8kt_9nM3xUNeRw9EtlZq6OPaHEf8xmTv"
w3_arb = Web3(Web3.HTTPProvider(f"https://arb-sepolia.g.alchemy.com/v2/{project_id}"))
w3_avax = Web3(Web3.HTTPProvider(f"https://avalanche-fuji-c-chain-rpc.publicnode.com"))

avax_usdc = "0x5425890298aed601595a70AB815c96711a31Bc65"
arb_usdc = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"
erc20_abi = json.loads('[{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]')

# USDC contract instances
usdc_arb = w3_arb.eth.contract(address=arb_usdc, abi=erc20_abi)
usdc_avax = w3_avax.eth.contract(address=avax_usdc, abi=erc20_abi)

chainsector_avax = "14767482510784806043"
chainsector_arb = "3478487238524512106"

# Load Contract ABI
try:
    with open('./abi/ccipAbi.json') as f:
        contract_abi = json.load(f)
except FileNotFoundError:
    raise HTTPException(status_code=500, detail="ABI file not found")
except json.JSONDecodeError:
    raise HTTPException(status_code=500, detail="Error decoding ABI file")

# Contract address
contract_address_arb = "0x35801db57ef45068A6865d21500CC1286Fb6b508"
contract_address_avax = "0xBEe17E63c27C1e91c5C5e84224bF97c6A1a37FfC"

uniswap_router_address_arb = "0x0000000000000000000000000000000000000000" 
uniswap_router_address_avax = "0x0000000000000000000000000000000000000000" 
uniswap_router_abi = json.loads('[{"constant":false,"inputs":[{"name":"amountOutMin","type":"uint256"},{"name":"path","type":"address[]"},{"name":"to","type":"address"},{"name":"deadline","type":"uint256"}],"name":"swapExactETHForTokens","outputs":[{"name":"","type":"uint256[]"}],"payable":true,"stateMutability":"payable","type":"function"}]')



# Create a contract instance
contract_arb = w3_arb.eth.contract(address=contract_address_arb, abi=contract_abi)
contract_avax = w3_avax.eth.contract(address=contract_address_avax, abi=contract_abi)

class TokenTransfer(BaseModel):
    destination_chain_selector: str
    receiver: str
    text: str
    token: str
    amount: int
    chain: str 

@app.get("/")
def read_root():
    return "hello"
    # return {"message": contract_abi}


class AllowlistChain(BaseModel):
    destination_chain_selector: int
    allowed: bool
    chain: str



def get_w3_and_contract(chain: str):
    if chain == "arb":
        return w3_arb, contract_arb
    elif chain == "avax":
        return w3_avax, contract_avax
    else:
        raise HTTPException(status_code=400, detail="Unsupported chain")


@app.post("/allowlist_destination_chain")
def allowlist_destination_chain(data: AllowlistChain):
    try:
        print(f"Received allowlist_destination_chain data: {data}")
        w3, contract = get_w3_and_contract(data.chain)
        # Ensure the private key is correct and get the account
        account = Account.from_key(private_key)
        nonce = w3.eth.get_transaction_count(account.address)

        print("data", contract.functions.allowlistDestinationChain)

        txn =  contract.functions.allowlistDestinationChain(
            data.destination_chain_selector,
            data.allowed
        ).build_transaction({
                'from': account.address,
                'chainId': 11155111,
                'gas': 100000,
                'gasPrice': w3.to_wei('50', 'gwei'),
                'nonce': nonce,
                })


        print(f"Transaction: {txn}")

        signed_txn = w3.eth.account.sign_transaction(txn, private_key)
        print(f"Signed Transaction: {signed_txn}")

        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        print(f"Transaction Hash: {tx_hash.hex()}")

        return {"tx_hash": tx_hash.hex()}

    except Exception as e:
        print(f"Error in allowlist_destination_chain: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/allowlist_source_chain")
def allowlist_destination_chain(data: AllowlistChain):
    try:
        print(f"Received allowlist_destination_chain data: {data}")
        w3, contract = get_w3_and_contract(data.chain)

        # Ensure the private key is correct and get the account
        account = Account.from_key(private_key)
        nonce = w3.eth.get_transaction_count(account.address)


        txn = contract.functions.allowlistSourceChain(
            data.destination_chain_selector,
            data.allowed
        ).build_transaction({
                'from': account.address,
                'chainId': 11155111,
                'gas': 100000,
                'gasPrice': w3.to_wei('50', 'gwei'),
                'nonce': nonce,
                })

  

        print(f"Transaction: {txn}")

        signed_txn = w3.eth.account.sign_transaction(txn, private_key)
        print(f"Signed Transaction: {signed_txn}")

        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        print(f"Transaction Hash: {tx_hash.hex()}")

        return {"tx_hash": tx_hash.hex()}
    except Exception as e:
        print(f"Error in allowlist_destination_chain: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    

@app.post("/send_tokens")
def send_tokens(data: AllowlistChain):
    try:
        w3, contract = get_w3_and_contract(data.chain)
        account = Account.from_key(private_key)
        nonce = w3.eth.get_transaction_count(account.address)
        

        txn = contract.functions.sendMessagePayNative(
            int(data.destination_chain_selector),
            data.receiver,
            data.text,
            data.token,
            int(data.amount)
        ).build_transaction({
            'from': account.address,
            'chainId': 97,
            'gas': 100000,
            'gasPrice': w3.to_wei('50', 'gwei'),
            'nonce': nonce,
            
        })

        signed_txn = w3.eth.account.sign_transaction(txn, private_key)
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)

        return {"tx_hash": tx_hash.hex()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

#   uint64 _destinationChainSelector,
#     address _receiver,
#     address _token,
#     uint256 _amount
def transfer_funds(from_chain: str, to_chain: str, amount: int):
    try:
        w3_from, contract_from = get_w3_and_contract(from_chain)
        w3_to, contract_to = get_w3_and_contract(to_chain)
        account = Account.from_key(private_key)
        nonce = w3_from.eth.get_transaction_count(account.address)

        txn = contract_from.functions.transferTokensPayNative(
            chainsector_arb if from_chain == "avax" else chainsector_avax,
            contract_to.address,  # Destination contract address
            avax_usdc if from_chain == "avax" else arb_usdc,
            amount,
        ).build_transaction({
            'from': account.address,
            'chainId': w3_from.eth.chain_id,
            'gas': 100000,
            'gasPrice': w3_from.to_wei('50', 'gwei'),
            'nonce': nonce,
        })

        signed_txn = w3_from.eth.account.sign_transaction(txn, private_key)
        tx_hash = w3_from.eth.send_raw_transaction(signed_txn.rawTransaction)
        print(f"Transferred {amount} from {from_chain} to {to_chain}, tx hash: {tx_hash.hex()}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

 
def swap_eth_for_usdc(w3, uniswap_router_address, amount_in_eth, min_amount_out_usdc):
    try:
        account = Account.from_key(private_key)
        uniswap_router = w3.eth.contract(address=uniswap_router_address, abi=uniswap_router_abi)
        nonce = w3.eth.get_transaction_count(account.address)

        txn = uniswap_router.functions.swapExactETHForTokens(
            min_amount_out_usdc,
            [w3.toChecksumAddress(w3.eth.defaultAccount), w3.toChecksumAddress(arb_usdc)],
            account.address,
            int((datetime.now() + timedelta(minutes=10)).timestamp())
        ).build_transaction({
            'from': account.address,
            'value': w3.to_wei(amount_in_eth, 'ether'),
            'gas': 200000,
            'gasPrice': w3.to_wei('50', 'gwei'),
            'nonce': nonce,
        })

        signed_txn = w3.eth.account.sign_transaction(txn, private_key)
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        print(f"{datetime.now()} - Swapped {amount_in_eth} ETH for USDC, tx hash: {tx_hash.hex()}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def execute_pending_withdrawals(contract):
    try:
        account = Account.from_key(private_key)
        nonce = contract.web3.eth.get_transaction_count(account.address)

        txn = contract.functions.processPendingWithdrawals().build_transaction({
            'from': account.address,
            'chainId': contract.web3.eth.chain_id,
            'gas': 100000,
            'gasPrice': contract.web3.to_wei('20', 'gwei'),
            'nonce': nonce,
        })

        signed_txn = contract.web3.eth.account.sign_transaction(txn, private_key)
        tx_hash = contract.web3.eth.send_raw_transaction(signed_txn.rawTransaction)
        print(f"Processed pending withdrawals, tx hash: {tx_hash.hex()}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/pending_withdrawals")
def process_pending_withdrawals_and_check_balance():
    try:
        # Get pending withdrawals from both contracts
        arb_pending_withdrawals = contract_arb.functions.getPendingWithdrawals().call()
        avax_pending_withdrawals = contract_avax.functions.getPendingWithdrawals().call()

         # Calculate total pending USDC required
        arb_total_pending_usdc = sum(withdrawal['amountToTransfer'] for withdrawal in arb_pending_withdrawals if withdrawal['buyToken'] == arb_usdc)
        avax_total_pending_usdc = sum(withdrawal['amountToTransfer'] for withdrawal in avax_pending_withdrawals if withdrawal['buyToken'] == avax_usdc)

        arb_balance_usdc = usdc_arb.functions.balanceOf(contract_address_arb).call()
        avax_balance_usdc = usdc_avax.functions.balanceOf(contract_address_avax).call()


        # Transfer funds if needed
        if arb_total_pending_usdc > avax_balance_usdc:
            transfer_funds("avax", "arb", arb_total_pending_usdc - arb_balance_usdc)
        if avax_total_pending_usdc > avax_balance_usdc:
            transfer_funds("arb", "avax", avax_total_pending_usdc - avax_balance_usdc)

           # Check the balances of ETH in both contracts
        arb_balance_eth = w3_arb.eth.get_balance(contract_address_arb)
        avax_balance_eth = w3_avax.eth.get_balance(contract_address_avax)

        # Calculate total pending ETH required (this is an example, adjust according to your contract logic)
        arb_total_pending_eth = sum(withdrawal['amount'] for withdrawal in arb_pending_withdrawals if withdrawal['sellToken'] == w3_arb.toChecksumAddress(w3_arb.eth.defaultAccount))
        avax_total_pending_eth = sum(withdrawal['amount'] for withdrawal in avax_pending_withdrawals if withdrawal['sellToken'] == w3_avax.toChecksumAddress(w3_avax.eth.defaultAccount))

        # Swap ETH for USDC if needed
        if arb_total_pending_eth > arb_balance_eth:
            swap_eth_for_usdc(w3_arb, uniswap_router_address_arb, arb_total_pending_eth - arb_balance_eth, arb_total_pending_usdc - arb_balance_usdc)
        if avax_total_pending_eth > avax_balance_eth:
            swap_eth_for_usdc(w3_avax, uniswap_router_address_avax, avax_total_pending_eth - avax_balance_eth, avax_total_pending_usdc - avax_balance_usdc)

             # Execute pending withdrawals
        execute_pending_withdrawals(contract_arb)
        execute_pending_withdrawals(contract_avax)

        return {
            "arb_balance_usdc": arb_balance_usdc,
            "avax_balance_usdc": avax_balance_usdc,
            "arb_total_pending_usdc": arb_total_pending_usdc,
            "avax_total_pending_usdc": avax_total_pending_usdc,
            "arb_balance_eth": arb_balance_eth,
            "avax_balance_eth": avax_balance_eth,
            "arb_total_pending_eth": arb_total_pending_eth,
            "avax_total_pending_eth": avax_total_pending_eth,
        }
       

        # Check the balances of ETH in both contracts
       
    except Exception as e:
        print(f"Error in processing withdrawals: {e}")

# # Schedule the task
scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    scheduler.add_job(process_pending_withdrawals_and_check_balance, 'interval', hours=24)
    scheduler.start()
    yield
    # Shutdown
    scheduler.shutdown()

# # Register the lifespan context manager
# app = FastAPI(lifespan=lifespan)

if __name__ == "__main__":
    import uvicorn
    config = uvicorn.Config("ccip:app", port=2000 ,log_level="info", reload=True)
    server = uvicorn.Server(config)
    asyncio.run(server.serve())

