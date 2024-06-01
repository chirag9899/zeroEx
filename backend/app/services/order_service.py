import json
import os
from app.models.schemas import Order
from app.utils.file_utils import load_orders, save_orders
from app.services.mpc_service import sum_encrypted_values, decrypt_all_orders, calculate_cumulative_sums, binary_search_and_partial_decrypt
from fastapi import FastAPI
from tno.mpc.encryption_schemes.paillier.paillier import PaillierCiphertext


ORDERS_FILE = 'store/orders.json'

async def add_order(order: Order):
    orders = load_orders(ORDERS_FILE)
    orders.append(order.dict())
    save_orders(ORDERS_FILE, orders)
    return {"message": "Order added successfully"}

async def execute_orders(app: FastAPI):
    print(app.state.distribute_scema)
    print("hello",await decrypt_all_orders(app, [PaillierCiphertext(1533258081951015326626657348528871620078293198766942843729202907060997016614397,app.state.distribute_scema[0])]))
    return
    orders = load_orders(ORDERS_FILE)
    eth_to_usdc_orders = [order for order in orders if order['sellToken'] == 'eth' and order['buyToken'] == 'usdc']
    usdc_to_eth_orders = [order for order in orders if order['sellToken'] == 'usdc' and order['buyToken'] == 'eth']

    usdc_to_eth_sum = await sum_encrypted_values(app, usdc_to_eth_orders)
    eth_to_usdc_sum = await sum_encrypted_values(app, eth_to_usdc_orders)

    encrypted_diffrence = (eth_to_usdc_sum - usdc_to_eth_sum)
    decrypted_diffrence = await decrypt_all_orders(app,[encrypted_diffrence])

    if decrypted_diffrence[0] > 0:
        larger_orders, smaller_orders = eth_to_usdc_orders, usdc_to_eth_orders
        larger_sum, smaller_sum = eth_to_usdc_sum, usdc_to_eth_sum
    elif decrypted_diffrence[0] < 0:
        larger_orders, smaller_orders = usdc_to_eth_orders, eth_to_usdc_orders
        larger_sum, smaller_sum = usdc_to_eth_sum, eth_to_usdc_sum
    else:
        matched_orders = eth_to_usdc_orders + usdc_to_eth_orders
        for order in matched_orders:
            encrypted_order_value = PaillierCiphertext(int(order['encrypted_order_value']), app.state.distribute_scema[0])
            decrypted_order_value = await decrypt_all_orders(app,[encrypted_order_value])
            print(decrypted_order_value, encrypted_order_value)
            order['encrypted_order_value'] = int(decrypted_order_value[0])
        save_orders(ORDERS_FILE, [])
        return {"matched_orders": matched_orders, "remaining_orders": []}

    cumulative_sums = await calculate_cumulative_sums(app,larger_orders)

    matched_orders = []
    for order in smaller_orders:
        encrypted_order_value = PaillierCiphertext(int(order['encrypted_order_value']), app.state.distribute_scema[0])
        decrypted_order_value = await decrypt_all_orders(app, [encrypted_order_value])
        matched_orders.append({
            'user_address': order['user_address'],
            'trader_address': order['trader_address'],
            'sellToken': order['sellToken'],
            'buyToken': order['buyToken'],
            'encrypted_order_value': int(decrypted_order_value[0])  # Ensure serializable
        })

    matched_orders, updated_orders = await binary_search_and_partial_decrypt(app, cumulative_sums, smaller_sum, matched_orders, larger_orders)

    save_orders(ORDERS_FILE, updated_orders)
    return {"matched_orders": matched_orders, "remaining_orders": updated_orders}
