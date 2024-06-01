from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from typing import List, Tuple
import pickle 
from tno.mpc.protocols.distributed_keygen import DistributedPaillier
from tno.mpc.encryption_schemes.paillier import Paillier
import asyncio
from tno.mpc.communication import Pool
app = FastAPI()
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
# PARTY_NUMBER = 1
NR_PARTIES = 3

app.distribute_scema = None
ORDERS_FILE = 'store/orders.json'
private_key = "b0104cc3ae940f18c66addbb6076c5f98d1c0f350cc2fe0c1b585e66b7ec498b"
project_id = "8kt_9nM3xUNeRw9EtlZq6OPaHEf8xmTv"
w3_arb = Web3(Web3.HTTPProvider(f"https://arb-sepolia.g.alchemy.com/v2/{project_id}"))
w3_avax = Web3(Web3.HTTPProvider(f"https://avalanche-fuji-c-chain-rpc.publicnode.com"))

# Load Contract ABI
try:
    with open('./abi/ccipAbi.json') as f:
        contract_abi = json.load(f)
except FileNotFoundError:
    raise HTTPException(status_code=500, detail="ABI file not found")
except json.JSONDecodeError:
    raise HTTPException(status_code=500, detail="Error decoding ABI file")

# Contract addresses
contract_address_arb = "0x35801db57ef45068A6865d21500CC1286Fb6b508"
contract_address_avax = "0xBEe17E63c27C1e91c5C5e84224bF97c6A1a37FfC"

# Create contract instances
contract_arb = w3_arb.eth.contract(address=contract_address_arb, abi=contract_abi)
contract_avax = w3_avax.eth.contract(address=contract_address_avax, abi=contract_abi)


KEY_LENGTH = 128
PRIME_THRESHOLD = 2000
CORRUPTION_THRESHOLD = 1

