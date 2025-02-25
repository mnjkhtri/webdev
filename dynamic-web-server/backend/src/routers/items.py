from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/v1/items", tags=["items"])

# Simulated database
fake_items_db = [
    {"item_name": "Drip"},
    {"item_name": "Flex"},
    {"item_name": "Vibe"}
]

@router.get("/{item_id}")
async def fetch_item_by_id(item_id: int):
    if item_id < len(fake_items_db):
        return {"item_id": item_id, "item_name": fake_items_db[item_id]["item_name"]}
    raise HTTPException(status_code=404, detail="Item not found")

@router.get("/")
async def fetch_items_by_offset(skip: int = 0, limit: int = 10):
    return fake_items_db[skip: skip + limit]