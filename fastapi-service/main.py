from fastapi import FastAPI
from config.supabase import supabase
from config.settings import settings

app = FastAPI(title="Tinday AI Service")

@app.on_event("startup")
async def startup_event():
    # Test Supabase connectivity
    try:
        # Simple query to check connection
        supabase.table("profiles").select("count", count="exact").limit(0).execute()
        print("Successfully connected to Supabase")
    except Exception as e:
        print(f"Failed to connect to Supabase: {e}")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "fastapi"}
