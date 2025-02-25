from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/drip", tags=["drip"])

class Drip(BaseModel):
    name: str
    description: str | None = None
    price: float
    tax: float | None = None

@router.post("/")
async def add_drip(drip: Drip):
    drip_dict = drip.model_dump()
    if drip.tax is not None:
        total_price = drip.price + drip.tax
        drip_dict.update({"total_price": total_price})
    return drip_dict