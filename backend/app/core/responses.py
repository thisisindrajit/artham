import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import OperationalError
from starlette.exceptions import HTTPException
from starlette.types import Scope, Send

from app.core.exceptions import APIError

logger = logging.getLogger("artham.errors")


def request_id_from_scope(scope: Scope) -> str:
    return scope.get("state", {}).get("request_id", "req_unknown")


def error_response(
    *,
    status_code: int,
    code: str,
    message: str,
    request_id: str,
    retryable: bool = False,
    details: dict[str, Any] | None = None,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "retryable": retryable,
                "request_id": request_id,
                "details": details or {},
            }
        },
        headers=headers,
    )


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(APIError)
    async def handle_api_error(request: Request, exc: APIError) -> JSONResponse:
        return error_response(
            status_code=exc.status_code,
            code=exc.code,
            message=exc.message,
            retryable=exc.retryable,
            request_id=request.state.request_id,
            details=exc.details,
            headers=exc.headers,
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        errors = [
            {
                "type": error["type"],
                "location": [str(value) for value in error["loc"]],
                "message": error["msg"],
            }
            for error in exc.errors()
        ]
        return error_response(
            status_code=400,
            code="INVALID_REQUEST",
            message="The request does not match the API contract.",
            request_id=request.state.request_id,
            details={"errors": errors},
        )

    @app.exception_handler(HTTPException)
    async def handle_http_error(request: Request, exc: HTTPException) -> JSONResponse:
        code = "RESOURCE_NOT_FOUND" if exc.status_code == 404 else "HTTP_ERROR"
        return error_response(
            status_code=exc.status_code,
            code=code,
            message=str(exc.detail),
            request_id=request.state.request_id,
        )

    @app.exception_handler(OperationalError)
    async def handle_database_unavailable(request: Request, exc: OperationalError) -> JSONResponse:
        logger.exception("database_dependency_failure request_id=%s", request.state.request_id)
        return error_response(
            status_code=503,
            code="DATABASE_UNAVAILABLE",
            message="The database is temporarily unavailable.",
            retryable=True,
            request_id=request.state.request_id,
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("unexpected_request_failure request_id=%s", request.state.request_id)
        return error_response(
            status_code=500,
            code="INTERNAL_ERROR",
            message="An unexpected internal error occurred.",
            retryable=False,
            request_id=request.state.request_id,
        )


async def send_request_too_large(scope: Scope, send: Send) -> None:
    response = error_response(
        status_code=413,
        code="REQUEST_TOO_LARGE",
        message="The request exceeds the configured size limit.",
        request_id=request_id_from_scope(scope),
    )
    await response(scope, _empty_receive, send)


async def send_invalid_content_length(scope: Scope, send: Send) -> None:
    response = error_response(
        status_code=400,
        code="INVALID_REQUEST",
        message="The Content-Length header must be a non-negative integer.",
        request_id=request_id_from_scope(scope),
    )
    await response(scope, _empty_receive, send)


async def _empty_receive() -> dict[str, Any]:
    return {"type": "http.request", "body": b"", "more_body": False}
