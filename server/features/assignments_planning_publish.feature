Feature: For posted planning item changes in assignment state post a planning item
    Background: Initial setup
        Given the "validators"
        """
        [
        {
            "schema": {},
            "type": "text",
            "act": "publish",
            "_id": "publish_text"
        },
        {
            "_id": "publish_composite",
            "act": "publish",
            "type": "composite",
            "schema": {}
        }
        ]
        """
        Given "content_types"
        """
        [{"schema": {"body_html": {}, "slugline": {}, "headline": {}, "ednote": null }}]
        """
        Given "content_templates"
        """
        [
            {
                "template_name": "Default",
                "template_type": "create",
                "data": {
                  "profile": "#content_types._id#",
                  "slugline": "Foo",
                  "headline": "Headline From Template"
                }
            }
        ]
        """
        And "desks"
        """
        [
            {
                "name": "Sports",
                "content_expiry": 60,
                "members": [{"user": "#CONTEXT_USER_ID#"}],
                "default_content_template": "#content_templates._id#",
                "default_content_profile": "#content_types._id#"
            }
        ]
        """
        When we post to "/products" with success
        """
        {
            "name":"prod-1","codes":"abc,xyz", "product_type": "both"
        }
        """
        And we post to "/subscribers" with success
        """
        {
            "name":"News1","media_type":"media", "subscriber_type": "digital",
            "sequence_num_settings":{"min" : 1, "max" : 10}, "email": "test@test.com",
            "products": ["#products._id#"],
            "codes": "xyz, abc",
            "destinations": [
                {"name":"events", "format": "json_event", "delivery_type": "File", "config":{"file_path": "/tmp"}},
                {"name":"planning", "format": "json_planning", "delivery_type": "File", "config":{"file_path": "/tmp"}}
            ]
        }
        """
        And we post to "agenda"
        """
        [{
            "name": "TestAgenda"
        }]
        """
        And we post to "/planning"
        """
        [{
            "headline": "test headline",
            "slugline": "test slugline",
            "agendas": ["#agenda._id#"],
            "guid": "123",
            "planning_date": "2016-01-02",
            "coverages": [
                {
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    }
                }
            ]
        }]
        """
        Then we get OK response
        Then we store coverage id in "firstcoverage" from coverage 0

    @auth @vocabularies
    Scenario: Publish Planning item on changes to assignment state.
        Given "vocabularies"
        """
            [{
              "_id": "g2_content_type",
              "display_name": "Coverage content types",
              "type": "manageable",
              "unique_field": "qcode",
              "selection_type": "do not show",
              "items": [
                  {"is_active": true, "name": "Text", "qcode": "text", "content item type": "text"}
              ]
            }]
        """
        When we post to "/planning/post"
        """
        {
            "planning": "#planning._id#",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {"state": "scheduled"}
        """
        When we get "published_planning?sort=item_id,version"
        Then we get list with 1 items
        Then we store "PLANNING" with first item
        When we get "published_planning?where={\"item_id\": \"#PLANNING.item_id#\", \"version\": #PLANNING.version#}"
        Then we get list with 1 items
        """
        {
            "_items": [
                {
                    "item_id": "#planning._id#",
                    "type": "planning",
                    "published_item": {
                        "_id": "#planning._id#",
                        "agendas": ["#agenda._id#"],
                        "coverages": [
                            {
                                "workflow_status": "draft",
                                "news_coverage_status": {
                                  "qcode": "ncostat:int"
                                },
                                "planning": {
                                    "ednote": "test coverage, I want 250 words",
                                    "headline": "test headline",
                                    "slugline": "test slugline",
                                    "g2_content_type" : "text"
                                }
                            }
                        ]
                    }
                }
            ]
        }
        """
        When we transmit items
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-1.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "agendas": [{"name": "TestAgenda"}],
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "draft",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    },
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "deliveries": [],
                    "coverage_provider": null
                }
            ]
        }
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "active",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    },
                    "assigned_to": {
                        "desk": "#desks._id#",
                        "user": "#CONTEXT_USER_ID#",
                        "state": "assigned"
                    }
                }
            ]
        }
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 2 items
        Then we store "PLANNING" with 2 item
        When we get "published_planning?where={\"item_id\": \"#PLANNING.item_id#\", \"version\": #PLANNING.version#}"
        Then we get list with 1 items
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-2.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "agendas": [{"name": "TestAgenda"}],
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "assigned",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    },
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "deliveries": [],
                    "coverage_provider": null
                }
            ]
        }
        """
        When we post to "/assignments/content"
        """
        [{"assignment_id": "#firstassignment#"}]
        """
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "__any_value__",
            "assignment_id": "#firstassignment#",
            "task": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "stage": "#desks.working_stage#"
            },
            "slugline": "test slugline",
            "type": "text",
            "headline": "test headline"
        }
        """
        And we store "ARCHIVE_ID" with value "#content._id#" to context
        When we get "assignments/#firstassignment#"
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "in_progress"
            },
            "coverage_item": "#firstcoverage#"
        }
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 3 items
        Then we store "PLANNING" with 3 item
        When we get "published_planning?where={\"item_id\": \"#PLANNING.item_id#\", \"version\": #PLANNING.version#}"
        Then we get list with 1 items
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-3.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "agendas": [{"name": "TestAgenda"}],
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "active",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    },
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "coverage_provider": null
                }
            ]
        }
        """
        When we get "/archive/#ARCHIVE_ID#"
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "#ARCHIVE_ID#",
            "type": "text",
            "assignment_id": "#firstassignment#",
            "task": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "stage": "#desks.working_stage#"
            },
            "slugline": "test slugline"
        }
        """
        When we patch "/archive/#ARCHIVE_ID#"
        """
        {"slugline": "patched slugline"}
        """
        Then we get OK response
        When we get "assignments/#firstassignment#"
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "in_progress"
            },
            "coverage_item": "#firstcoverage#"
        }
        """
        When we get "published_planning?sort=item_id,version"
        Then we get list with 3 items
        When we post to "desks"
        """
            [{
                "name": "Politics",
                "content_expiry": 60,
                "members": [{"user": "#CONTEXT_USER_ID#"}],
                "default_content_template": "#content_templates._id#",
                "default_content_profile": "#content_types._id#"
            }]
        """
        And we post to "/archive/#ARCHIVE_ID#/move"
        """
        [{"task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#"}}]
        """
        Then we get OK response
        When we get "assignments/#firstassignment#"
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
            "assigned_to": {
                "desk": "#desks._id#",
                "user": null,
                "state": "submitted"
            },
            "coverage_item": "#firstcoverage#"
        }
        """
        When we get "published_planning?sort=item_id,version"
        Then we get list with 3 items
        When we publish "#ARCHIVE_ID#" with "publish" type and "published" state
        Then we get OK response
        When we get "/archive/#ARCHIVE_ID#"
        Then we get existing resource
        """
        {
            "_id": "#ARCHIVE_ID#",
            "type": "text",
            "assignment_id": "#firstassignment#",
            "state": "published",
            "slugline": "patched slugline"
        }
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 4 items
        Then we store "PLANNING" with 4 item
        When we get "published_planning?where={\"item_id\": \"#PLANNING.item_id#\", \"version\": #PLANNING.version#}"
        Then we get list with 1 items
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-4.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "agendas": [{"name": "TestAgenda"}],
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "completed",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    },
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "deliveries": [{"item_id": "#ARCHIVE_ID#"}],
                    "coverage_provider": null
                }
            ]
        }
        """

    @auth @vocabularies
    Scenario: Publish Planning item on removal of an assignment
        When we post to "/planning/post"
        """
        {
            "planning": "#planning._id#",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {"state": "scheduled"}
        """
        When we get "published_planning?sort=item_id,version"
        Then we get list with 1 items
        Then we store "PLANNING" with first item
        When we get "published_planning?where={\"item_id\": \"#PLANNING.item_id#\", \"version\": #PLANNING.version#}"
        Then we get list with 1 items
        """
        {
            "_items": [
                {
                    "item_id": "#planning._id#",
                    "type": "planning",
                    "published_item": {
                        "_id": "#planning._id#",
                        "agendas": ["#agenda._id#"],
                        "coverages": [
                            {
                                "workflow_status": "draft",
                                "news_coverage_status": {
                                  "qcode": "ncostat:int"
                                },
                                "planning": {
                                    "ednote": "test coverage, I want 250 words",
                                    "headline": "test headline",
                                    "slugline": "test slugline",
                                    "g2_content_type" : "text"
                                }
                            }
                        ]
                    }
                }
            ]
        }
        """
        When we transmit items
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-1.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "agendas": [{"name": "TestAgenda"}],
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "draft",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    },
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "deliveries": [],
                    "coverage_provider": null
                }
            ]
        }
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "active",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    },
                    "assigned_to": {
                        "desk": "#desks._id#",
                        "user": "#CONTEXT_USER_ID#",
                        "state": "assigned"
                    }
                }
            ]
        }
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 2 items
        Then we store "PLANNING" with 2 item
        When we get "published_planning?where={\"item_id\": \"#PLANNING.item_id#\", \"version\": #PLANNING.version#}"
        Then we get list with 1 items
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-2.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "agendas": [{"name": "TestAgenda"}],
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "assigned",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    },
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "deliveries": [],
                    "coverage_provider": null
                }
            ]
        }
        """
        When we post to "/assignments/#firstassignment#/lock"
        """
        {"lock_action": "remove_assignment"}
        """
        Then we get OK response
        When we post to "/planning/#planning._id#/lock"
        """
        {"lock_action": "remove_assignment"}
        """
        Then we get OK response
        When we delete "/assignments/#firstassignment#"
        Then we get OK response
        When we get "/assignments/#firstassignment#"
        Then we get error 404
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 3 items
        Then we store "PLANNING" with 3 item
        When we get "published_planning?where={\"item_id\": \"#PLANNING.item_id#\", \"version\": #PLANNING.version#}"
        Then we get list with 1 items
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-3.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "agendas": [{"name": "TestAgenda"}],
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "draft",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    },
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "deliveries": [],
                    "coverage_provider": null
                }
            ]
        }
        """

    @auth @vocabularies
    Scenario: Publish Planning item on linking and unlinking
        Given "vocabularies"
        """
            [{
              "_id": "g2_content_type",
              "display_name": "Coverage content types",
              "type": "manageable",
              "unique_field": "qcode",
              "selection_type": "do not show",
              "items": [
                  {"is_active": true, "name": "Text", "qcode": "text", "content item type": "text"}
              ]
          }]
        """
        When we post to "/planning/post"
        """
        {
            "planning": "#planning._id#",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {"state": "scheduled"}
        """
        When we get "published_planning?sort=item_id,version"
        Then we get list with 1 items
        Then we store "PLANNING" with first item
        When we get "published_planning?where={\"item_id\": \"#PLANNING.item_id#\", \"version\": #PLANNING.version#}"
        Then we get list with 1 items
        """
        {
            "_items": [
                {
                    "item_id": "#planning._id#",
                    "type": "planning",
                    "published_item": {
                        "_id": "#planning._id#",
                        "agendas": ["#agenda._id#"],
                        "coverages": [
                            {
                                "workflow_status": "draft",
                                "news_coverage_status": {
                                  "qcode": "ncostat:int"
                                },
                                "planning": {
                                    "ednote": "test coverage, I want 250 words",
                                    "headline": "test headline",
                                    "slugline": "test slugline",
                                    "g2_content_type" : "text"
                                }
                            }
                        ]
                    }
                }
            ]
        }
        """
        When we transmit items
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-1.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "agendas": [{"name": "TestAgenda"}],
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "draft",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    },
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "deliveries": [],
                    "coverage_provider": null
                }
            ]
        }
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "active",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    },
                    "assigned_to": {
                        "desk": "#desks._id#",
                        "user": "#CONTEXT_USER_ID#",
                        "state": "assigned"
                    }
                }
            ]
        }
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 2 items
        Then we store "PLANNING" with 2 item
        When we get "published_planning?where={\"item_id\": \"#PLANNING.item_id#\", \"version\": #PLANNING.version#}"
        Then we get list with 1 items
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-2.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "agendas": [{"name": "TestAgenda"}],
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "assigned",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    },
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "deliveries": [],
                    "coverage_provider": null
                }
            ]
        }
        """
        When we post to "/archive"
        """
        [{
            "guid": "123",
            "type": "text",
            "headline": "test headline",
            "slugline": "test slugline",
            "state": "in_progress",
            "task": {
                "desk": "#desks._id#",
                "stage": "#desks.incoming_stage#"
            }
        }]
        """
        Then we get OK response
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#",
            "reassign": false
        }]
        """
        Then we get OK response
        When we get "/archive/123"
        Then we get existing resource
        """
        {
            "assignment_id": "#firstassignment#"
        }
        """
        When we get "/assignments/#firstassignment#"
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
            "assigned_to": {
                "desk": "#desks._id#",
                "state": "in_progress"
            },
            "coverage_item": "#firstcoverage#"
        }
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 3 items
        Then we store "PLANNING" with 3 item
        When we get "published_planning?where={\"item_id\": \"#PLANNING.item_id#\", \"version\": #PLANNING.version#}"
        Then we get list with 1 items
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-3.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "agendas": [{"name": "TestAgenda"}],
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "active",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    },
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "deliveries": [],
                    "coverage_provider": null
                }
            ]
        }
        """
        When we publish "123" with "publish" type and "published" state
        Then we get OK response
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 4 items
        Then we store "PLANNING" with 4 item
        When we get "published_planning?where={\"item_id\": \"#PLANNING.item_id#\", \"version\": #PLANNING.version#}"
        Then we get list with 1 items
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-4.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "agendas": [{"name": "TestAgenda"}],
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "completed",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    },
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "deliveries": [{"item_id": "123"}],
                    "coverage_provider": null
                }
            ]
        }
        """
        When we post to "assignments/unlink" with success
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#"
        }]
        """
        Then we get OK response
        When we get "archive/#archive._id#"
        Then we get existing resource
        """
        {"assignment_id": "__none__"}
        """
        When we get "/assignments/#firstassignment#"
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
            "assigned_to": {
                "desk": "#desks._id#",
                "state": "assigned"
            },
            "coverage_item": "#firstcoverage#"
        }
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 5 items
        Then we store "PLANNING" with 5 item
        When we get "published_planning?where={\"item_id\": \"#PLANNING.item_id#\", \"version\": #PLANNING.version#}"
        Then we get list with 1 items
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-5.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "agendas": [{"name": "TestAgenda"}],
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "assigned",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    },
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "deliveries": [],
                    "coverage_provider": null
                }
            ]
        }
        """
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#",
            "reassign": false
        }]
        """
        Then we get OK response
        When we get "archive/#archive._id#"
        Then we get existing resource
        """
        {"assignment_id": "#firstassignment#"}
        """
        When we get "/assignments/#firstassignment#"
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
            "assigned_to": {
                "desk": "#desks._id#",
                "state": "completed"
            },
            "coverage_item": "#firstcoverage#"
        }
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 6 items
        Then we store "PLANNING" with 6 item
        When we get "published_planning?where={\"item_id\": \"#PLANNING.item_id#\", \"version\": #PLANNING.version#}"
        Then we get list with 1 items
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-6.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "agendas": [{"name": "TestAgenda"}],
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "completed",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    },
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "deliveries": [{"item_id": "123"}],
                    "coverage_provider": null
                }
            ]
        }
        """

    @auth @vocabularies
    Scenario: Publish Planning item on confirm and revert availability
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "active",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "g2_content_type" : "picture"
                    },
                    "assigned_to": {
                        "desk": "#desks._id#",
                        "user": "#CONTEXT_USER_ID#",
                        "state": "assigned"
                    }
                }
            ]
        }
        """
        Then we get OK response
        When we get "/planning/#planning._id#"
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "coverages": [
                {
                    "workflow_status": "active",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "g2_content_type" : "picture"
                    },
                    "assigned_to": {
                        "desk": "#desks._id#",
                        "user": "#CONTEXT_USER_ID#",
                        "state": "assigned"
                    }
                }
            ]
        }
        """
        Then we store assignment id in "firstassignment" from coverage 0
        When we post to "/planning/post"
        """
        {
            "planning": "#planning._id#",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {"state": "scheduled"}
        """
        When we get "published_planning?sort=item_id,version"
        Then we get list with 1 items
        Then we store "PLANNING" with first item
        When we get "published_planning?where={\"item_id\": \"#PLANNING.item_id#\", \"version\": #PLANNING.version#}"
        Then we get list with 1 items
        When we transmit items
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-1.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "agendas": [{"name": "TestAgenda"}],
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "assigned",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "g2_content_type" : "picture"
                    },
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "deliveries": [],
                    "coverage_provider": null
                }
            ]
        }
        """
        When we post to "/assignments/#firstassignment#/lock"
        """
        [{"lock_action": "complete"}]
        """
        Then we get OK response
        When we perform complete on assignments "#firstassignment#"
        """
        { }
        """
        Then we get OK response
        When we get "/assignments/#firstassignment#"
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
            "assigned_to": {
                "desk": "#desks._id#",
                "state": "completed"
            }
        }
        """
        When we get "published_planning?sort=item_id,version"
        Then we get list with 2 items
        Then we store "PLANNING" with 2 item
        When we get "published_planning?where={\"item_id\": \"#PLANNING.item_id#\", \"version\": #PLANNING.version#}"
        Then we get list with 1 items
        When we transmit items
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-2.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "agendas": [{"name": "TestAgenda"}],
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "completed",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "g2_content_type" : "picture"
                    },
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "deliveries": [],
                    "coverage_provider": null
                }
            ]
        }
        """
        When we post to "/assignments/#firstassignment#/lock"
        """
        {"lock_action": "revert"}
        """
        Then we get OK response
        When we perform revert on assignments "#firstassignment#"
        """
        { }
        """
        Then we get OK response
        When we get "/assignments/#firstassignment#"
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
            "assigned_to": {
                "desk": "#desks._id#",
                "state": "assigned"
            }
        }
        """
        When we get "published_planning?sort=item_id,version"
        Then we get list with 3 items
        Then we store "PLANNING" with 3 item
        When we get "published_planning?where={\"item_id\": \"#PLANNING.item_id#\", \"version\": #PLANNING.version#}"
        Then we get list with 1 items
        When we transmit items
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-3.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "agendas": [{"name": "TestAgenda"}],
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "assigned",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "g2_content_type" : "picture"
                    },
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "deliveries": [],
                    "coverage_provider": null
                }
            ]
        }
        """

    @auth @vocabularies
    Scenario: If Planning item is not published then assignment state change does not publish planning
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "workflow_status": "active",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "desk": "#desks._id#",
                        "user": "#CONTEXT_USER_ID#",
                        "state": "assigned"
                    }
                }
            ]
        }
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        When we get "published_planning?sort=item_id,version"
        Then we get list with 0 items
        When we get "publish_queue"
        Then we get list with 0 items
        When we post to "/assignments/content"
        """
        [{"assignment_id": "#firstassignment#"}]
        """
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "__any_value__",
            "assignment_id": "#firstassignment#",
            "task": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "stage": "#desks.working_stage#"
            },
            "slugline": "test slugline",
            "type": "text",
            "headline": "test headline"
        }
        """
        And we store "ARCHIVE_ID" with value "#content._id#" to context
        When we get "assignments/#firstassignment#"
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
            "assigned_to": {
                "desk": "#desks._id#",
                "state": "in_progress"
            }
        }
        """
        When we get "published_planning?sort=item_id,version"
        Then we get list with 0 items
        When we get "publish_queue"
        Then we get list with 0 items
        When we post to "/assignments/#firstassignment#/lock"
        """
        {"lock_action": "remove_assignment"}
        """
        Then we get OK response
        When we post to "/planning/#planning._id#/lock"
        """
        {"lock_action": "remove_assignment"}
        """
        Then we get OK response
        When we delete "/assignments/#firstassignment#"
        Then we get OK response
        When we get "/assignments/#firstassignment#"
        Then we get error 404
        When we get "published_planning?sort=item_id,version"
        Then we get list with 0 items
        When we get "publish_queue"
        Then we get list with 0 items
