import logging
from time import monotonic
from uuid import uuid4

from starlette.datastructures import Headers
from starlette.types import ASGIApp, Message, Receive, Scope, Send

logger = logging.getLogger("artham.requests")


class RequestContextMiddleware:
    def __init__(self, app: ASGIApp, max_request_bytes: int) -> None:
        self.app = app
        self.max_request_bytes = max_request_bytes

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        state = scope.setdefault("state", {})
        request_id = Headers(scope=scope).get("x-request-id") or f"req_{uuid4().hex}"
        state["request_id"] = request_id
        started = monotonic()
        status_code = 500
        received_bytes = 0

        async def limited_receive() -> Message:
            nonlocal received_bytes
            message = await receive()
            if message["type"] == "http.request":
                received_bytes += len(message.get("body", b""))
                if received_bytes > self.max_request_bytes:
                    raise RequestTooLargeError
            return message

        async def request_send(message: Message) -> None:
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
                headers = list(message.get("headers", []))
                headers.append((b"x-request-id", request_id.encode("ascii")))
                message["headers"] = headers
            await send(message)

        content_length = Headers(scope=scope).get("content-length")
        if content_length:
            try:
                declared_bytes = int(content_length)
            except ValueError:
                from app.core.responses import send_invalid_content_length

                await send_invalid_content_length(scope, request_send)
                return
            if declared_bytes < 0:
                from app.core.responses import send_invalid_content_length

                await send_invalid_content_length(scope, request_send)
                return
            if declared_bytes > self.max_request_bytes:
                from app.core.responses import send_request_too_large

                await send_request_too_large(scope, request_send)
                return

        try:
            await self.app(scope, limited_receive, request_send)
        except RequestTooLargeError:
            from app.core.responses import send_request_too_large

            await send_request_too_large(scope, request_send)
        finally:
            logger.info(
                "request_complete method=%s path=%s status=%d duration_ms=%.2f request_id=%s",
                scope["method"],
                scope["path"],
                status_code,
                (monotonic() - started) * 1000,
                request_id,
            )


class RequestTooLargeError(Exception):
    pass
