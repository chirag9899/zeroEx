from fastapi import APIRouter
from app.models.schemas import Order
from app.services.order_service import add_order, execute_orders
from fastapi import APIRouter, Request


router = APIRouter()

@router.post("/add_order")
async def add_order_endpoint(order: Order):
    return await add_order(order)

@router.post("/execute_orders")
async def execute_orders_endpoint(request: Request):
    print(request)
    print(request.app)
    return await execute_orders(request.app)
