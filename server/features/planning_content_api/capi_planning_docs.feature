Feature: ContentAPI Planning docs
    Scenario: Can return CAPI Planning yaml file
        When we get raw "/api-planning-static/swagger.yaml"
        Then we get OK response
        And we get yaml
        And we check yaml against dict
        """
        {
            "openapi": "3.1.1",
            "info": {"title": "Content API"},
            "servers": [{
                "url": "http://localhost:5400",
                "description": "Development server"
            }],
            "tags": [
                {"name": "Events", "description": "Event items"},
                {"name": "Planning", "description": "Planning items"}
            ]
        }
        """
        # Check parameters
        And we check yaml against dict
        """
        {"components": {
            "parameters": {
                "start_date": {"in": "query", "schema": {"type": "string"}},
                "end_date": {"in": "query", "schema": {"type": "string"}},
                "date_filter": {"in": "query", "schema": {"$ref": "#/components/schemas/SearchDateRange"}},
                "time_zone": {"in": "query", "schema": {"type": "string"}},
                "start_of_week": {"in": "query", "schema": {"type": "integer"}},
                "include_fields": {"in": "query", "schema": {"type": "array", "items": {"type": "string"}}},
                "exclude_fields": {"in": "query", "schema": {"type": "array", "items": {"type": "string"}}},
                "max_results": {"in": "query", "schema": {"type": "integer"}},
                "page": {"in": "query", "schema": {"type": "integer"}},
                "where": {"in": "query", "schema": {"type": "string"}},
                "q": {"in": "query", "schema": {"type": "string"}},
                "default_operator": {"in": "query", "schema": {"$ref": "#/components/schemas/DefaultOperator"}},
                "item_id": {"in": "path", "schema": {"type": "string"}}
            },
            "schemas": {
                "SearchDateRange": {
                    "type": "string",
                    "enum": ["today", "tomorrow", "this_week", "next_week", "last24", "for_date"]
                },
                "DefaultOperator": {
                    "type": "string",
                    "enum": ["AND", "OR"]
                }
            }
        }}
        """
        # Check Event paths
        And we check yaml against dict
        """
        {"paths": {"/events": {"get": {
            "tags": ["Events"],
            "parameters": [
                {"$ref": "#/components/parameters/start_date"},
                {"$ref": "#/components/parameters/end_date"},
                {"$ref": "#/components/parameters/date_filter"},
                {"$ref": "#/components/parameters/time_zone"},
                {"$ref": "#/components/parameters/start_of_week"},
                {"$ref": "#/components/parameters/include_fields"},
                {"$ref": "#/components/parameters/exclude_fields"},
                {"$ref": "#/components/parameters/max_results"},
                {"$ref": "#/components/parameters/page"},
                {"$ref": "#/components/parameters/where"},
                {"$ref": "#/components/parameters/q"},
                {"$ref": "#/components/parameters/default_operator"}
            ],
            "responses": {
                "200": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "_items": {
                                        "type": "array",
                                        "items": {"$ref": "#/components/schemas/ContentAPIEventResponse"}
                                    },
                                    "_meta": {
                                        "type": "object",
                                        "properties": {
                                            "page": {"type": "integer"},
                                            "max_results": {"type": "integer"},
                                            "total": {"type": "integer"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }}}}
        """
        And we check yaml against dict
        """
        {"paths": {"/events/<string:item_id>": {
            "parameters": [{"$ref": "#/components/parameters/item_id"}],
            "get": {
                "tags": ["Events"],
                "responses": {
                    "200": {
                        "content": {
                            "application/json": {"schema": {"$ref": "#/components/schemas/ContentAPIEventResponse"}}
                        }
                    }
                }
            }
        }}}
        """
        # Check Planning paths
        And we check yaml against dict
        """
        {"paths": {"/planning": {"get": {
            "tags": ["Planning"],
            "parameters": [
                {"$ref": "#/components/parameters/start_date"},
                {"$ref": "#/components/parameters/end_date"},
                {"$ref": "#/components/parameters/date_filter"},
                {"$ref": "#/components/parameters/time_zone"},
                {"$ref": "#/components/parameters/start_of_week"},
                {"$ref": "#/components/parameters/include_fields"},
                {"$ref": "#/components/parameters/exclude_fields"},
                {"$ref": "#/components/parameters/max_results"},
                {"$ref": "#/components/parameters/page"},
                {"$ref": "#/components/parameters/where"},
                {"$ref": "#/components/parameters/q"},
                {"$ref": "#/components/parameters/default_operator"}
            ],
            "responses": {
                "200": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "_items": {
                                        "type": "array",
                                        "items": {"$ref": "#/components/schemas/ContentAPIPlanningResponse"}
                                    },
                                    "_meta": {
                                        "type": "object",
                                        "properties": {
                                            "page": {"type": "integer"},
                                            "max_results": {"type": "integer"},
                                            "total": {"type": "integer"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }}}}
        """
        And we check yaml against dict
        """
        {"paths": {"/planning/<string:item_id>": {
            "parameters": [{"$ref": "#/components/parameters/item_id"}],
            "get": {
                "tags": ["Planning"],
                "responses": {
                    "200": {
                        "content": {
                            "application/json": {"schema": {"$ref": "#/components/schemas/ContentAPIPlanningResponse"}}
                        }
                    }
                }
            }
        }}}
        """
        # Common schema items
        And we check yaml against dict
        """
        {"components": {"schemas": {
            "MatchingProduct": {
                "type": "object",
                "required": ["code", "name"],
                "properties": {
                    "code": {"type": "string", "format": "objectid"},
                    "name": {"type": "string"}
                }
            },
            "KeywordQCodeName": {
                "type": "object",
                "required": ["qcode", "name"],
                "properties": {
                    "qcode": {"type": "string"},
                    "name": {"type": "string"}
                }
            },
            "Subject": {
                "type": "object",
                "required": ["qcode", "name"],
                "properties": {
                    "qcode": {"type": "string"},
                    "name": {"type": "string"},
                    "scheme": {"type": "string"},
                    "translations": {"type": "object", "additionalProperties": true}
                }
            },
            "PostStates": {
                "type": "string",
                "enum": ["usable", "cancelled"]
            },
            "Place": {
                "type": "object",
                "properties": {
                    "scheme": {"type": "string"},
                    "qcode": {"type": "string"},
                    "code": {"type": "string"},
                    "name": {"type": "string"},
                    "locality": {"type": "string"},
                    "state": {"type": "string"},
                    "country": {"type": "string"},
                    "world_region": {"type": "string"},
                    "locality_code": {"type": "string"},
                    "state_code": {"type": "string"},
                    "country_code": {"type": "string"},
                    "world_region_code": {"type": "string"},
                    "feature_class": {"type": "string"},
                    "location": {"$ref": "#/components/schemas/Geopoint"},
                    "rel": {"type": "string"}
                }
            },
            "Geopoint": {
                "type": "object",
                "required": ["lat", "lon"],
                "properties": {
                    "lat": {"type": "number"},
                    "lon": {"type": "number"}
                }
            }
        }}}
        """
        # Check Event schema
        And we check yaml against dict
        """
        {"components": {"schemas": {
            "ContentAPIEventResponse": {
                "type": "object",
                "title": "Content API / Event",
                "required": ["_id", "dates", "plans"],
                "properties": {
                    "_id": {"type": "string"},
                    "firstcreated": {"type": "string", "format": "date-time"},
                    "versioncreated": {"type": "string", "format": "date-time"},
                    "products": {"type": "array", "items": {"$ref": "#/components/schemas/MatchingProduct"}},
                    "version": {"type": "integer"},
                    "ingest_id": {"type": "string"},
                    "recurrence_id": {"type": "string"},
                    "source": {"type": "string"},
                    "original_source": {"type": "string"},
                    "name": {"type": "string"},
                    "anpa_category": {"type": "array", "items": {"$ref": "#/components/schemas/KeywordQCodeName"}},
                    "priority": {"type": "integer"},
                    "subject": {"type": "array", "items": {"$ref": "#/components/schemas/Subject"}},
                    "slugline": {"type": "string"},
                    "language": {"type": "string"},
                    "pubstatus": {"$ref": "#/components/schemas/PostStates"},
                    "place": {"type": "array", "items": {"$ref": "#/components/schemas/Place"}},
                    "ednote": {"type": "string"},
                    "extra": {"type": "object", "additionalProperties": true},
                    "type": {"type": "string", "default": "event"},
                    "definition_short": {"type": "string"},
                    "definition_long": {"type": "string"},
                    "registration_details": {"type": "string"},
                    "invitation_details": {"type": "string"},
                    "accreditation_info": {"type": "string"},
                    "accreditation_deadline": {
                        "type": "string",
                        "anyOf": [
                            {"title": "Date", "pattern": "^\\d{4}-\\d{2}-\\d{2}$"},
                            {"title": "Date and time", "pattern": "^\\d{4}-\\d{2}-\\d{2}(T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?)$"},
                            {"title": "Date, time and UTC offset", "pattern": "^\\d{4}-\\d{2}-\\d{2}(T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(Z|[+-]\\d{2}(:?\\d{2})?)?)?$"}
                        ]
                    },
                    "reference": {"type": "string"},
                    "links": {"type": "array", "items": {"type": "string"}},
                    "dates": {"$ref": "#/components/schemas/DatesObject"},
                    "occur_status": {"$ref": "#/components/schemas/OccurStatus"},
                    "location": {"type": "array", "items": {"$ref": "#/components/schemas/EventLocation"}},
                    "event_contact_info": {"type": "array", "items": {"$ref": "#/components/schemas/ContactsResource"}},
                    "calendars": {"type": "array", "items": {"$ref": "#/components/schemas/KeywordQCodeName"}},
                    "related_items": {"type": "array", "items": {"$ref": "#/components/schemas/RelatedItem"}},
                    "plans": {"type": "array", "items": {"type": "string"}}
                }
            },
            "DatesObject": {
                "type": "object",
                "anyOf": [
                    {"oneOf": [
                        {"required": "startDate", "title": "Start date & time"},
                        {"required": "expectedStartDate", "title": "Start date"}
                    ]},
                    {"oneOf": [
                        {"required": "endDate", "title": "End date & time"},
                        {"required": "expectedEndDate", "title": "End date"}
                    ]}
                ],
                "properties": {
                    "startDate": {"type": "string", "format": "date-time"},
                    "endDate": {"type": "string", "format": "date-time"},
                    "expectedStartDate": {
                        "type": "string",
                        "anyOf": [
                            {"title": "Date", "pattern": "^\\d{4}-\\d{2}-\\d{2}$"},
                            {"title": "Date and time", "pattern": "^\\d{4}-\\d{2}-\\d{2}(T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?)$"},
                            {"title": "Date, time and UTC offset", "pattern": "^\\d{4}-\\d{2}-\\d{2}(T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(Z|[+-]\\d{2}(:?\\d{2})?)?)?$"}
                        ]
                    },
                    "expectedEndDate": {
                        "type": "string",
                        "anyOf": [
                            {"title": "Date", "pattern": "^\\d{4}-\\d{2}-\\d{2}$"},
                            {"title": "Date and time", "pattern": "^\\d{4}-\\d{2}-\\d{2}(T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?)$"},
                            {"title": "Date, time and UTC offset", "pattern": "^\\d{4}-\\d{2}-\\d{2}(T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(Z|[+-]\\d{2}(:?\\d{2})?)?)?$"}
                        ]
                    },
                    "recurrence": {"$ref": "#/components/schemas/RecurrenceObject"},
                    "timezone": {"type": "string"}
                }
            },
            "RecurrenceObject": {
                "type": "object",
                "required": ["recurrenceRules"],
                "properties": {
                    "recurrenceRules": {
                        "type": "array",
                        "items": {"$ref": "#/components/schemas/RecurrenceRulesObject"}
                    }
                }
            },
            "RecurrenceRulesObject": {
                "type": "object",
                "required": ["frequency", "interval"],
                "properties": {
                    "frequency": {"$ref": "#/components/schemas/RecurrenceRulesFrequency"},
                    "interval": {"type": "integer"},
                    "until": {"type": "string", "format": "date-time"},
                    "count": {"type": "integer"},
                    "byday": {"type": "string"}
                }
            },
            "RecurrenceRulesFrequency": {
                "type": "string",
                "enum": ["daily", "weekly", "monthly", "yearly"]
            },
            "OccurStatus": {
                "type": "object",
                "properties": {
                    "qcode": {"type": "string"},
                    "name": {"type": "string"},
                    "label": {"type": "string"}
                }
            },
            "EventLocation": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "qcode": {"type": "string"},
                    "address": {"$ref": "#/components/schemas/LocationAddress"},
                    "geo": {"type": "string"},
                    "location": {"$ref": "#/components/schemas/Geopoint"},
                    "extra": {"type": "object", "additionalProperties": true},
                    "details": {"type": "string"}
                }
            },
            "LocationAddress": {
                "type": "object",
                "properties": {
                    "boundingbox": {"type": "array", "items": {"type": "string"}},
                    "city": {"type": "string"},
                    "state": {"type": "string"},
                    "country": {"type": "string"},
                    "line": {"type": "array", "items": {"type": "string"}},
                    "locality": {"type": "string"},
                    "title": {"type": "string"},
                    "type": {"type": "string"},
                    "extra": {"type": "object", "additionalProperties": true}
                }
            },
            "ContactsResource": {
                "type": "object",
                "properties": {
                    "uri": {"type": "string"},
                    "organisation": {"type": "string"},
                    "first_name": {"type": "string"},
                    "last_name": {"type": "string"},
                    "honorific": {"type": "string"},
                    "job_title": {"type": "string"},
                    "job_title": {"type": "string"},
                    "mobile": {"type": "array", "items": {"$ref": "#/components/schemas/ContactPhoneNumber"}},
                    "contact_phone": {"type": "array", "items": {"$ref": "#/components/schemas/ContactPhoneNumber"}},
                    "fax": {"type": "string"},
                    "contact_email": {"type": "array", "items": {"type": "string"}},
                    "twitter": {"type": "string"},
                    "facebook": {"type": "string"},
                    "instagram": {"type": "string"},
                    "website": {"type": "string"},
                    "contact_address": {"type": "array", "items": {"type": "string"}},
                    "locality": {"type": "array", "items": {"type": "string"}},
                    "city": {"type": "array", "items": {"type": "string"}},
                    "contact_state": {"$ref": "#/components/schemas/ContactLocationEntity"},
                    "postcode": {"type": "string"},
                    "country": {"$ref": "#/components/schemas/ContactLocationEntity"},
                    "notes": {"type": "string"},
                    "contact_type": {"type": "string"}
                }
            },
            "ContactPhoneNumber": {
                "type": "object",
                "required": ["number"],
                "properties": {
                    "number": {"type": "string"},
                    "usage": {"type": "string"}
                }
            },
            "ContactLocationEntity": {
                "type": "object",
                "required": ["name", "qcode"],
                "properties": {
                    "name": {"type": "string"},
                    "qcode": {"type": "string"},
                    "translations": {"type": "object", "additionalProperties": {"type": "string"}}
                }
            },
            "RelatedItem": {
                "type": "object",
                "required": ["guid"],
                "properties": {
                    "guid": {"type": "string"},
                    "type": {"type": "string"},
                    "version": {"type": "integer"},
                    "source": {"type": "string"},
                    "headline": {"type": "string", "format": "html"},
                    "slugline": {"type": "string"},
                    "versioncreated": {"type": "string", "format": "date-time"},
                    "pubstatus": {"type": "string"},
                    "language": {"type": "string"},
                    "word_count": {"type": "integer"}
                }
            }
        }}}
        """
        # Check Planning schema
        And we check yaml against dict
        """
        {"components": {"schemas": {
            "ContentAPIPlanningResponse": {
                "type": "object",
                "required": ["_id", "planning_date"],
                "title": "Content API / Planning",
                "properties": {
                    "_id": {"type": "string"},
                    "firstcreated": {"type": "string", "format": "date-time"},
                    "versioncreated": {"type": "string", "format": "date-time"},
                    "products": {"type": "array", "items": {"$ref": "#/components/schemas/MatchingProduct"}},
                    "version": {"type": "integer"},
                    "ingest_id": {"type": "string"},
                    "recurrence_id": {"type": "string"},
                    "source": {"type": "string"},
                    "original_source": {"type": "string"},
                    "name": {"type": "string"},
                    "anpa_category": {"type": "array", "items": {"$ref": "#/components/schemas/KeywordQCodeName"}},
                    "priority": {"type": "integer"},
                    "subject": {"type": "array", "items": {"$ref": "#/components/schemas/Subject"}},
                    "slugline": {"type": "string"},
                    "language": {"type": "string"},
                    "pubstatus": {"$ref": "#/components/schemas/PostStates"},
                    "place": {"type": "array", "items": {"$ref": "#/components/schemas/Place"}},
                    "ednote": {"type": "string"},
                    "extra": {"type": "object", "additionalProperties": true},
                    "type": {"type": "string", "default": "planning"},
                    "planning_date": {"type": "string", "format": "date-time"},
                    "description_text": {"type": "string", "format": "html"},
                    "agendas": {"type": "array", "items": {"$ref": "#/components/schemas/AgendaItem"}},
                    "headline": {"type": "string", "format": "html"},
                    "urgency": {"type": "integer"},
                    "events": {"type": "array", "items": {"$ref": "#/components/schemas/RelatedEvent"}},
                    "coverages": {"type": "array", "items": {"$ref": "#/components/schemas/ContentAPICoverageResponse"}}
                }
            },
            "AgendaItem": {
                "type": "object",
                "required": ["_id", "name"],
                "properties": {
                    "_id": {"type": "string", "format": "objectid"},
                    "name": {"type": "string"}
                }
            },
            "RelatedEvent": {
                "type": "object",
                "required": ["uri", "literal", "rel"],
                "properties": {
                    "uri": {"type": "string"},
                    "literal": {"type": "string"},
                    "rel": {"$ref": "#/components/schemas/LinkType"}
                }
            },
            "LinkType": {
                "type": "string",
                "enum": ["primary", "secondary"]
            },
            "ContentAPICoverageResponse": {
                "type": "object",
                "required": ["coverage_id"],
                "properties": {
                    "coverage_id": {"type": "string"},
                    "news_coverage_status": {"$ref": "#/components/schemas/NewsCoverageStatus"},
                    "workflow_status": {"type": "string"},
                    "deliveries": {"type": "array", "items": {"$ref": "#/components/schemas/CoverageDelivery"}},
                    "planning": {"$ref": "#/components/schemas/ContentAPICoveragePlanningResponse"}
                }
            },
            "NewsCoverageStatus": {
                "type": "object",
                "properties": {
                    "qcode": {"type": "string"},
                    "name": {"type": "string"},
                    "label": {"type": "string"}
                }
            },
            "CoverageDelivery": {
                "type": "object",
                "properties": {
                    "item_id": {"type": "string"},
                    "item_state": {"type": "string"},
                    "sequence_no": {"type": "integer"},
                    "publish_time": {"type": "string", "format": "date-time"}
                }
            },
            "ContentAPICoveragePlanningResponse": {
                "type": "object",
                "properties": {
                    "ednote": {"type": "string", "format": "html"},
                    "g2_content_type": {"type": "string"},
                    "genre": {"type": "array", "items": {"$ref": "#/components/schemas/KeywordQCodeName"}},
                    "headline": {"type": "string", "format": "html"},
                    "keyword": {"type": "array", "items": {"type": "string"}},
                    "language": {"type": "string"},
                    "slugline": {"type": "string"},
                    "workflow_status_reason": {"type": "string"},
                    "priority": {"type": "integer"},
                    "scheduled": {
                        "type": "string",
                        "anyOf": [
                            {"title": "Date", "pattern": "^\\d{4}-\\d{2}-\\d{2}$"},
                            {"title": "Date and time", "pattern": "^\\d{4}-\\d{2}-\\d{2}(T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?)$"},
                            {"title": "Date, time and UTC offset", "pattern": "^\\d{4}-\\d{2}-\\d{2}(T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(Z|[+-]\\d{2}(:?\\d{2})?)?)?$"}
                        ]
                    }
                }
            }
        }}}
        """
