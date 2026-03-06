from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    app_name: str = 'Clinical Data API'
    app_env: str = 'development'
    api_v1_prefix: str = '/api/v1'

    database_url: str = 'postgresql+psycopg2://clinical_user:clinical_pass@localhost:55432/clinical_data'

    api_bearer_token: str | None = None
    jwt_secret_key: str | None = None
    jwt_algorithm: str = 'HS256'
    access_token_exp_minutes: int = 60
    allow_insecure_dev_auth: bool = False

    bootstrap_admin_login: str | None = None
    bootstrap_admin_email: str | None = None
    bootstrap_admin_password: str | None = None
    bootstrap_admin_full_name: str = 'System Administrator'
    bootstrap_admin_role: str = Field(default='admin')

    cors_origins: str = 'http://localhost:3000,http://127.0.0.1:3000'

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(',') if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


