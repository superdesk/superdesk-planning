from typing import Dict
from superdesk.publish.formatters.ninjs_formatter import get_locale_name


def format_subject(item) -> None:
    if item.get("subject"):
        item["subject"] = [_format_subject(subject, item) for subject in item["subject"]]


def _format_subject(subject: Dict, item: Dict) -> Dict:
    if item.get("language") and subject.get("translations"):
        subject["name"] = get_locale_name(subject, item["language"])
    return subject
