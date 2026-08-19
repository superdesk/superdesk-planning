def event1() -> dict:
    return {
        "_id": "event1",
        "guid": "event1",
        "name": "Grand prix",
        "type": "event",
        "definition_short": "Grand prix formula 1 Prague",
        "dates": {"start": "2049-06-11T09:00:00+0000", "end": "2049-06-30T21:00:00+0000", "tz": "Africa/Accra"},
        "calendars": [
            {"is_active": True, "name": "Entertainment", "qcode": "entertainment"},
            {"is_active": True, "name": "Finance", "qcode": "finance"},
        ],
    }


def all_events() -> list[dict]:
    return [event1()]
