import re
import pytz
import datetime
from typing import Dict, Any
from planning.content_profiles.utils import get_editor3_fields
from superdesk.text_utils import plain_text_to_html


def has_time(value: str):
    """Test if value has time component or only date."""
    return re.match(".*T[0-9]{2}:[0-9]{2}", value) is not None


def parse_date_utc(value: str) -> datetime.datetime:
    """Parse date as utc so will be stored as it is."""
    return datetime.datetime.fromisoformat(value).replace(tzinfo=pytz.utc)


def parse_duration(value: str) -> datetime.timedelta:
    match = re.match(
        "P" "(?P<days>[0-9]+D)?" "(?:T(?P<hours>[0-9]+H)?(?P<minutes>[0-9]+M)?(?P<seconds>[0-9]+S)?)?", value
    )
    if match:
        kwargs = {}
        for key in ("days", "hours", "minutes", "seconds"):
            if match.group(key):
                kwargs[key] = int(match.group(key)[:-1])
        if kwargs:
            return datetime.timedelta(**kwargs)
    raise ValueError(f"Could not parse duration string {value!r}")


def upgrade_rich_text_fields(item: Dict[str, Any], resource: str):
    item.update({field: plain_text_to_html(item[field]) for field in get_editor3_fields(resource) if item.get(field)})
