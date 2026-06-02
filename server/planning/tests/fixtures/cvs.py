def g2_content_type() -> dict:
    return {
        "_id": "g2_content_type",
        "display_name": "Coverage content types",
        "type": "manageable",
        "unique_field": "qcode",
        "selection_type": "do not show",
        "items": [
            {"is_active": True, "name": "Text", "qcode": "text", "content item type": "text"},
            {"is_active": True, "name": "Picture", "qcode": "picture", "content item type": "picture"},
            {"is_active": True, "name": "Video", "qcode": "video", "content item type": "video"},
            {"is_active": True, "name": "Audio", "qcode": "audio", "content item type": "audio"},
            {"is_active": True, "name": "Infographics", "qcode": "infographics", "content item type": ""},
            {"is_active": True, "name": "Live video", "qcode": "live_video", "content item type": ""},
            {"is_active": True, "name": "Live blog", "qcode": "live_blog", "content item type": ""},
        ],
    }


def newscoveragestatus() -> dict:
    return {
        "_id": "newscoveragestatus",
        "display_name": "News Coverage Status",
        "type": "manageable",
        "unique_field": "qcode",
        "selection_type": "do not show",
        "items": [
            {"is_active": True, "qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
            {"is_active": True, "qcode": "ncostat:notdec", "name": "coverage not decided yet", "label": "On merit"},
            {"is_active": False, "qcode": "ncostat:notint", "name": "coverage not intended", "label": "Not planned"},
            {"is_active": True, "qcode": "ncostat:onreq", "name": "coverage upon request", "label": "On request"},
        ],
    }


def all_cvs() -> list[dict]:
    return [g2_content_type(), newscoveragestatus()]
