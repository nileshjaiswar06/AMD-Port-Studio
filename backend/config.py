from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    workspace_dir: str = "/app/workspace"
    database_path: str = "data/amd_port_studio.db"
    cors_origins: str = "http://localhost:3000"

    ai_provider: str = "gemini"  # gemini | fireworks
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    fireworks_api_key: str = ""
    fireworks_model: str = "accounts/fireworks/models/llama-v3p1-8b-instruct"
    hourly_rate: float = 110.0
    max_zip_upload_bytes: int = 50 * 1024 * 1024  # 50MB

    class Config:
        env_file = ".env"


settings = Settings()
