expected_es_mapping = {
    "properties": {
        "_created": {"type": "date"},
        "_etag": {"type": "text"},
        "_planning_item": {"type": "keyword"},
        "_planning_schedule": {
            "properties": {"coverage_id": {"type": "keyword"}, "scheduled": {"type": "date"}},
            "type": "nested",
        },
        "_reschedule_from_schedule": {"type": "date"},
        "_time_to_be_confirmed": {"type": "boolean"},
        "_updated": {"type": "date"},
        "_updates_schedule": {
            "properties": {"scheduled": {"type": "date"}, "scheduled_update_id": {"type": "keyword"}},
            "type": "nested",
        },
        "abstract": {"analyzer": "html_field_analyzer", "type": "text"},
        "access_status": {
            "properties": {
                "name": {"type": "keyword"},
                "qcode": {"type": "keyword"},
                "translations": {"enabled": False, "type": "object"},
            }
        },
        "accreditation_deadline": {"type": "date"},
        "accreditation_info": {"type": "text"},
        "actioned_date": {"type": "date"},
        "agendas": {"type": "keyword"},
        "anpa_category": {
            "properties": {
                "name": {"type": "keyword"},
                "qcode": {"type": "keyword"},
                "translations": {"enabled": False, "type": "object"},
            }
        },
        "associated_plannings": {"enabled": False, "type": "object"},
        "calendars": {
            "properties": {
                "name": {"type": "keyword"},
                "qcode": {"type": "keyword"},
                "translations": {"enabled": False, "type": "object"},
            }
        },
        "company_codes": {
            "properties": {
                "name": {"type": "keyword"},
                "qcode": {"type": "keyword"},
                "security_exchange": {"type": "keyword"},
            }
        },
        "completed": {"type": "boolean"},
        "coverages": {
            "properties": {
                "_time_to_be_confirmed": {"type": "boolean"},
                "add_coverage_to_workflow": {"type": "boolean"},
                "assigned_to": {
                    "properties": {
                        "assignment_id": {"type": "keyword"},
                        "contact": {"type": "keyword"},
                        "coverage_provider": {
                            "properties": {
                                "name": {"type": "keyword"},
                                "qcode": {"type": "keyword"},
                                "translations": {"enabled": False, "type": "object"},
                            }
                        },
                        "desk": {"type": "keyword"},
                        "state": {"type": "keyword"},
                        "user": {"type": "keyword"},
                    }
                },
                "coverage_id": {"type": "keyword"},
                "firstcreated": {"type": "date"},
                "flags": {"properties": {"no_content_linking": {"type": "boolean"}}},
                "guid": {"type": "keyword"},
                "news_coverage_status": {
                    "properties": {
                        "label": {"type": "keyword"},
                        "name": {"type": "keyword"},
                        "qcode": {"type": "keyword"},
                    }
                },
                "original_coverage_id": {"type": "keyword"},
                "original_creator": {"type": "keyword"},
                "planning": {
                    "properties": {
                        "anpa_category": {
                            "properties": {
                                "name": {"type": "keyword"},
                                "qcode": {"type": "keyword"},
                                "translations": {"enabled": False, "type": "object"},
                            }
                        },
                        "by": {"type": "text"},
                        "contact_info": {"type": "keyword"},
                        "coverage_provider": {
                            "properties": {
                                "name": {"type": "keyword"},
                                "qcode": {"type": "keyword"},
                                "translations": {"enabled": False, "type": "object"},
                            }
                        },
                        "credit_line": {"type": "text"},
                        "dateline": {"type": "text"},
                        "description_text": {"analyzer": "html_field_analyzer", "type": "text"},
                        "ednote": {"type": "text"},
                        "fields": {
                            "properties": {
                                "field": {"type": "keyword"},
                                "value": {"analyzer": "html_field_analyzer", "type": "text"},
                            }
                        },
                        "files": {"type": "keyword"},
                        "g2_content_type": {"type": "keyword"},
                        "genre": {
                            "properties": {
                                "name": {"type": "keyword"},
                                "qcode": {"type": "keyword"},
                                "translations": {"enabled": False, "type": "object"},
                            }
                        },
                        "headline": {"analyzer": "html_field_analyzer", "type": "text"},
                        "internal_note": {"type": "text"},
                        "item_class": {"type": "keyword"},
                        "item_count": {"type": "integer"},
                        "keyword": {"type": "text"},
                        "language": {"type": "keyword"},
                        "location": {
                            "properties": {
                                "address": {
                                    "properties": {
                                        "boundingbox": {"type": "text"},
                                        "city": {"type": "keyword"},
                                        "country": {"type": "keyword"},
                                        "extra": {"enabled": False, "type": "object"},
                                        "line": {"type": "text"},
                                        "locality": {"type": "keyword"},
                                        "state": {"type": "keyword"},
                                        "title": {"type": "text"},
                                        "type": {"type": "keyword"},
                                    }
                                },
                                "details": {"type": "text"},
                                "extra": {"enabled": False, "type": "object"},
                                "formatted_address": {"type": "text"},
                                "geo": {"type": "text"},
                                "location": {"type": "geo_point"},
                                "name": {
                                    "analyzer": "html_field_analyzer",
                                    "fields": {"keyword": {"type": "keyword"}},
                                    "type": "text",
                                },
                                "qcode": {"type": "keyword"},
                                "translations": {"enabled": False, "type": "object"},
                            }
                        },
                        "multiple_content": {"type": "boolean"},
                        "news_content_characteristics": {
                            "properties": {"name": {"type": "keyword"}, "value": {"type": "keyword"}}
                        },
                        "planning_ext_property": {
                            "properties": {
                                "name": {"type": "keyword"},
                                "qcode": {"type": "keyword"},
                                "value": {"type": "keyword"},
                            }
                        },
                        "priority": {"type": "integer"},
                        "scheduled": {"type": "date"},
                        "service": {
                            "properties": {
                                "name": {"type": "keyword"},
                                "qcode": {"type": "keyword"},
                                "translations": {"enabled": False, "type": "object"},
                            }
                        },
                        "slugline": {
                            "fields": {
                                "keyword": {"type": "keyword"},
                                "phrase": {"analyzer": "phrase_prefix_analyzer", "type": "text"},
                                "text": {"analyzer": "html_field_analyzer", "type": "text"},
                            },
                            "type": "text",
                        },
                        "subject": {
                            "include_in_parent": True,
                            "properties": {
                                "name": {
                                    "fields": {"analyzed": {"analyzer": "html_field_analyzer", "type": "text"}},
                                    "type": "keyword",
                                },
                                "parent": {"type": "keyword"},
                                "qcode": {"type": "keyword"},
                                "scheme": {"type": "keyword"},
                                "translations": {
                                    "dynamic": False,
                                    "properties": {"name": {"dynamic": True, "type": "object"}},
                                    "type": "object",
                                },
                            },
                            "type": "nested",
                        },
                        "workflow_status_reason": {"type": "text"},
                        "xmp_file": {"type": "keyword"},
                    }
                },
                "previous_status": {"type": "keyword"},
                "profile": {"type": "keyword"},
                "scheduled_updates": {
                    "properties": {
                        "assigned_to": {
                            "properties": {
                                "assignment_id": {"type": "keyword"},
                                "contact": {"type": "keyword"},
                                "coverage_provider": {
                                    "properties": {
                                        "name": {"type": "keyword"},
                                        "qcode": {"type": "keyword"},
                                        "translations": {"enabled": False, "type": "object"},
                                    }
                                },
                                "desk": {"type": "keyword"},
                                "state": {"type": "keyword"},
                                "user": {"type": "keyword"},
                            }
                        },
                        "coverage_id": {"type": "keyword"},
                        "news_coverage_status": {
                            "properties": {
                                "label": {"type": "keyword"},
                                "name": {"type": "keyword"},
                                "qcode": {"type": "keyword"},
                            }
                        },
                        "planning": {
                            "properties": {
                                "contact_info": {"type": "keyword"},
                                "genre": {
                                    "properties": {
                                        "name": {"type": "keyword"},
                                        "qcode": {"type": "keyword"},
                                        "translations": {"enabled": False, "type": "object"},
                                    }
                                },
                                "internal_note": {"type": "text"},
                                "multiple_content": {"type": "boolean"},
                                "scheduled": {"type": "date"},
                                "workflow_status_reason": {"type": "text"},
                            }
                        },
                        "previous_status": {"type": "keyword"},
                        "scheduled_update_id": {"type": "keyword"},
                        "workflow_status": {"type": "keyword"},
                    }
                },
                "version_creator": {"type": "keyword"},
                "versioncreated": {"type": "date"},
                "workflow_status": {"type": "keyword"},
            },
            "type": "nested",
        },
        "dates": {
            "properties": {
                "all_day": {"type": "boolean"},
                "end": {"type": "date"},
                "no_end_time": {"type": "boolean"},
                "recurring_rule": {
                    "properties": {
                        "_created_externally": {"type": "boolean"},
                        "count": {"type": "integer"},
                        "endRepeatMode": {"type": "keyword"},
                        "frequency": {"type": "keyword"},
                        "interval": {"type": "integer"},
                        "until": {"type": "date"},
                        "byday": {"type": "text"},
                    }
                },
                "start": {"type": "date"},
                "tz": {"type": "keyword"},
            }
        },
        "definition_long": {"type": "text"},
        "definition_short": {"type": "text"},
        "duplicate_from": {"type": "keyword"},
        "duplicate_to": {"type": "keyword"},
        "ednote": {"type": "text"},
        "embedded_planning": {
            "properties": {
                "coverages": {"type": "object", "enabled": False},
                "planning_id": {"type": "keyword"},
                "update_method": {"type": "keyword"},
            }
        },
        "event_contact_info": {"type": "keyword"},
        "event_created": {"type": "date"},
        "event_lastmodified": {"type": "date"},
        "expired": {"type": "boolean"},
        "expiry": {"type": "date"},
        "extra": {"enabled": False, "type": "object"},
        "failed_planning_ids": {"type": "keyword"},
        "featured": {"type": "boolean"},
        "files": {"type": "keyword"},
        "firstcreated": {"type": "date"},
        "flags": {
            "properties": {
                "marked_for_not_publication": {"type": "boolean"},
                "overide_auto_assign_to_workflow": {"type": "boolean"},
            }
        },
        "genre": {
            "properties": {
                "name": {"type": "keyword"},
                "qcode": {"type": "keyword"},
                "translations": {"enabled": False, "type": "object"},
            }
        },
        "guid": {"type": "keyword"},
        "headline": {"analyzer": "html_field_analyzer", "type": "text"},
        "ingest_firstcreated": {"type": "date"},
        "ingest_id": {"type": "keyword"},
        "ingest_provider": {"type": "keyword"},
        "ingest_provider_sequence": {"type": "keyword"},
        "ingest_pubstatus": {"type": "keyword"},
        "ingest_versioncreated": {"type": "date"},
        "internal_note": {"type": "text"},
        "invitation_details": {"type": "text"},
        "item_class": {"type": "keyword"},
        "keywords": {"analyzer": "html_field_analyzer", "type": "text"},
        "language": {"type": "keyword"},
        "languages": {"type": "keyword"},
        "links": {"type": "text"},
        "location": {
            "properties": {
                "address": {
                    "properties": {
                        "boundingbox": {"type": "text"},
                        "city": {"type": "keyword"},
                        "country": {"type": "keyword"},
                        "extra": {"enabled": False, "type": "object"},
                        "line": {"type": "text"},
                        "locality": {"type": "keyword"},
                        "state": {"type": "keyword"},
                        "title": {"type": "text"},
                        "type": {"type": "keyword"},
                    }
                },
                "details": {"type": "text"},
                "extra": {"enabled": False, "type": "object"},
                "formatted_address": {"type": "text"},
                "geo": {"type": "text"},
                "location": {"type": "geo_point"},
                "name": {"analyzer": "html_field_analyzer", "fields": {"keyword": {"type": "keyword"}}, "type": "text"},
                "qcode": {"type": "keyword"},
                "translations": {"enabled": False, "type": "object"},
            }
        },
        "lock_action": {"type": "keyword"},
        "lock_session": {"type": "keyword"},
        "lock_time": {"type": "date"},
        "lock_user": {"type": "keyword"},
        "name": {"type": "text"},
        "news_coverage_status": {
            "properties": {"label": {"type": "keyword"}, "name": {"type": "keyword"}, "qcode": {"type": "keyword"}}
        },
        "occur_status": {
            "properties": {"label": {"type": "keyword"}, "name": {"type": "keyword"}, "qcode": {"type": "keyword"}}
        },
        "organizer": {
            "properties": {
                "name": {"type": "keyword"},
                "qcode": {"type": "keyword"},
                "translations": {"enabled": False, "type": "object"},
            }
        },
        "original_creator": {"type": "keyword"},
        "original_source": {"type": "text"},
        "participant": {
            "properties": {
                "name": {"type": "keyword"},
                "qcode": {"type": "keyword"},
                "translations": {"enabled": False, "type": "object"},
            }
        },
        "participant_requirement": {
            "properties": {
                "name": {"type": "keyword"},
                "qcode": {"type": "keyword"},
                "translations": {"enabled": False, "type": "object"},
            }
        },
        "place": {
            "dynamic": False,
            "properties": {
                "code": {"type": "keyword"},
                "country": {"type": "keyword"},
                "country_code": {"type": "keyword"},
                "feature_class": {"type": "keyword"},
                "locality": {"type": "keyword"},
                "locality_code": {"type": "keyword"},
                "location": {"type": "geo_point"},
                "name": {"type": "keyword"},
                "qcode": {"type": "keyword"},
                "rel": {"type": "keyword"},
                "scheme": {"type": "keyword"},
                "state": {"type": "keyword"},
                "state_code": {"type": "keyword"},
                "world_region": {"type": "keyword"},
                "world_region_code": {"type": "keyword"},
            },
        },
        "planning_ids": {"type": "keyword"},
        "planning_recurrence_id": {"type": "keyword"},
        "previous_recurrence_id": {"type": "keyword"},
        "priority": {"type": "integer"},
        "profile": {"type": "keyword"},
        "pubstatus": {"type": "keyword"},
        "recurrence_id": {"type": "keyword"},
        "reference": {"type": "text"},
        "registration": {"type": "text"},
        "registration_details": {"type": "text"},
        "related_content": {"dynamic": False, "properties": {"guid": {"type": "keyword"}}},
        "related_events": {
            "properties": {
                "_id": {"type": "keyword"},
                "link_type": {"type": "keyword"},
                "recurrence_id": {"type": "keyword"},
            },
            "type": "nested",
        },
        "related_planning": {
            "properties": {
                "_id": {"type": "keyword"},
                "link_type": {"type": "keyword"},
                "recurrence_id": {"type": "keyword"},
            },
            "type": "nested",
        },
        "relationships": {
            "properties": {
                "broader": {"type": "keyword"},
                "narrower": {"type": "keyword"},
                "related": {"type": "keyword"},
            }
        },
        "reschedule_from": {"type": "keyword"},
        "reschedule_to": {"type": "keyword"},
        "revert_state": {"type": "keyword"},
        "slugline": {
            "fields": {
                "keyword": {"type": "keyword"},
                "phrase": {"analyzer": "phrase_prefix_analyzer", "type": "text"},
                "text": {"analyzer": "html_field_analyzer", "type": "text"},
            },
            "type": "text",
        },
        "source": {"type": "text"},
        "state": {"type": "keyword"},
        "state_reason": {"type": "text"},
        "subject": {
            "include_in_parent": True,
            "properties": {
                "name": {
                    "fields": {"analyzed": {"analyzer": "html_field_analyzer", "type": "text"}},
                    "type": "keyword",
                },
                "parent": {"type": "keyword"},
                "qcode": {"type": "keyword"},
                "scheme": {"type": "keyword"},
                "translations": {
                    "dynamic": False,
                    "properties": {"name": {"dynamic": True, "type": "object"}},
                    "type": "object",
                },
            },
            "type": "nested",
        },
        "template": {"type": "keyword"},
        "translations": {
            "properties": {
                "field": {"type": "keyword"},
                "language": {"type": "keyword"},
                "value": {
                    "fields": {
                        "keyword": {"type": "keyword"},
                        "phrase": {"analyzer": "phrase_prefix_analyzer", "type": "text"},
                        "text": {"analyzer": "html_field_analyzer", "type": "text"},
                    },
                    "type": "text",
                },
            },
            "type": "nested",
        },
        "type": {"type": "keyword"},
        "unique_id": {"type": "keyword"},
        "unique_name": {"type": "keyword"},
        "update_method": {"type": "keyword"},
        "urgency": {"type": "integer"},
        "version": {"type": "integer"},
        "version_creator": {"type": "keyword"},
        "versioncreated": {"type": "date"},
        "versionposted": {"type": "date"},
        "word_count": {"type": "integer"},
    }
}
