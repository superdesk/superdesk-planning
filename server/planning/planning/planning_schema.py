# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import logging
from copy import deepcopy

from eve.utils import config

from superdesk.resource import Resource, not_analyzed, string_with_analyzer
from superdesk.metadata.item import metadata_schema, ITEM_TYPE

from planning.common import (
    WORKFLOW_STATE_SCHEMA,
    TO_BE_CONFIRMED_FIELD,
    TO_BE_CONFIRMED_FIELD_SCHEMA,
    POST_STATE_SCHEMA,
    UPDATE_METHODS,
)

logger = logging.getLogger(__name__)


assigned_to_schema = {
    "type": "dict",
    "mapping": {
        "type": "object",
        "properties": {
            "assignment_id": not_analyzed,
            "state": not_analyzed,
            "contact": not_analyzed,
        },
    },
}

coverage_schema = {
    # Identifiers
    "coverage_id": {"type": "string", "mapping": not_analyzed},
    "original_coverage_id": {"type": "string", "mapping": not_analyzed},
    "guid": metadata_schema["guid"],
    # Audit Information
    "original_creator": metadata_schema["original_creator"],
    "version_creator": metadata_schema["version_creator"],
    "firstcreated": metadata_schema["firstcreated"],
    "versioncreated": metadata_schema["versioncreated"],
    # News Coverage Details
    # See IPTC-G2-Implementation_Guide 16.4
    "planning": {
        "type": "dict",
        "schema": {
            "ednote": metadata_schema["ednote"],
            "g2_content_type": {"type": "string", "mapping": not_analyzed},
            "coverage_provider": {"type": "string", "mapping": not_analyzed},
            "contact_info": Resource.rel("contacts", type="string", nullable=True),
            "item_class": {"type": "string", "mapping": not_analyzed},
            "item_count": {"type": "string", "mapping": not_analyzed},
            "scheduled": {"type": "datetime"},
            "files": {
                "type": "list",
                "nullable": True,
                "schema": Resource.rel("planning_files"),
                "mapping": not_analyzed,
            },
            "xmp_file": Resource.rel("planning_files", nullable=True),
            "service": {
                "type": "list",
                "mapping": {"properties": {"qcode": not_analyzed, "name": not_analyzed}},
            },
            "news_content_characteristics": {
                "type": "list",
                "mapping": {"properties": {"name": not_analyzed, "value": not_analyzed}},
            },
            "planning_ext_property": {
                "type": "list",
                "mapping": {
                    "properties": {
                        "qcode": not_analyzed,
                        "value": not_analyzed,
                        "name": not_analyzed,
                    }
                },
            },
            # Metadata hints.  See IPTC-G2-Implementation_Guide 16.5.1.1
            "by": {"type": "list", "mapping": {"type": "string"}},
            "credit_line": {"type": "list", "mapping": {"type": "string"}},
            "dateline": {"type": "list", "mapping": {"type": "string"}},
            "description_text": metadata_schema["description_text"],
            "genre": metadata_schema["genre"],
            "headline": metadata_schema["headline"],
            "keyword": {"type": "list", "mapping": {"type": "string"}},
            "language": metadata_schema["language"],
            "slugline": metadata_schema["slugline"],
            "subject": metadata_schema["subject"],
            "internal_note": {"type": "string", "nullable": True},
            "workflow_status_reason": {"type": "string", "nullable": True},
            "priority": metadata_schema["priority"],
        },  # end planning dict schema
    },  # end planning
    "news_coverage_status": {
        "type": "dict",
        "allow_unknown": True,
        "schema": {
            "qcode": {"type": "string"},
            "name": {"type": "string"},
            "label": {"type": "string"},
        },
    },
    "workflow_status": {"type": "string"},
    "previous_status": {"type": "string"},
    "assigned_to": assigned_to_schema,
    "flags": {
        "type": "dict",
        "allow_unknown": True,
        "schema": {"no_content_linking": {"type": "boolean", "default": False}},
    },
    TO_BE_CONFIRMED_FIELD: TO_BE_CONFIRMED_FIELD_SCHEMA,
    "scheduled_updates": {
        "type": "list",
        "schema": {
            "type": "dict",
            "schema": {
                "scheduled_update_id": {"type": "string", "mapping": not_analyzed},
                "coverage_id": {"type": "string", "mapping": not_analyzed},
                "workflow_status": {"type": "string"},
                "assigned_to": assigned_to_schema,
                "previous_status": {"type": "string"},
                "news_coverage_status": {
                    "type": "dict",
                    "allow_unknown": True,
                    "schema": {
                        "qcode": {"type": "string"},
                        "name": {"type": "string"},
                        "label": {"type": "string"},
                    },
                },
                "planning": {
                    "type": "dict",
                    "schema": {
                        "internal_note": {"type": "string", "nullable": True},
                        "contact_info": Resource.rel("contacts", type="string", nullable=True),
                        "scheduled": {"type": "datetime"},
                        "genre": metadata_schema["genre"],
                        "workflow_status_reason": {"type": "string", "nullable": True},
                    },
                },
            },
        },
    },  # end scheduled_updates
}  # end coverage_schema

