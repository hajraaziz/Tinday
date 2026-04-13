from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    supabase_url: str
    supabase_service_role_key: str
    gemini_api_key: str
    internal_service_secret: str

    model_config = SettingsConfigDict(env_file='.env', extra='ignore')

settings = Settings()
