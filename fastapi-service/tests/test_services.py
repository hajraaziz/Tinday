import pytest
import numpy as np
from services.preference_service import update_preferences

def test_preference_update_math(mocker):
    # Mock supabase client
    mock_supabase = mocker.patch("services.preference_service.supabase")
    
    user_id = "user1"
    target_id = "target1"
    
    # Mock target embedding
    target_embedding = [1.0] * 768
    # We need to mock the chain: supabase.table().select().eq().execute()
    mock_execute_target = mocker.Mock()
    mock_execute_target.data = [{"embedding": str(target_embedding)}]
    
    mock_execute_pref = mocker.Mock()
    mock_execute_pref.data = [{"preference_vector": str([0.0] * 768)}]
    
    # Configure side_effect for execute to return different values for different calls
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.side_effect = [
        mock_execute_target,
        mock_execute_pref
    ]
    
    # Mock rpc().execute()
    mock_rpc_execute = mocker.Mock()
    mock_supabase.rpc.return_value.execute.return_value = mock_rpc_execute
    
    # Run update
    success = update_preferences(user_id, target_id, "RIGHT")
    assert success is True
    
    # Capture the updated vector sent to RPC
    assert mock_supabase.rpc.called
    args, kwargs = mock_supabase.rpc.call_args
    updated_vector = args[1]["pref_vector"]
    
    # Expected: 0.95 * 0 + 0.05 * 1 = 0.05. Normalized: [1/sqrt(768)] * 768
    expected_val = 1.0 / np.sqrt(768)
    for val in updated_vector:
        assert val == pytest.approx(expected_val, abs=1e-6)
