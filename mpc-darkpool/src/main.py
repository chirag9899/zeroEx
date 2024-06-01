from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from typing import List, Tuple
import pickle 
from tno.mpc.protocols.distributed_keygen import DistributedPaillier
from tno.mpc.encryption_schemes.paillier import Paillier
import asyncio
from tno.mpc.communication import Pool
import argparse
import json
import os
import uvicorn
from contextlib import asynccontextmanager
from tno.mpc.encryption_schemes.paillier.paillier import PaillierPublicKey , PaillierCiphertext
from tno.mpc.protocols.distributed_keygen.paillier_shared_key import PaillierSharedKey
from web3 import Web3
from eth_account import Account
from datetime import datetime



app = FastAPI()

origins = [
    "http://localhost.tiangolo.com",
    "https://localhost.tiangolo.com",
    "http://localhost",
    "http://localhost:8080",
    "http://127.0.0.1:5000",
    "http://localhost:5173",
    "http://localhost:5173/home"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_PORT = 8900
NR_PARTIES = 3

# Application-wide configuration object
app.config = {
    'ORDERS_FILE': 'store/orders.json',
    'PRIVATE_KEY': "b0104cc3ae940f18c66addbb6076c5f98d1c0f350cc2fe0c1b585e66b7ec498b",
    'KEY_LENGTH': 128,
    'PRIME_THRESHOLD': 2000,
    'CORRUPTION_THRESHOLD': 1,
    'CONTRACTS': {
        'amoy': {
            'RPC': "https://polygon-amoy.g.alchemy.com/v2/SjhJtJ8sLClggBUwq9sJ72HMC4rOjJjE",
            'ADDRESS': "0x32A96ce7203a5257785D801576a61B06e87A5279"
        },
        'avax': {
            'RPC': "https://avalanche-fuji-c-chain-rpc.publicnode.com",
            'ADDRESS': "0xF7bF22cdC0c16ee8704863d03403cf3DC9650B50"
        }
    },
    'TOKEN_ADDRESSES': {
        'amoy': {
            'ETH': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
            'USDC': '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582'
        },
        'avax': {
            'ETH': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
            'USDC': '0x5425890298aed601595a70AB815c96711a31Bc65'
        }
    }
}

class Order(BaseModel):
    user_address: str
    selectedMarket: str
    status: int
    createdAt: int = None
    encrypted_order_value: str
    buyToken: str
    sellToken: str
    trader_address: str = None
    chain: str

class Orders(BaseModel):
    orders: List[Order]

class Item(BaseModel):
    value: int

async def periodic_task():
    while True:
        try:
            await execute_orders_internal()
        except Exception as e:
            print(f"Error in periodic task: {e}")
        await asyncio.sleep(10 * 60 * 60)  # 10 hours * 60 minutes/hour * 60 seconds/minute


# Utility functions
def load_orders():
    try:
        with open(app.config['ORDERS_FILE'], 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        print("Warning: 'orders.json' is not found or empty. Returning an empty list.")
        return []

def save_orders(orders):
    with open(app.config['ORDERS_FILE'], 'w') as f:
        json.dump(orders, f)

def get_w3_and_contract(chain: str):
    if chain in app.config['CONTRACTS']:
        config = app.config['CONTRACTS'][chain]
        w3 = Web3(Web3.HTTPProvider(config['RPC']))
        contract = w3.eth.contract(address=config['ADDRESS'], abi=load_contract_abi())
        return w3, contract
    else:
        raise HTTPException(status_code=400, detail="Unsupported chain")

def load_contract_abi():
    try:
        with open('./abi/ccipAbi.json') as f:
            return json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="ABI file not found")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Error decoding ABI file")

async def setup_distributed_scheme(party_number, pool) -> DistributedPaillier:
    with open(f"store/{party_number}.pkl",'rb') as f:
        data = pickle.load(f)
    paillier_public_key = PaillierPublicKey.deserialize(data['paillier']['pubkey'])
    paillier_shared_key = PaillierSharedKey.deserialize(data['paillier']['seckey'])

    (
        number_of_players,
        prime_length,
        prime_list,
        shamir_scheme,
        shares,
        other_parties,
    ) = DistributedPaillier.setup_input(pool, app.config['KEY_LENGTH'], app.config['PRIME_THRESHOLD'], app.config['CORRUPTION_THRESHOLD'])

    index, party_indices, zero_share, session_id = await DistributedPaillier.setup_protocol(
        shamir_scheme, other_parties, pool
    )

    distributed_scheme = DistributedPaillier(
        paillier_public_key,
        paillier_shared_key,
        0,
        pool,
        index,
        party_indices,
        shares,
        session_id,
        False
    )
    return distributed_scheme

def setup_local_pool(server_port: int, others: List[Tuple[str, int]]) -> Pool:
    pool = Pool()
    pool.add_http_server(server_port)
    for client_ip, client_port in others:
        pool.add_http_client(
            f"client_{client_ip}_{client_port}", client_ip, client_port
        )
    return pool

async def setup():
    distributed_schemes = []
    pools = [None] * NR_PARTIES
    
    for party_number in range(NR_PARTIES):
        others = [
            ("localhost", BASE_PORT + i) for i in range(NR_PARTIES) if i != party_number
        ]
        server_port = BASE_PORT + party_number
        pool = setup_local_pool(server_port, others)
        pools[party_number] = pool
    
    distributed_schemes = tuple(
        await asyncio.gather(
            *[
                setup_distributed_scheme(
                    i,
                    pools[i]
                )
                for i in range(NR_PARTIES)
            ]
        )
    )
    return distributed_schemes

@app.post("/add_order")
async def add_order(order: Order):
    orders = load_orders()
    orders.append(order.dict())
    save_orders(orders)
    return {"message": "Order added successfully"}

async def sum_encrypted_values(orders):
    distributed_schemes = app.distribute_scema
    ciphertext_sum = distributed_schemes[0].encrypt(0)

    for order in orders:
        ciphertext = PaillierCiphertext(int(order['encrypted_order_value']), distributed_schemes[0])
        ciphertext_sum += ciphertext
    return ciphertext_sum

async def decrypt_all_orders(encrypted_vals):
    distributed_schemes = app.distribute_scema
    results = []
    for encrypted_val in encrypted_vals:
        dec = await asyncio.gather(
            *[
                distributed_schemes[i].decrypt(encrypted_val)
                for i in range(len(distributed_schemes))
            ]
        )
        results.append(dec[0])
    return results

async def calculate_cumulative_sums(orders):
    cumulative_sums = []
    sum_value = app.distribute_scema[0].encrypt(0)
    for order in orders:
        ciphertext = PaillierCiphertext(int(order['encrypted_order_value']), app.distribute_scema[0])
        sum_value += ciphertext
        cumulative_sums.append(sum_value)
    return cumulative_sums

async def binary_search_and_partial_decrypt(cumulative_sums, target_value, matched_orders, orders):
    low, high = 0, len(cumulative_sums) - 1

    while low < high:
        mid = (low + high) // 2
        difference = cumulative_sums[mid] - target_value
        decrypted_difference = await decrypt_all_orders([difference])
    
        if decrypted_difference[0] < 0:
            low = mid + 1
        else:
            high = mid

    partial_matched_orders = orders[:low + 1]
    remaining_encrypted_value = cumulative_sums[low] - target_value

    for order in partial_matched_orders[:-1]:
        encrypted_order_value = PaillierCiphertext(int(order['encrypted_order_value']), app.distribute_scema[0])
        decrypted_order_value = await decrypt_all_orders([encrypted_order_value])
        matched_orders.append({
            'user_address': order['user_address'],
            'selectedMarket': order['selectedMarket'],
            'status': order['status'],
            'createdAt': order['createdAt'],
            'trader_address': order['trader_address'],
            'sellToken': order['sellToken'],
            'buyToken': order['buyToken'],
            'chain': order['chain'],
            'encrypted_order_value': abs(int(decrypted_order_value[0]))
        })

    partial_order = partial_matched_orders[-1]
    if remaining_encrypted_value != app.distribute_scema[0].encrypt(0):
        temp = target_value - cumulative_sums[low - 1]
        order = await decrypt_all_orders([temp])

        matched_orders.append({
            'user_address': partial_order['user_address'],
            'selectedMarket': partial_order['selectedMarket'],
            'status': partial_order['status'],
            'createdAt': partial_order['createdAt'],
            'trader_address': partial_order['trader_address'],
            'sellToken': partial_order['sellToken'],
            'buyToken': partial_order['buyToken'],
            'chain': partial_order['chain'],
            'encrypted_order_value': abs(int(order[0]))
        })

        partial_order['encrypted_order_value'] = str(remaining_encrypted_value.get_value())
        orders.insert(0, partial_order)
    else:
        orders.pop(low)

    orders = orders[low + 1:]
    return matched_orders, orders



@app.post("/execute_orders")
async def execute_orders_internal(): 
    orders = load_orders()
    eth_to_usdc_orders = [order for order in orders if order['sellToken'] == app.config['TOKEN_ADDRESSES'][order['chain']]['ETH'] and order['buyToken'] == app.config['TOKEN_ADDRESSES'][order['chain']]['USDC']]
    usdc_to_eth_orders = [order for order in orders if order['sellToken'] == app.config['TOKEN_ADDRESSES'][order['chain']]['USDC'] and order['buyToken'] == app.config['TOKEN_ADDRESSES'][order['chain']]['ETH']]
    usdc_to_eth_sum = await sum_encrypted_values(usdc_to_eth_orders)
    eth_to_usdc_sum = await sum_encrypted_values(eth_to_usdc_orders)

    print(eth_to_usdc_orders, usdc_to_eth_orders)
    # test
    check = await decrypt_all_orders([usdc_to_eth_sum, eth_to_usdc_sum])
    print("status",check)

    encrypted_diffrence = (eth_to_usdc_sum - usdc_to_eth_sum)
    decrypted_diffrence = await decrypt_all_orders([encrypted_diffrence])

    usdc_to_eth_check = usdc_to_eth_sum - encrypted_diffrence
    eth_to_usdc_check = eth_to_usdc_sum - encrypted_diffrence
    status = await decrypt_all_orders([usdc_to_eth_check, eth_to_usdc_check])

    
    if status[0] == 0 or status[1] == 0:
        return {"error": "Invalid orders"}

    if decrypted_diffrence[0] > 0:
        larger_orders, smaller_orders = eth_to_usdc_orders, usdc_to_eth_orders
        larger_sum, smaller_sum = eth_to_usdc_sum, usdc_to_eth_sum
    elif decrypted_diffrence[0] < 0:
        larger_orders, smaller_orders = usdc_to_eth_orders, eth_to_usdc_orders
        larger_sum, smaller_sum = usdc_to_eth_sum, eth_to_usdc_sum
    else:
        matched_orders = eth_to_usdc_orders + usdc_to_eth_orders
        for order in matched_orders:
            encrypted_order_value = PaillierCiphertext(int(order['encrypted_order_value']), app.distribute_scema[0])
            decrypted_order_value = await decrypt_all_orders([encrypted_order_value])
            order['encrypted_order_value'] = abs(int(decrypted_order_value[0]))
        await execute_matched_orders(matched_orders)
        save_orders([])
        return {"matched_orders": matched_orders, "remaining_orders": []}
    
    cumulative_sums = await calculate_cumulative_sums(larger_orders)
    matched_orders = []
    for order in smaller_orders:
        encrypted_order_value = PaillierCiphertext(int(order['encrypted_order_value']), app.distribute_scema[0])
        decrypted_order_value = await decrypt_all_orders([encrypted_order_value])
        matched_orders.append({
            'user_address': order['user_address'],
            'trader_address': order['trader_address'],
            'selectedMarket': order['selectedMarket'],
            'status': order['status'],
            'createdAt': order['createdAt'],
            'sellToken': order['sellToken'],
            'buyToken': order['buyToken'],
            'chain': order['chain'],
            'encrypted_order_value': abs(int(decrypted_order_value[0]))
        })
    
    matched_orders, updated_orders = await binary_search_and_partial_decrypt(cumulative_sums, smaller_sum, matched_orders, larger_orders)
    await execute_matched_orders(matched_orders)
    save_orders(updated_orders)
    return {"matched_orders": matched_orders, "remaining_orders": updated_orders}

async def execute_matched_orders(request: List[dict]):
    try:
        w3, contract = get_w3_and_contract(request[0]['chain'])
        account = Account.from_key(app.config['PRIVATE_KEY'])

        for order in request:
            nonce = w3.eth.get_transaction_count(account.address)
            fetched_amount = 1000

            formatted_order = (
                order['user_address'],
                order['trader_address'],
                int(order['encrypted_order_value']),
                fetched_amount,
                w3.to_checksum_address(order['buyToken']),
                w3.to_checksum_address(order['sellToken']),
                int(order['createdAt']),
                int(order['status'])
            )

            txn = contract.functions.executeOrders([formatted_order]).build_transaction({
                'from': account.address,
                'chainId': w3.eth.chain_id,
                'gas': 1000000,
                'gasPrice': w3.to_wei('50', 'gwei'),
                'nonce': nonce,
            })

            signed_txn = w3.eth.account.sign_transaction(txn, app.config['PRIVATE_KEY'])
            tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)

            print(f"Sent order to {order['chain']} chain, tx hash: {tx_hash.hex()}")

        return {"message": "Orders executed on all chains"}
    except Exception as e:
        print(f"Error executing matched orders: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.distribute_scema = await setup()
    yield

app.router.lifespan_context = lifespan

if __name__ == "__main__":
    config = uvicorn.Config("main:app", port=5000, log_level="info", reload=True)
    server = uvicorn.Server(config)
    asyncio.run(server.serve())
