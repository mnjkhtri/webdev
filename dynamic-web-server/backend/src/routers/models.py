from fastapi import APIRouter
from enum import Enum

router = APIRouter(prefix="/api/v1/models", tags=["models"])

class ModelName(str, Enum):
    rizzler = "rizzler"
    sigma = "sigma"
    cheugy = "cheugy"

@router.get("/{model_name}")
async def get_model(model_name: ModelName):
    messages = {
        ModelName.rizzler: "You've got that unspoken rizz!",
        ModelName.sigma: "Embracing the sigma grindset!",
        ModelName.cheugy: "That's a bit cheugy, isn't it?"
    }
    return {"model_name": model_name, "message": messages.get(model_name, "Unknown model")}