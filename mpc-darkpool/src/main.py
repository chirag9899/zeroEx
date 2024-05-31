from fastapi import FastAPI
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


origins = [
    "http://localhost.tiangolo.com",
    "https://localhost.tiangolo.com",
    "http://localhost",
    "http://localhost:8080",
    "http://127.0.0.1:5000"
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
ORDERS_FILE = 'src/store/orders.json'


KEY_LENGTH = 128
PRIME_THRESHOLD = 2000
CORRUPTION_THRESHOLD = 1

class Order(BaseModel):
    user_address: str
    trader_address: str
    encrypted_order_value: str
    buyToken: str
    sellToken: str

class Orders(BaseModel):
    orders: List[Order]

class Item(BaseModel):
    value: int

def load_orders():
    if os.path.exists(ORDERS_FILE):
        with open(ORDERS_FILE, 'r') as f:
            return json.load(f)
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
    print("sum",ciphertext_sum)
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
            'trader_address': order['trader_address'],
            'sellToken': order['sellToken'],
            'buyToken': order['buyToken'],
            'encrypted_order_value': int(decrypted_order_value[0])  # Ensure serializable
        })

    # Handle the partially matched order
    partial_order = partial_matched_orders[-1]
    if remaining_encrypted_value != app.distribute_scema[0].encrypt(0):
        # partial_decrypted_value = await decrypt_all_orders([remaining_encrypted_value])
        # partial_decrypted_value = int(partial_decrypted_value[0])
        
        # full_order_value = await decrypt_all_orders([PaillierCiphertext(int(partial_order['encrypted_order_value']), app.distribute_scema[0])])
        # full_order_value = int(full_order_value[0])

        # temp = await decrypt_all_orders([cumulative_sums[low - 1]])
        # sum = await decrypt_all_orders([target_value])
        # order = sum[0] - temp[0] ; 
        temp = target_value - cumulative_sums[low - 1] 
        order = await decrypt_all_orders([temp])
        print("setter",order)

        matched_orders.append({
            'user_address': partial_order['user_address'],
            'trader_address': partial_order['trader_address'],
            'sellToken': partial_order['sellToken'],
            'buyToken': partial_order['buyToken'],
            'encrypted_order_value': int(order[0])
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
    eth_to_usdc_orders = [order for order in orders if order['sellToken'] == 'eth' and order['buyToken'] == 'usdc']
    usdc_to_eth_orders = [order for order in orders if order['sellToken'] == 'usdc' and order['buyToken'] == 'eth']

    usdc_to_eth_sum = await sum_encrypted_values(usdc_to_eth_orders)
    eth_to_usdc_sum = await sum_encrypted_values(eth_to_usdc_orders)

    encrypted_diffrence = (eth_to_usdc_sum - usdc_to_eth_sum)
    decrypted_diffrence = await decrypt_all_orders([encrypted_diffrence])

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
            order['encrypted_order_value'] = int(decrypted_order_value[0])
        print("matched_orders", matched_orders)
        save_orders([])
        return

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
            'sellToken': order['sellToken'],
            'buyToken': order['buyToken'],
            'encrypted_order_value': int(decrypted_order_value[0])  # Ensure serializable
        })
    
    matched_orders, updated_orders = await binary_search_and_partial_decrypt(cumulative_sums, smaller_sum, matched_orders, larger_orders)
    print("matched orders: ", matched_orders)
    print("updated orders: ", updated_orders)

    save_orders(updated_orders)
    return {"matched_orders": matched_orders, "remaining_orders": updated_orders}



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
    with open(f"src/store/{party_number}.pkl",'rb') as f:
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
