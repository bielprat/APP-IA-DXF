FROM python:3.12-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy
# Optional build-time CA for corporate TLS proxies (docker/certs/README.md).
COPY docker/certs/ /usr/local/share/ca-certificates/extra/
RUN update-ca-certificates
ENV PIP_CERT=/etc/ssl/certs/ca-certificates.crt UV_NATIVE_TLS=1
RUN pip install --no-cache-dir uv==0.8.17
WORKDIR /app
COPY services/cad/pyproject.toml services/cad/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY services/cad/app ./app
RUN useradd --create-home --uid 10001 cad
USER cad
EXPOSE 8000
HEALTHCHECK --interval=15s --timeout=3s --retries=5 \
  CMD ["/app/.venv/bin/python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health')"]
CMD ["/app/.venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
