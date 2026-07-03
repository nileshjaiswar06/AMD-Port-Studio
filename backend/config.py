from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    workspace_dir: str = "/app/workspace"
    database_path: str = "data/amd_port_studio.db"
    cors_origins: str = "http://localhost:3000"

    class Config:
        env_file = ".env"


settings = Settings()