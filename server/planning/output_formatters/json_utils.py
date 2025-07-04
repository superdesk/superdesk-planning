from superdesk.publish.formatters.ninjs_formatter import get_locale_name


def translate_names(item: dict, fields: set[str]) -> None:
    """Translate names in CV values to match the item language."""
    for field in fields:
        if item.get(field):
            item[field] = [_translate_name(value, item) for value in item[field]]


def _translate_name(value: dict, item: dict) -> dict:
    if item.get("language") and value.get("translations"):
        value["name"] = get_locale_name(value, item["language"])
    return value
