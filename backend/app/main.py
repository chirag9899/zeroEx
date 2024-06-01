import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/..")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router
from app.core.config import origins
from contextlib import asynccontextmanager
from app.services.mpc_service import setup

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.distribute_scema = await setup(app)
    print("main", app.state.distribute_scema)
    yield

app.router.lifespan_context = lifespan
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    config = uvicorn.Config("app.main:app", port=5000, log_level="info", reload=True)
    server = uvicorn.Server(config)
    import asyncio
    asyncio.run(server.serve())