event_type = deepcopy(Resource.rel("events", type="string"))
event_type["mapping"] = not_analyzed

planning_schema = {
    # Identifiers
    config.ID_FIELD: metadata_schema[config.ID_FIELD],
    "guid": metadata_schema["guid"],
    # Audit Information
    "original_creator": metadata_schema["original_creator"],
    "version_creator": metadata_schema["version_creator"],
    "firstcreated": metadata_schema["firstcreated"],
    "versioncreated": metadata_schema["versioncreated"],
    # Ingest Details
    "ingest_provider": metadata_schema["ingest_provider"],
    "source": metadata_schema["source"],
    "original_source": metadata_schema["original_source"],
    "ingest_provider_sequence": metadata_schema["ingest_provider_sequence"],
    "ingest_firstcreated": metadata_schema["versioncreated"],
    "ingest_versioncreated": metadata_schema["versioncreated"],
    # Agenda Item details
    "agendas": {
        "type": "list",
        "schema": Resource.rel("agenda"),
        "mapping": not_analyzed,
    },
    # Related Events
    "related_events": {
        "type": "list",
        "required": False,
        "schema": {
            "type": "dict",
            "allow_unknown": True,
            "schema": {
                "_id": Resource.rel("events", type="string", required=True),
                "recurrence_id": {
                    "type": "string",
                    "nullable": True,
                },
                "link_type": {
                    "type": "string",
                    "required": True,
                    "default": "primary",
                    "allowed": ["primary", "secondary"],
                },
            },
        },
        "mapping": {
            "type": "nested",
            "properties": {
                "_id": not_analyzed,
                "recurrence_id": not_analyzed,
                "link_type": not_analyzed,
            },
        },
    },
    "recurrence_id": {
        "type": "string",
        "mapping": not_analyzed,
        "nullable": True,
    },
    "planning_recurrence_id": {
        "type": "string",
        "mapping": not_analyzed,
        "nullable": True,
    },
    # Planning Details
    # NewsML-G2 Event properties See IPTC-G2-Implementation_Guide 16
    # Planning Item Metadata - See IPTC-G2-Implementation_Guide 16.1
    "item_class": {"type": "string", "default": "plinat:newscoverage"},
    "ednote": metadata_schema["ednote"],
    "description_text": metadata_schema["description_text"],
    "internal_note": {"type": "string", "nullable": True},
    "anpa_category": metadata_schema["anpa_category"],
    "subject": metadata_schema["subject"],
    "genre": metadata_schema["genre"],
    "company_codes": metadata_schema["company_codes"],
    # Content Metadata - See IPTC-G2-Implementation_Guide 16.2
    "language": metadata_schema["language"],
    "languages": {
        "type": "list",
        "mapping": not_analyzed,
    },
    "translations": {
        "type": "list",
        "mapping": {
            "type": "nested",
            "properties": {
                "field": not_analyzed,
                "language": not_analyzed,
                "value": metadata_schema["slugline"]["mapping"],
            },
        },
    },
    "abstract": metadata_schema["abstract"],
    "headline": metadata_schema["headline"],
    "slugline": metadata_schema["slugline"],
    "keywords": metadata_schema["keywords"],
    "word_count": metadata_schema["word_count"],
    "priority": metadata_schema["priority"],
    "urgency": metadata_schema["urgency"],
    "profile": metadata_schema["profile"],
    # These next two are for spiking/unspiking and purging of planning/agenda items
    "state": WORKFLOW_STATE_SCHEMA,
    "expiry": {"type": "datetime", "nullable": True},
    "expired": {"type": "boolean", "default": False},
    "featured": {"type": "boolean"},
    "lock_user": metadata_schema["lock_user"],
    "lock_time": metadata_schema["lock_time"],
    "lock_session": metadata_schema["lock_session"],
    "lock_action": metadata_schema["lock_action"],
    "coverages": {
        "type": "list",
        "default": [],
        "schema": {
            "type": "dict",
            "schema": coverage_schema,
        },
        "mapping": {
            "type": "nested",
            "properties": {
                "coverage_id": not_analyzed,
                "planning": {
                    "type": "object",
                    "properties": {
                        "slugline": metadata_schema["slugline"]["mapping"],
                    },
                },
                "assigned_to": assigned_to_schema["mapping"],
                "original_creator": {
                    "type": "keyword",
                },
            },
        },
    },
    # field to sync coverage scheduled information
    # to be used for sorting/filtering on scheduled
    "_planning_schedule": {
        "type": "list",
        "mapping": {
            "type": "nested",
            "properties": {
                "coverage_id": not_analyzed,
                "scheduled": {"type": "date"},
            },
        },
    },
    # field to sync scheduled_updates scheduled information
    # to be used for sorting/filtering on scheduled
    "_updates_schedule": {
        "type": "list",
        "mapping": {
            "type": "nested",
            "properties": {
                "scheduled_update_id": not_analyzed,
                "scheduled": {"type": "date"},
            },
        },
    },
    "planning_date": {
        "type": "datetime",
        "nullable": False,
    },
    "flags": {
        "type": "dict",
        "schema": {
            "marked_for_not_publication": metadata_schema["flags"]["schema"]["marked_for_not_publication"],
            # If the config is set to create coverage items in workflow this flag will override that and allow coverages
            # created for this planning item to be created in draft
            "overide_auto_assign_to_workflow": {"type": "boolean", "default": False},
        },
    },
    # Public/Published status
    "pubstatus": POST_STATE_SCHEMA,
    # The previous state the item was in before for example being spiked,
    # when un-spiked it will revert to this state
    "revert_state": metadata_schema["revert_state"],
    # Item type used by superdesk publishing
    ITEM_TYPE: {
        "type": "string",
        "mapping": not_analyzed,
        "default": "planning",
    },
    # Identifier used to synchronise the posted planning item with an external system.
    "unique_id": {"type": "string", "mapping": not_analyzed},
    "place": metadata_schema["place"],
    # Name used to identify the planning item
    "name": {"type": "string"},
    "files": {
        "type": "list",
        "nullable": True,
        "schema": Resource.rel("planning_files"),
        "mapping": not_analyzed,
    },
    # Reason (if any) for the current state (cancelled, postponed, rescheduled)
    "state_reason": {"type": "string", "nullable": True},
    TO_BE_CONFIRMED_FIELD: TO_BE_CONFIRMED_FIELD_SCHEMA,
    "_type": {"type": "string", "mapping": None},
    "extra": metadata_schema["extra"],
    "versionposted": {"type": "datetime", "nullable": False},
    # The update method used for recurring planning items
    "update_method": {
        "type": "string",
        "allowed": UPDATE_METHODS,
        "mapping": not_analyzed,
        "nullable": True,
    },
}  # end planning_schema
