from pydantic import BaseModel
from typing import List

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
