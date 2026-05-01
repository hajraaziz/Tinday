from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from config.supabase import supabase
from config.settings import settings

from routers import embed, recommend, chat, preference

app = FastAPI(title="Tinday AI Service")

app.include_router(embed.router, tags=["AI"])
app.include_router(recommend.router, tags=["AI"])
app.include_router(chat.router, tags=["AI"])
app.include_router(preference.router, tags=["AI"])

@app.middleware("http")
async def verify_internal_key(request: Request, call_next):
    # Skip middleware for health check
    if request.url.path == "/health":
        return await call_next(request)
        
    if request.headers.get("X-Internal-Key") != settings.internal_service_secret:
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    return await call_next(request)

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
