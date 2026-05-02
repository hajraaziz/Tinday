import pytest
from httpx import AsyncClient, ASGITransport
from main import app
from config.settings import settings

@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest.fixture
def auth_headers():
    return {"X-Internal-Key": settings.internal_service_secret}
