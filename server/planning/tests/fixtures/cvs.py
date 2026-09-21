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


def eventoccurstatus() -> dict:
    return {
        "_id": "eventoccurstatus",
        "display_name": "Event Occurence Status",
        "type": "manageable",
        "unique_field": "qcode",
        "items": [
            {"is_active": True, "qcode": "eocstat:eos0", "name": "Unplanned event", "label": "Unplanned event"},
            {
                "is_active": True,
                "qcode": "eocstat:eos1",
                "name": "Planned, occurence planned only",
                "label": "Planned, occurence planned only",
            },
            {
                "is_active": True,
                "qcode": "eocstat:eos2",
                "name": "Planned, occurence highly uncertain",
                "label": "Planned, occurence highly uncertain",
            },
            {"is_active": True, "qcode": "eocstat:eos3", "name": "Planned, May occur", "label": "Planned, May occur"},
            {
                "is_active": True,
                "qcode": "eocstat:eos4",
                "name": "Planned, occurence highly likely",
                "label": "Planned, occurence highly likely",
            },
            {
                "is_active": True,
                "qcode": "eocstat:eos5",
                "name": "Planned, occurs certainly",
                "label": "Planned, occurs certainly",
            },
            {
                "is_active": True,
                "qcode": "eocstat:eos6",
                "name": "Planned, then cancelled",
                "label": "Planned, then cancelled",
            },
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


def genre() -> dict:
    return {
        "_id": "genre",
        "display_name": "Genre",
        "type": "manageable",
        "items": [
            {"is_active": True, "name": "Article (news)", "qcode": "Article"},
            {"is_active": True, "name": "Sidebar", "qcode": "Sidebar"},
            {"is_active": True, "name": "Factbox", "qcode": "Factbox"},
            {"is_active": True, "name": "Feature", "qcode": "Feature"},
            {"is_active": True, "name": "Newsfeature", "qcode": "Newsfeature"},
            {"is_active": True, "name": "Backgrounder", "qcode": "Backgrounder"},
            {"is_active": True, "name": "Opinion", "qcode": "Opinion"},
            {"is_active": True, "name": "View (incl parly sketch)", "qcode": "View"},
            {"is_active": True, "name": "Modular", "qcode": "Modular"},
            {"is_active": True, "name": "Broadcast Script", "qcode": "Broadcast Script"},
            {"is_active": True, "name": "Briefs", "qcode": "Briefs"},
            {"is_active": True, "name": "Colour piece", "qcode": "Colour piece"},
            {"is_active": True, "name": "Obituary", "qcode": "Obituary"},
            {"is_active": True, "name": "Analysis", "qcode": "Analysis"},
            {"is_active": True, "name": "Timeline", "qcode": "Timeline"},
            {"is_active": True, "name": "Chronology", "qcode": "Chronology"},
            {"is_active": True, "name": "Interview", "qcode": "Interview"},
            {"is_active": True, "name": "Results (sport)", "qcode": "Results (sport)"},
            {"is_active": True, "name": "Market Open", "qcode": "Market Open"},
            {"is_active": True, "name": "Market Close", "qcode": "Market Close"},
            {"is_active": True, "name": "Market Report", "qcode": "Market Report"},
            {"is_active": True, "name": "Review", "qcode": "Review"},
            {"is_active": True, "name": "Preview", "qcode": "Preview"},
        ],
    }


def languages() -> dict:
    return {
        "_id": "languages",
        "display_name": "Languages",
        "type": "manageable",
        "unique_field": "qcode",
        "service": {"all": 1},
        "items": [
            {"qcode": "en", "name": "English", "is_active": True},
            {"qcode": "nl", "name": "Dutch", "is_active": True},
            {"qcode": "fr", "name": "French", "is_active": True},
            {"qcode": "de", "name": "German", "is_active": True},
        ],
    }


def all_cvs() -> list[dict]:
    return [g2_content_type(), eventoccurstatus(), newscoveragestatus(), genre(), languages()]
