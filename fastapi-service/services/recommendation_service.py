import json
from config.supabase import supabase


def parse_vector(v):
    """
    supabase-py returns vector columns as strings like "[-0.026,0.013,...]".
    This helper converts them to Python lists of floats before passing to RPC.
    """
    if v is None:
        return None
    if isinstance(v, str):
        return json.loads(v)
    return v  # already a list


def get_recommendations(user_id: str, filters: dict, limit: int, exclude_ids: list):
    preference_vector = None

    # 1. Fetch preference vector
    result = supabase.table('user_preferences') \
        .select('preference_vector') \
        .eq('user_id', user_id) \
        .execute()

    if result.data and len(result.data) > 0:
        raw_pv = result.data[0].get('preference_vector')
        pv = parse_vector(raw_pv)
        # Only use preference vector if it is non-zero.
        # init_preference_vector seeds it with all zeros so we must check.
        if pv and any(v != 0 for v in pv):
            preference_vector = pv

    # 2. Fall back to profile embedding if preference vector is zero/missing
    if not preference_vector:
        profile = supabase.table('profiles') \
            .select('embedding') \
            .eq('id', user_id) \
            .execute()
        if profile.data and len(profile.data) > 0:
            preference_vector = parse_vector(profile.data[0].get('embedding'))

    if not preference_vector:
        return []

    # 3. Resolve filters
    #    CRITICAL: pass None (not []) for skills_filter when no skills are
    #    provided. The SQL check is `skills_filter IS NULL` for "no filter".
    #    An empty array makes `p.skills && '{}'` always FALSE, silently
    #    excluding every profile from results.
    skills = filters.get('skills') if filters else None
    skills_filter = skills if skills else None  # [] becomes None

    min_exp = filters.get('min_experience') if filters else None
    max_exp = filters.get('max_experience') if filters else None

    # 4. Call match_profiles RPC — vectors must be plain Python lists, not strings
    match_result = supabase.rpc('match_profiles', {
        'query_vector': preference_vector,
        'requesting_user_id': user_id,
        'exclude_ids': exclude_ids or [],
        'skills_filter': skills_filter,
        'min_exp': min_exp,
        'max_exp': max_exp,
        'result_limit': limit or 20
    }).execute()

    return [row['user_id'] for row in match_result.data]