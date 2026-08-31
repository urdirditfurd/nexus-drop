"""Celery worker entrypoint."""

from celery_app import app

import tasks  # noqa: F401 — register task modules

if __name__ == "__main__":
    app.start(argv=["worker", "-l", "info"])
