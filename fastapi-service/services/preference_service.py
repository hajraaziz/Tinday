import json
import numpy as np
from config.supabase import supabase


def parse_vector(v):
    """
    supabase-py returns vector columns as strings like "[-0.026,0.013,...]".
    Convert to a Python list of floats before passing to numpy.
    """
    if v is None:
        return None
    if isinstance(v, str):
        return json.loads(v)
    return v  # already a list


def update_preferences(user_id: str, target_user_id: str, direction: str):
    # 1. Fetch target profile embedding
    target_res = supabase.table('profiles') \
        .select('embedding') \
        .eq('id', target_user_id) \
        .execute()

    if not target_res.data:
        return False

    target_embedding = parse_vector(target_res.data[0].get('embedding'))  # <-- parse string → list

    if not target_embedding:
        return False

    # 2. Fetch current preference vector
    pref_res = supabase.table('user_preferences') \
        .select('preference_vector') \
        .eq('user_id', user_id) \
        .execute()

    current_vector = None
    if pref_res.data:
        current_vector = parse_vector(pref_res.data[0].get('preference_vector'))  # <-- parse string → list

    if not current_vector:
        # Initialize with zero vector if missing
        current_vector = [0.0] * 768

    # 3. Apply update rule using numpy
    current = np.array(current_vector, dtype=np.float64)  # <-- explicit dtype
    target = np.array(target_embedding, dtype=np.float64)  # <-- explicit dtype

    if direction == "RIGHT":
        updated = 0.95 * current + 0.05 * target
    else:
        updated = 0.95 * current - 0.02 * target

    norm = np.linalg.norm(updated)
    if norm > 0:
        updated = updated / norm

    updated_list = updated.tolist()

    # 4. Write back via RPC
    supabase.rpc('upsert_preference_vector', {
        'target_user_id': user_id,
        'pref_vector': updated_list
    }).execute()

    return True