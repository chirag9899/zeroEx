from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from web3 import Web3
import json
import os
from eth_account import Account
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
import uvicorn
import asyncio

app = FastAPI()

# Configuration
config = {
    "private_key": "b0104cc3ae940f18c66addbb6076c5f98d1c0f350cc2fe0c1b585e66b7ec498b",
    "project_id": "8kt_9nM3xUNeRw9EtlZq6OPaHEf8xmTv",
    "w3_amoy": Web3(Web3.HTTPProvider(f"https://polygon-amoy.g.alchemy.com/v2/SjhJtJ8sLClggBUwq9sJ72HMC4rOjJjE")),
    "w3_avax": Web3(Web3.HTTPProvider(f"https://avalanche-fuji-c-chain-rpc.publicnode.com")),
    "avax_usdc": "0x5425890298aed601595a70AB815c96711a31Bc65",
    "amoy_usdc": "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
    "erc20_abi": json.loads('[{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]'),
    "chainsector_avax": 14767482510784806043,
    "chainsector_amoy": 16281711391670634445,
    "contract_address_amoy": "0x32A96ce7203a5257785D801576a61B06e87A5279",
    "contract_address_avax": "0xF7bF22cdC0c16ee8704863d03403cf3DC9650B50",
    "uniswap_router_address_amoy": "0x0000000000000000000000000000000000000000",
    "uniswap_router_address_avax": "0x0000000000000000000000000000000000000000",
    "uniswap_router_abi": json.loads('[{"constant":false,"inputs":[{"name":"amountOutMin","type":"uint256"},{"name":"path","type":"address[]"},{"name":"to","type":"address"},{"name":"deadline","type":"uint256"}],"name":"swapExactETHForTokens","outputs":[{"name":"","type":"uint256[]"}],"payable":true,"stateMutability":"payable","type":"function"}]')
}

# Load Contract ABI
try:
    with open('./abi/ccipAbi.json') as f:
        config['contract_abi'] = json.load(f)
except FileNotFoundError:
    raise HTTPException(status_code=500, detail="ABI file not found")
except json.JSONDecodeError:
    raise HTTPException(status_code=500, detail="Error decoding ABI file")

# Create contract instances
config['usdc_amoy'] = config['w3_amoy'].eth.contract(address=config['amoy_usdc'], abi=config['erc20_abi'])
config['usdc_avax'] = config['w3_avax'].eth.contract(address=config['avax_usdc'], abi=config['erc20_abi'])
config['contract_amoy'] = config['w3_amoy'].eth.contract(address=config['contract_address_amoy'], abi=config['contract_abi'])
config['contract_avax'] = config['w3_avax'].eth.contract(address=config['contract_address_avax'], abi=config['contract_abi'])

class TokenTransfer(BaseModel):
    destination_chain_selector: str
    receiver: str
    text: str
    token: str
    amount: int
    chain: str

class AllowlistChain(BaseModel):
    destination_chain_selector: int
    allowed: bool
    chain: str

def get_w3_and_contract(chain: str):
    if chain == "amoy":
        return config['w3_amoy'], config['contract_amoy']
    elif chain == "avax":
        return config['w3_avax'], config['contract_avax']
    else:
        raise HTTPException(status_code=400, detail="Unsupported chain")

@app.get("/")
def read_root():
    return "hello"

