from google import genai
from google.genai import types
from config.settings import settings
from config.supabase import supabase

client = genai.Client(api_key=settings.gemini_api_key)

def generate_embedding(user_id: str, profile_text: str):
    # Call Gemini text-embedding-004
    result = client.models.embed_content(
        model="gemini-embedding-001",         
        contents=profile_text,
        config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT")
    )
    
    embedding = result.embeddings[0].values
    
    # Upsert to Supabase
    supabase.rpc('upsert_embedding', {
        'target_user_id': user_id,
        'embedding_vector': embedding
    }).execute()
    
    # Initialize preference vector if not exists
    supabase.rpc('init_preference_vector', {
        'target_user_id': user_id
    }).execute()
    
    return embedding
