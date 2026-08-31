"""Utilitaires sérialisation JSON pour champs texte."""

from __future__ import annotations

import json
from typing import Any


def dumps_json(value: Any) -> str | None:
    """Sérialise en JSON ou None."""
    if value is None:
        return None
    return json.dumps(value, ensure_ascii=False)


def loads_json_list(raw: str | None) -> list[str]:
    """Désérialise une liste JSON depuis un champ Text."""
    if not raw:
        return []
    try:
        data = json.loads(raw)
        if isinstance(data, list):
            return [str(x) for x in data]
    except json.JSONDecodeError:
        pass
    return []
