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


def all_cvs() -> list[dict]:
    return [g2_content_type()]
