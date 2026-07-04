from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    workspace_dir: str = "/app/workspace"
    database_path: str = "data/amd_port_studio.db"
    cors_origins: str = "http://localhost:3000"

    # AI
    ai_provider: str = "mock"  # mock | gemini | fireworks
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    fireworks_api_key: str = ""
    fireworks_model: str = "accounts/fireworks/models/llama-v3p1-8b-instruct"

    class Config:
        env_file = ".env"


settings = Settings()