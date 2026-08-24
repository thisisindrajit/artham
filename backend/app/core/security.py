import secrets
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import Settings, get_settings
from app.core.exceptions import APIError

bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class ServicePrincipal:
    name: str
    role: str


def get_service_principal(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> ServicePrincipal:
    expected = settings.internal_api_key.get_secret_value()
    if (
        credentials is None
        or credentials.scheme.lower() != "bearer"
        or not secrets.compare_digest(credentials.credentials, expected)
    ):
        raise APIError(
            status_code=401,
            code="INVALID_SERVICE_IDENTITY",
            message="A valid service bearer token is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return ServicePrincipal(name="artham-adk", role="story-pipeline")
