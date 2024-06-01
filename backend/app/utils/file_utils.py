import json
import os

def load_orders(orders_file):
    if os.path.exists(orders_file):
        with open(orders_file, 'r') as f:
            return json.load(f)
    return []

def save_orders(orders_file, orders):
    with open(orders_file, 'w') as f:
        json.dump(orders, f)
