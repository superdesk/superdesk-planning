from typing import Dict
from superdesk.publish.formatters.ninjs_formatter import get_locale_name


def translate_names(item) -> None:
    """Translate names in CV values to match the item language."""
    for field in ("subject", "anpa_category", "calendars"):
        if item.get(field):
            item[field] = [_translate_name(value, item) for value in item[field]]


def _translate_name(value: Dict, item: Dict) -> Dict:
    if item.get("language") and value.get("translations"):
        value["name"] = get_locale_name(value, item["language"])
    return value
