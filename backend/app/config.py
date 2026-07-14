"""
Central configuration for the BridgeGuard AI API.

All values can be overridden with environment variables (see .env.example).
Nothing here is hardcoded app *data* -- only infrastructure settings
(secret key, token lifetime, DB location) live in this file.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "BridgeGuard AI"
    secret_key: str = "CHANGE_ME_IN_PRODUCTION_super_secret_key_please_rotate"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 8  # 8 hour session
    database_url: str = "sqlite:///./bridgeguard.db"

    # default admin created on first boot if no users exist yet
    default_admin_username: str = "admin"
    default_admin_password: str = "Admin@123"
    default_admin_full_name: str = "System Administrator"

    class Config:
        env_file = ".env"


settings = Settings()