@app.post("/allowlist_destination_chain")
def allowlist_destination_chain(data: AllowlistChain):
    try:
        w3, contract = get_w3_and_contract(data.chain)
        account = Account.from_key(config['private_key'])
        nonce = w3.eth.get_transaction_count(account.address)

        txn = contract.functions.allowlistDestinationChain(
            data.destination_chain_selector,
            data.allowed
        ).build_transaction({
            'from': account.address,
            'chainId': 11155111,
            'gas': 100000,
            'gasPrice': w3.to_wei('50', 'gwei'),
            'nonce': nonce,
        })

        signed_txn = w3.eth.account.sign_transaction(txn, config['private_key'])
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)

        return {"tx_hash": tx_hash.hex()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/allowlist_source_chain")
def allowlist_source_chain(data: AllowlistChain):
    try:
        w3, contract = get_w3_and_contract(data.chain)
        account = Account.from_key(config['private_key'])
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

        signed_txn = w3.eth.account.sign_transaction(txn, config['private_key'])
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)

        return {"tx_hash": tx_hash.hex()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/send_tokens")
def send_tokens(data: TokenTransfer):
    try:
        w3, contract = get_w3_and_contract(data.chain)
        account = Account.from_key(config['private_key'])
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

        signed_txn = w3.eth.account.sign_transaction(txn, config['private_key'])
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)

        return {"tx_hash": tx_hash.hex()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def transfer_funds(from_chain: str, to_chain: str, amount: int):
    try:
        w3_from, contract_from = get_w3_and_contract(from_chain)
        w3_to, contract_to = get_w3_and_contract(to_chain)
        account = Account.from_key(config['private_key'])
        nonce = w3_from.eth.get_transaction_count(account.address)

        txn = contract_from.functions.transferTokensPayNative(
            config['chainsector_amoy'] if from_chain == "avax" else config['chainsector_avax'],
            contract_to.address,
            config['avax_usdc'] if from_chain == "avax" else config['amoy_usdc'],
            amount,
        ).build_transaction({
            'from': account.address,
            'chainId': w3_from.eth.chain_id,
            'gas': 100000,
            'gasPrice': w3_from.to_wei('50', 'gwei'),
            'nonce': nonce,
        })

        signed_txn = w3_from.eth.account.sign_transaction(txn, config['private_key'])
        tx_hash = w3_from.eth.send_raw_transaction(signed_txn.rawTransaction)
        print(f"Transferred {amount} from {from_chain} to {to_chain}, tx hash: {tx_hash.hex()}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def swap_eth_for_usdc(w3, uniswap_router_address, amount_in_eth, min_amount_out_usdc):
    try:
        account = Account.from_key(config['private_key'])
        uniswap_router = w3.eth.contract(address=uniswap_router_address, abi=config['uniswap_router_abi'])
        nonce = w3.eth.get_transaction_count(account.address)

        txn = uniswap_router.functions.swapExactETHForTokens(
            min_amount_out_usdc,
            [w3.toChecksumAddress(w3.eth.defaultAccount), w3.toChecksumAddress(config['amoy_usdc'])],
            account.address,
            int((datetime.now() + timedelta(minutes=10)).timestamp())
        ).build_transaction({
            'from': account.address,
            'value': w3.to_wei(amount_in_eth, 'ether'),
            'gas': 200000,
            'gasPrice': w3.to_wei('50', 'gwei'),
            'nonce': nonce,
        })

        signed_txn = w3.eth.account.sign_transaction(txn, config['private_key'])
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        print(f"{datetime.now()} - Swapped {amount_in_eth} ETH for USDC, tx hash: {tx_hash.hex()}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def execute_pending_withdrawals(chain):
    try:
        w3, contract = get_w3_and_contract(chain)
        account = Account.from_key(config['private_key'])
        nonce = w3.eth.get_transaction_count(account.address)

        txn = contract.functions.processPendingWithdrawals().build_transaction({
            'from': account.address,
            'chainId': w3.eth.chain_id,
            'gas': 1000000,
            'gasPrice': w3.eth.gas_price,
            'nonce': nonce,
        })

        signed_txn = w3.eth.account.sign_transaction(txn, config['private_key'])
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        print(f"Processed pending withdrawals, tx hash: {tx_hash.hex()}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/pending_withdrawals")
def process_pending_withdrawals_and_check_balance():
    try:
           #Get pending withdrawals from both contracts
        w3_amoy, contract_amoy = get_w3_and_contract('amoy')
        w3_avax, contract_avax = get_w3_and_contract('avax')

        amoy_pending_withdrawals = contract_amoy.functions.getPendingWithdrawals().call()
        avax_pending_withdrawals = contract_avax.functions.getPendingWithdrawals().call()

        # for testing
        amoy_pending_withdrawals = [
            {"user": "0xE2db7ef93684d06BbF47137000065cF26E878B2e", "amount": 1000, "amountToTransfer": 1000, "isETH": False, "isPending": True, "pendingAt": 1717223605},
            {"user": "0xE2db7ef93684d06BbF47137000065cF26E878B2e", "amount": 2000, "isETH": False, "amountToTransfer": 1000, "isPending": False, "pendingAt": 1717223606}
        ]
        avax_pending_withdrawals = [
            {"user": "0xE2db7ef93684d06BbF47137000065cF26E878B2e", "amount": 3000, "isETH": False, "isPending": True, "amountToTransfer": 1000, "pendingAt": 1717223607}
        ]

        amoy_total_pending_usdc = sum([withdrawal['amountToTransfer'] for withdrawal in amoy_pending_withdrawals if not withdrawal['isETH']])
        avax_total_pending_usdc = sum([withdrawal['amountToTransfer'] for withdrawal in avax_pending_withdrawals if not withdrawal['isETH']])

        amoy_balance_usdc = config['usdc_amoy'].functions.balanceOf(config['contract_address_amoy']).call()
        avax_balance_usdc = config['usdc_avax'].functions.balanceOf(config['contract_address_avax']).call()

        if amoy_total_pending_usdc > amoy_balance_usdc:
            transfer_funds("avax", "amoy", abs(amoy_total_pending_usdc - amoy_balance_usdc))
        if avax_total_pending_usdc > avax_balance_usdc:
            transfer_funds("amoy", "avax", abs(avax_total_pending_usdc - avax_balance_usdc))

        amoy_balance_eth = config['w3_amoy'].eth.get_balance(config['contract_address_amoy'])
        avax_balance_eth = config['w3_avax'].eth.get_balance(config['contract_address_avax'])

        amoy_total_pending_eth = sum([withdrawal['amount'] for withdrawal in amoy_pending_withdrawals if withdrawal['isETH']])
        avax_total_pending_eth = sum([withdrawal['amount'] for withdrawal in avax_pending_withdrawals if withdrawal['isETH']])

        return {
            "amoy_balance_usdc": amoy_balance_usdc,
            "avax_balance_usdc": avax_balance_usdc,
            "amoy_total_pending_usdc": amoy_total_pending_usdc,
            "avax_total_pending_usdc": avax_total_pending_usdc,
            "amoy_balance_eth": amoy_balance_eth,
            "avax_balance_eth": avax_balance_eth,
            "amoy_total_pending_eth": amoy_total_pending_eth,
            "avax_total_pending_eth": avax_total_pending_eth
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def periodic_task():
    while True:
        try:
            process_pending_withdrawals_and_check_balance()
        except Exception as e:
            print(f"Error in periodic task: {e}")
        await asyncio.sleep(10 * 60 * 60)  # 10 hours * 60 minutes/hour * 60 seconds/minute

@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(periodic_task())
    try:
        yield
    finally:
        task.cancel()
        await task

app = FastAPI(lifespan=lifespan)

if __name__ == "__main__":
    config = uvicorn.Config("ccip:app", port=2000, log_level="info", reload=True)
    server = uvicorn.Server(config)
    asyncio.run(server.serve())
