import pytest

@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "fastapi"}

@pytest.mark.asyncio
async def test_unauthorized_internal_call(client):
    response = await client.post("/embed", json={"user_id": "test", "profile_text": "test"})
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_recommend_endpoint(client, auth_headers, mocker):
    # Mock get_recommendations where it's used
    mocker.patch("routers.recommend.get_recommendations", return_value=["user1", "user2"])
    
    payload = {
        "user_id": "test-user",
        "filters": {"skills": ["Python"]},
        "limit": 10,
        "exclude_ids": []
    }
    response = await client.post("/recommend", json=payload, headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == {"ranked_user_ids": ["user1", "user2"]}
