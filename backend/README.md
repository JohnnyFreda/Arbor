# Arbor Backend

FastAPI backend for the Arbor application.

## Setup

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your database URL and secret key
```

3. Run database migrations:

```bash
alembic upgrade head
```

4. Start the development server:

```bash
uvicorn app.main:app --reload --port 8420
```

The API will be available at `http://localhost:8420`. The port is 8420 rather than the usual 8000 to stay out of the way of other projects; set `ARBOR_API_PORT` to change it, and give the same value to both uvicorn and the Vite dev server, which proxies to it.

## API Documentation

Once the server is running, visit:

- Swagger UI: `http://localhost:8420/docs`
- ReDoc: `http://localhost:8420/redoc`

## Testing

Run tests with:

```bash
pytest
```