token_addresses = {
    'arb': {
        'ETH': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        'USDC': '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d'
    },
    'avax': {
        'ETH': '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        'USDC': '0xasdasdeafb1BDbe2F0316DF893fd58CE46AA4d'
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
    chain: str  # New field to specify the chain (e.g., 'arb' or 'avax')



class Orders(BaseModel):
    orders: List[Order]

class Item(BaseModel):
    value: int

def load_orders():
    try:
        with open('store/orders.json', 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        print("Warning: 'orders.json' is not found or empty. Returning an empty list.")
        return []

def save_orders(orders):
    with open(ORDERS_FILE, 'w') as f:
        json.dump(orders, f)

async def sum_encrypted_values(orders):
    distributed_schemes = app.distribute_scema
    ciphertext_sum = distributed_schemes[0].encrypt(0)

    for order in orders:
        ciphertext = PaillierCiphertext(int(order['encrypted_order_value']),distributed_schemes[0] )
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
        results.append(dec[0])  # Assuming dec returns a list with a single element per scheme
    return results


async def calculate_cumulative_sums(orders):
    cumulative_sums = []
    sum_value = app.distribute_scema[0].encrypt(0)
    print(orders)
    for order in orders:
        ciphertext = PaillierCiphertext(int(order['encrypted_order_value']), app.distribute_scema[0])
        sum_value += ciphertext
        cumulative_sums.append(sum_value)
    return cumulative_sums

@app.post("/add_order")
async def add_order(order: Order):
    orders = load_orders()
    orders.append(order.dict())
    save_orders(orders)
    return {"message": "Order added successfully"}
    

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

    # Collect all matched orders
    partial_matched_orders = orders[:low + 1]

    # Calculate the remaining encrypted amount
    remaining_encrypted_value = cumulative_sums[low] - target_value
    print("getter",await decrypt_all_orders([cumulative_sums[low]]) , await decrypt_all_orders([target_value]), await decrypt_all_orders([cumulative_sums[low -1]]))

    for order in partial_matched_orders[:-1]:
        encrypted_order_value = PaillierCiphertext(int(order['encrypted_order_value']), app.distribute_scema[0])
        decrypted_order_value = await decrypt_all_orders([encrypted_order_value])
        matched_orders.append({
                'user_address': order['user_address'],
                'selectedMarket': order['selectedMarket'],
                'selectedmar': order['selectedmar'],
                'status': order['status'],
                'createdAt': order['createdAt'],
                'trader_address': order['trader_address'],
                'sellToken': order['sellToken'],
                'buyToken': order['buyToken'],
                'chain': order['chain'],
                'encrypted_order_value': abs(int(decrypted_order_value[0])) 
        })

    # Handle the partially matched order
    partial_order = partial_matched_orders[-1]
    if remaining_encrypted_value != app.distribute_scema[0].encrypt(0):
        temp = target_value - cumulative_sums[low - 1] 
        order = await decrypt_all_orders([temp])
        print("setter",order)

        matched_orders.append({
                'user_address': partial_order['user_address'],
                'selectedMarket': partial_order['selectedMarket'],
                'selectedmar': partial_order['selectedmar'],
                'status': partial_order['status'],
                'createdAt': partial_order['createdAt'],
                'trader_address': partial_order['trader_address'],
                'sellToken': partial_order['sellToken'],
                'buyToken': partial_order['buyToken'],
                'chain': partial_order['chain'],
                'encrypted_order_value': abs(int(order[0]))
        })

        # Update the remaining part of the partial order
        partial_order['encrypted_order_value'] = str(remaining_encrypted_value.get_value())
        orders.insert(0, partial_order)
    else:
        orders.pop(low)

    # Remove matched orders from the list except the partially executed one
    orders = orders[low + 1:]
    return matched_orders, orders

# Example call in the context of the FastAPI endpoint
@app.post("/execute_orders")
async def execute_orders():

    orders = load_orders()
    eth_to_usdc_orders = [order for order in orders if order['sellToken'] == token_addresses[order['chain']]['ETH'] and order['buyToken'] == token_addresses[order['chain']]['USDC']]
    usdc_to_eth_orders = [order for order in orders if order['sellToken'] == token_addresses[order['chain']]['USDC'] and order['buyToken'] == token_addresses[order['chain']]['ETH']]
    usdc_to_eth_sum = await sum_encrypted_values(usdc_to_eth_orders)
    eth_to_usdc_sum = await sum_encrypted_values(eth_to_usdc_orders)

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
        print("matched_orders", matched_orders)
        await execute_matched_orders(matched_orders)
        save_orders([])
        return {"matched_orders": matched_orders, "remaining_orders": []}
    
    # Decrypt all amounts on the smaller side
    cumulative_sums = await calculate_cumulative_sums(larger_orders)
    print("Cumulative sums: ", await decrypt_all_orders(cumulative_sums))


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
            'encrypted_order_value': abs(int(decrypted_order_value[0]) ) 
        })
    
    matched_orders, updated_orders = await binary_search_and_partial_decrypt(cumulative_sums, smaller_sum, matched_orders, larger_orders)
    await execute_matched_orders(matched_orders)
    save_orders(updated_orders)
    return {"matched_orders": matched_orders, "remaining_orders": updated_orders}

def get_w3_and_contract(chain: str):
    if chain == "arb":
        return w3_arb, contract_arb
    elif chain == "avax":
        return w3_avax, contract_avax
    else:
        raise HTTPException(status_code=400, detail="Unsupported chain")


async def execute_matched_orders(request: List[dict]):
    try:
        w3, contract = get_w3_and_contract(request[0]['chain'])  # Assuming all orders are for the same chain
        account = Account.from_key(private_key)

        for order in request:
            nonce = w3.eth.get_transaction_count(account.address)
            fetched_amount = 1000

            # Format the order to match the contract's expected structure
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

            signed_txn = w3.eth.account.sign_transaction(txn, private_key)
            tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)

            print(f"Sent order to {order['chain']} chain, tx hash: {tx_hash.hex()}")

        return {"message": "Orders executed on all chains"}
    except Exception as e:
        print(f"Error executing matched orders: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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
    
    distributed_schemes: Tuple[DistributedPaillier, ...] = tuple(
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
   
def setup_local_pool(server_port: int, others: List[Tuple[str, int]]) -> Pool:
    pool = Pool()
    pool.add_http_server(server_port)
    for client_ip, client_port in others:
        pool.add_http_client(
            f"client_{client_ip}_{client_port}", client_ip, client_port
        )
        print(f"client_{client_ip}_{client_port}")
    return pool
    
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
    ) = DistributedPaillier.setup_input(pool, KEY_LENGTH, PRIME_THRESHOLD, CORRUPTION_THRESHOLD)
   
    index, party_indices, zero_share, session_id = await DistributedPaillier.setup_protocol(
        shamir_scheme, other_parties, pool
    )

  
    # distributed_scheme = None
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.distribute_scema = await setup()
    yield

app.router.lifespan_context = lifespan

if __name__ == "__main__":
    config = uvicorn.Config("main:app", port=5000, log_level="info", reload=True)
    server = uvicorn.Server(config)
    asyncio.run(server.serve())

