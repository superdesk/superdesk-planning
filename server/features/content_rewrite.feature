Feature: Rewrite content
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
        And "desks"
        """
        [{"name": "Sports", "content_expiry": 60}]
        """
        And "vocabularies"
        """
        [{
            "_id": "newscoveragestatus",
            "display_name": "News Coverage Status",
            "type": "manageable",
            "unique_field": "qcode",
            "items": [
                {"is_active": true, "qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                {"is_active": true, "qcode": "ncostat:notdec", "name": "coverage not decided yet",
                    "label": "On merit"},
                {"is_active": true, "qcode": "ncostat:notint", "name": "coverage not intended",
                    "label": "Not planned"},
                {"is_active": true, "qcode": "ncostat:onreq", "name": "coverage upon request",
                    "label": "On request"}
            ]
        }, {
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
        When we post to "/products" with success
        """
        {
        "name":"prod-1","codes":"abc,xyz", "product_type": "both"
        }
        """
        And we post to "/subscribers" with "wire" and success
        """
        {
        "name":"Channel 2","media_type":"media", "subscriber_type": "wire", "sequence_num_settings":{"min" : 1, "max" : 10}, "email": "test@test.com",
        "products": ["#products._id#"],
        "destinations":[{"name":"Test","format": "nitf", "delivery_type":"email","config":{"recipients":"test@test.com"}}]
        }
        """
        When we post to "/archive" with success
        """
        [{"type": "text", "headline": "test", "state": "fetched",
        "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID#"},
        "subject":[{"qcode": "17004000", "name": "Statistics"}],
        "slugline": "test",
        "body_html": "Test Document body",
        "target_subscribers": [{"_id": "#subscribers._id#"}],
        "dateline": {
          "located" : {
              "country" : "Afghanistan",
              "tz" : "Asia/Kabul",
              "city" : "Mazar-e Sharif",
              "alt_name" : "",
              "country_code" : "AF",
              "city_code" : "Mazar-e Sharif",
              "dateline" : "city",
              "state" : "Balkh",
              "state_code" : "AF.30"
          },
          "text" : "MAZAR-E SHARIF, Dec 30  -",
          "source": "AAP"}
        }]
        """
        And we publish "#archive._id#" with "publish" type and "published" state
        Then we get OK response
        When we get "/published"
        Then we get existing resource
        """
        {"_items" : [
            {"_id": "#archive._id#", "headline": "test", "_current_version": 2, "state": "published",
            "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID#"}
        }]}
        """
        When we enqueue published
        When we get "/publish_queue"
        Then we get list with 1 items
        """
        {
        "_items": [
          {"state": "pending", "content_type": "text",
          "subscriber_id": "#wire#", "item_id": "#archive._id#", "item_version": 2,
          "ingest_provider": "__none__",
          "destination": {
            "delivery_type": "email"
          }}
        ]}
        """
        When we post to "/subscribers" with success
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

    @auth
    @vocabularies
    @link_updates
    Scenario: Updates to a news story linked to an assignment also gets linked
        When we post to "/planning"
        """
        [{
            "headline": "test headline",
            "slugline": "test slugline",
            "planning_date": "2016-10-12",
            "coverages": [
                {
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    }
                }
            ]
        }]
        """
        Then we get Ok response
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [{
            "planning": {
                "g2_content_type": "text",
                "ednote": "test coverage, I want 250 words",
                "slugline": "test slugline",
                "scheduled": "2029-10-12T14:00:00.000"
            },
            "news_coverage_status": {"qcode": "ncostat:int"},
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            },
            "workflow_status": "active"
        }]}
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        Then we store coverage id in "firstcoverage" from coverage 0
        When we post to "/planning/post"
        """
        {
            "planning": "#planning._id#",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
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
                        "coverages": [{
                            "planning": {
                                "g2_content_type": "text",
                                "ednote": "test coverage, I want 250 words",
                                "slugline": "test slugline",
                                "scheduled": "2029-10-12T14:00:00+0000"
                            },
                            "news_coverage_status": {"qcode": "ncostat:int"},
                            "assigned_to": {
                                "desk": "#desks._id#",
                                "user": "#CONTEXT_USER_ID#",
                                "state": "assigned"
                            },
                            "workflow_status": "active"
                        }]
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
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "assigned"
            }]
        }
        """
        When we post to "assignments/link" with success
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        When we get "/assignments"
        Then we get array of _items by _id
        """
        {
            "#firstassignment#": {"assigned_to": {"state": "completed"}}
        }
        """
        When we get "/archive/#archive._id#"
        Then we get existing resource
        """
        {
            "_id": "#archive._id#",
            "assignment_id": "#firstassignment#"
        }
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 2 items
        Then we store "PLANNING" with 2 item
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-2.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [{"item_state": "published", "item_id": "#archive._id#"}]
            }]
        }
        """
        When we rewrite "#archive._id#"
        """
        {"desk_id": "#desks._id#"}
        """
        Then we get OK response
        When we get "/archive/#REWRITE_ID#"
        Then we get existing resource
        """
        {
            "_id": "#REWRITE_ID#",
            "event_id": "#archive.event_id#",
            "type": "text",
            "state": "in_progress",
            "assignment_id": "#firstassignment#"
        }
        """
        When we get "published_planning?sort=item_id,version"
        Then we get list with 3 items
        When we get "/published"
        Then we get existing resource
        """
        {"_items" : [{"_id": "#archive._id#", "rewritten_by": "#REWRITE_ID#", "assignment_id": "#firstassignment#"}]}
        """
        When we publish "#REWRITE_ID#" with "publish" type and "published" state
        Then we get OK response
        When we get "/published"
        Then we get list with 2 items
        """
        {
        "_items": [
            { "_id": "#archive._id#", "rewritten_by": "#REWRITE_ID#", "assignment_id": "#firstassignment#" },
            {"_id": "#REWRITE_ID#", "rewrite_of": "#archive._id#", "assignment_id": "#firstassignment#"}
        ]}
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 4 items
        Then we store "PLANNING" with 4 item
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-4.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [
                    {"item_state": "published", "item_id": "#archive._id#"},
                    {"item_state": "published", "item_id": "#REWRITE_ID#"}
                ]
            }]
        }
        """

    @auth
    @vocabularies
    @link_updates
    Scenario: Updates linking can be controlled by no_content_linking flag on coverage
        When we post to "/planning"
        """
        [{
            "headline": "test headline",
            "slugline": "test slugline",
            "planning_date": "2016-10-12",
            "coverages": [
                {
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    },
                    "flags": {"no_content_linking": true}
                }
            ]
        }]
        """
        Then we get Ok response
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [{
            "planning": {
                "g2_content_type": "text",
                "ednote": "test coverage, I want 250 words",
                "slugline": "test slugline",
                "scheduled": "2029-10-12T14:00:00.000"
            },
            "news_coverage_status": {"qcode": "ncostat:int"},
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            },
            "workflow_status": "active",
            "flags": {"no_content_linking": true}
        }]}
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        Then we store coverage id in "firstcoverage" from coverage 0
        When we post to "/planning/post"
        """
        {
            "planning": "#planning._id#",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
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
                        "coverages": [{
                            "planning": {
                                "g2_content_type": "text",
                                "ednote": "test coverage, I want 250 words",
                                "slugline": "test slugline",
                                "scheduled": "2029-10-12T14:00:00+0000"
                            },
                            "news_coverage_status": {"qcode": "ncostat:int"},
                            "assigned_to": {
                                "desk": "#desks._id#",
                                "user": "#CONTEXT_USER_ID#",
                                "state": "assigned"
                            },
                            "workflow_status": "active"
                        }]
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
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "assigned"
            }]
        }
        """
        When we post to "assignments/link" with success
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        When we get "/assignments"
        Then we get array of _items by _id
        """
        {
            "#firstassignment#": {"assigned_to": {"state": "completed"}}
        }
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 2 items
        Then we store "PLANNING" with 2 item
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-2.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [{"item_state": "published", "item_id": "#archive._id#"}]
            }]
        }
        """
        When we rewrite "#archive._id#"
        """
        {"desk_id": "#desks._id#"}
        """
        Then we get OK response
        When we get "/archive/#REWRITE_ID#"
        Then we get existing resource
        """
        {
            "_id": "#REWRITE_ID#",
            "assignment_id": "__no_value__"
        }
        """
        When we get "/published"
        Then we get existing resource
        """
        {"_items" : [{"_id": "#archive._id#", "rewritten_by": "#REWRITE_ID#", "assignment_id": "#firstassignment#"}]}
        """
        When we publish "#REWRITE_ID#" with "publish" type and "published" state
        Then we get OK response
        When we get "/published/#archive._id#"
        Then we get existing resource
        """
        { "_id": "#archive._id#", "rewritten_by": "#REWRITE_ID#", "assignment_id": "#firstassignment#" }
        """
        When we get "/published/#REWRITE_ID#"
        Then we get existing resource
        """
        {"_id": "#REWRITE_ID#", "rewrite_of": "#archive._id#", "assignment_id": "__no_value__"}
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 2 items
        Then we store "PLANNING" with 2 item
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-2.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [{"item_state": "published", "item_id": "#archive._id#"}]
            }]
        }
        """

    @auth
    @vocabularies
    @link_updates
    Scenario: Unlink-as-update will unlink the assignment only to that update
        When we post to "/planning"
        """
        [{
            "headline": "test headline",
            "slugline": "test slugline",
            "planning_date": "2016-10-12",
            "coverages": [
                {
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    }
                }
            ]
        }]
        """
        Then we get Ok response
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [{
            "planning": {
                "g2_content_type": "text",
                "ednote": "test coverage, I want 250 words",
                "slugline": "test slugline",
                "scheduled": "2029-10-12T14:00:00.000"
            },
            "news_coverage_status": {"qcode": "ncostat:int"},
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            },
            "workflow_status": "active"
        }]}
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        Then we store coverage id in "firstcoverage" from coverage 0
        When we post to "/planning/post"
        """
        {
            "planning": "#planning._id#",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
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
                        "coverages": [{
                            "planning": {
                                "g2_content_type": "text",
                                "ednote": "test coverage, I want 250 words",
                                "slugline": "test slugline",
                                "scheduled": "2029-10-12T14:00:00+0000"
                            },
                            "news_coverage_status": {"qcode": "ncostat:int"},
                            "assigned_to": {
                                "desk": "#desks._id#",
                                "user": "#CONTEXT_USER_ID#",
                                "state": "assigned"
                            },
                            "workflow_status": "active"
                        }]
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
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "assigned"
            }]
        }
        """
        When we post to "assignments/link" with success
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        When we get "/assignments"
        Then we get array of _items by _id
        """
        {
            "#firstassignment#": {"assigned_to": {"state": "completed"}}
        }
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 2 items
        Then we store "PLANNING" with 2 item
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-2.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [{"item_state": "published", "item_id": "#archive._id#"}]
            }]
        }
        """
        When we rewrite "#archive._id#"
        """
        {"desk_id": "#desks._id#"}
        """
        Then we get OK response
        When we get "/archive/#REWRITE_ID#"
        Then we get existing resource
        """
        {
            "_id": "#REWRITE_ID#",
            "assignment_id": "#firstassignment#"
        }
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 3 items
        Then we store "PLANNING" with 3 item
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-3.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [
                    {"item_state": "published", "item_id": "#archive._id#"},
                    {"item_state": "in_progress", "item_id": "#REWRITE_ID#"}
                ]
            }]
        }
        """
        When we get "/published"
        Then we get existing resource
        """
        {"_items" : [{"_id": "#archive._id#", "rewritten_by": "#REWRITE_ID#", "assignment_id": "#firstassignment#"}]}
        """
        When we publish "#REWRITE_ID#" with "publish" type and "published" state
        Then we get OK response
        When we get "/published"
        Then we get list with 2 items
        """
        {
        "_items": [
            { "_id": "#archive._id#", "rewritten_by": "#REWRITE_ID#", "assignment_id": "#firstassignment#" },
            {"_id": "#REWRITE_ID#", "rewrite_of": "#archive._id#", "assignment_id": "#firstassignment#"}
        ]}
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 4 items
        Then we store "PLANNING" with 4 item
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-4.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [
                    {"item_state": "published", "item_id": "#archive._id#"},
                    {"item_state": "published", "item_id": "#REWRITE_ID#"}
                ]
            }]
        }
        """
        And we store "rewrite1" with value "#REWRITE_ID#" to context
        When we rewrite "#rewrite1#"
        """
        {"desk_id": "#desks._id#"}
        """
        Then we get OK response
        When we get "/archive/#REWRITE_ID#"
        Then we get existing resource
        """
        {
            "_id": "#REWRITE_ID#",
            "assignment_id": "#firstassignment#",
            "rewrite_of": "#rewrite1#"
        }
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 5 items
        Then we store "PLANNING" with 5 item
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-5.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [
                    {"item_state": "published", "item_id": "#archive._id#"},
                    {"item_state": "published", "item_id": "#rewrite1#"},
                    {"item_state": "in_progress", "item_id": "#REWRITE_ID#"}
                ]
            }]
        }
        """
        When we delete link "archive/#REWRITE_ID#/rewrite"
        Then we get response code 204
        When we get "/archive"
        Then we get list with 1 items
        """
        {
        "_items": [
            {"_id": "#REWRITE_ID#", "rewrite_of": null, "assignment_id": null}
        ]}
        """
        When we get "/published"
        Then we get list with 2 items
        """
        {
        "_items": [
            { "_id": "#archive._id#", "rewritten_by": "#rewrite1#", "assignment_id": "#firstassignment#" },
            {"_id": "#rewrite1#", "rewrite_of": "#archive._id#", "assignment_id": "#firstassignment#"}
        ]}
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 6 items
        Then we store "PLANNING" with 6 item
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-6.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [
                    {"item_state": "published", "item_id": "#archive._id#"},
                    {"item_state": "published", "item_id": "#rewrite1#"}
                ]
            }]
        }
        """

    @auth
    @vocabularies
    @link_updates
    Scenario: Linking respects no_content_linking assignment in chain.
        When we post to "/planning"
        """
        [{
            "headline": "test headline",
            "slugline": "test slugline",
            "planning_date": "2016-10-12",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00.000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#",
                    "state": "active"
                },
                "workflow_status": "active",
                "flags": { "no_content_linking": true }
            },
            {
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T16:00:00.000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#",
                    "state": "active"
                },
                "workflow_status": "active"
            }]
        }]
        """
        Then we store assignment id in "firstassignment" from coverage 0
        Then we store coverage id in "firstcoverage" from coverage 0
        Then we store assignment id in "secondassignment" from coverage 1
        Then we store coverage id in "secondcoverage" from coverage 1
        When we post to "/planning/post"
        """
        {
            "planning": "#planning._id#",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
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
                        "coverages": [{
                            "planning": {
                                "g2_content_type": "text",
                                "ednote": "test coverage, I want 250 words",
                                "slugline": "test slugline",
                                "scheduled": "2029-10-12T14:00:00+0000"
                            },
                            "news_coverage_status": {"qcode": "ncostat:int"},
                            "assigned_to": {
                                "desk": "#desks._id#",
                                "user": "#CONTEXT_USER_ID#",
                                "state": "active"
                            },
                            "workflow_status": "active"
                        },
                        {
                            "planning": {
                                "g2_content_type": "text",
                                "ednote": "test coverage, I want 250 words",
                                "slugline": "test slugline",
                                "scheduled": "2029-10-12T16:00:00+0000"
                            },
                            "news_coverage_status": {"qcode": "ncostat:int"},
                            "assigned_to": {
                                "desk": "#desks._id#",
                                "user": "#CONTEXT_USER_ID#",
                                "state": "active"
                            },
                            "workflow_status": "active"
                        }]
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
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "active",
                "deliveries": []
            },
            {
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "active",
                "deliveries": []
            }]
        }
        """
        When we post to "assignments/link" with success
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        When we get "/assignments"
        Then we get array of _items by _id
        """
        {
            "#firstassignment#": {"assigned_to": {"state": "completed"}}
        }
        """
        When we get "published_planning?sort=item_id,version"
        Then we get list with 2 items
        Then we store "PLANNING" with 2 item
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
                        "coverages": [{
                            "planning": {
                                "g2_content_type": "text",
                                "ednote": "test coverage, I want 250 words",
                                "slugline": "test slugline",
                                "scheduled": "2029-10-12T14:00:00+0000"
                            },
                            "news_coverage_status": {"qcode": "ncostat:int"},
                            "assigned_to": {
                                "desk": "#desks._id#",
                                "user": "#CONTEXT_USER_ID#",
                                "state": "completed"
                            },
                            "workflow_status": "active"
                        },
                        {
                            "planning": {
                                "g2_content_type": "text",
                                "ednote": "test coverage, I want 250 words",
                                "slugline": "test slugline",
                                "scheduled": "2029-10-12T16:00:00+0000"
                            },
                            "news_coverage_status": {"qcode": "ncostat:int"},
                            "assigned_to": {
                                "desk": "#desks._id#",
                                "user": "#CONTEXT_USER_ID#",
                                "state": "active"
                            },
                            "workflow_status": "active"
                        }]
                    }
                }
            ]
        }
        """
        When we transmit items
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-2.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [{
                  "item_id": "#archive._id#",
                  "item_state": "published"
                }]
            },
            {
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T16:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "active",
                "deliveries": []
            }]
        }
        """
        And we store "archive1" with value "#archive._id#" to context
        When we post to "/archive" with success
        """
        [{"type": "text", "headline": "test", "state": "fetched",
        "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID#"},
        "subject":[{"qcode": "17004000", "name": "Statistics"}],
        "slugline": "test",
        "body_html": "Test Document body",
        "dateline": {
          "located" : {
              "country" : "Afghanistan",
              "tz" : "Asia/Kabul",
              "city" : "Mazar-e Sharif",
              "alt_name" : "",
              "country_code" : "AF",
              "city_code" : "Mazar-e Sharif",
              "dateline" : "city",
              "state" : "Balkh",
              "state_code" : "AF.30"
          },
          "text" : "MAZAR-E SHARIF, Dec 30  -",
          "source": "AAP"}
        }]
        """
        When we post to "assignments/link" with success
        """
        [{
            "assignment_id": "#secondassignment#",
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        When we get "published_planning?sort=item_id,version"
        Then we get list with 3 items
        Then we store "PLANNING" with 3 item
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
                        "coverages": [{
                            "planning": {
                                "g2_content_type": "text",
                                "ednote": "test coverage, I want 250 words",
                                "slugline": "test slugline",
                                "scheduled": "2029-10-12T14:00:00+0000"
                            },
                            "news_coverage_status": {"qcode": "ncostat:int"},
                            "assigned_to": {
                                "desk": "#desks._id#",
                                "user": "#CONTEXT_USER_ID#",
                                "state": "completed"
                            },
                            "workflow_status": "active"
                        },
                        {
                            "planning": {
                                "g2_content_type": "text",
                                "ednote": "test coverage, I want 250 words",
                                "slugline": "test slugline",
                                "scheduled": "2029-10-12T16:00:00+0000"
                            },
                            "news_coverage_status": {"qcode": "ncostat:int"},
                            "assigned_to": {
                                "desk": "#desks._id#",
                                "user": "#CONTEXT_USER_ID#",
                                "state": "in_progress"
                            },
                            "workflow_status": "active"
                        }]
                    }
                }
            ]
        }
        """
        When we transmit items
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-3.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [{
                  "item_id": "#archive1#",
                  "item_state": "published"
                }]
            },
            {
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T16:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "active",
                "deliveries": []
            }]
        }
        """
        When we get "/archive/#archive._id#"
        Then we get existing resource
        """
        {
            "assignment_id": "#secondassignment#"
        }
        """
        When we publish "#archive._id#" with "publish" type and "published" state
        Then we get OK response
        When we get "/published"
        Then we get list with 2 items
        """
        {"_items" : [{"_id": "#archive1#", "assignment_id": "#firstassignment#"},
        {"_id": "#archive._id#", "assignment_id": "#secondassignment#"}]}
        """
        When we get "published_planning?sort=item_id,version"
        Then we get list with 4 items
        Then we store "PLANNING" with 4 item
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
                        "coverages": [{
                            "planning": {
                                "g2_content_type": "text",
                                "ednote": "test coverage, I want 250 words",
                                "slugline": "test slugline",
                                "scheduled": "2029-10-12T14:00:00+0000"
                            },
                            "news_coverage_status": {"qcode": "ncostat:int"},
                            "assigned_to": {
                                "desk": "#desks._id#",
                                "user": "#CONTEXT_USER_ID#",
                                "state": "completed"
                            },
                            "workflow_status": "active"
                        },
                        {
                            "planning": {
                                "g2_content_type": "text",
                                "ednote": "test coverage, I want 250 words",
                                "slugline": "test slugline",
                                "scheduled": "2029-10-12T16:00:00+0000"
                            },
                            "news_coverage_status": {"qcode": "ncostat:int"},
                            "assigned_to": {
                                "desk": "#desks._id#",
                                "user": "#CONTEXT_USER_ID#",
                                "state": "completed"
                            },
                            "workflow_status": "active"
                        }]
                    }
                }
            ]
        }
        """
        When we transmit items
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-4.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [{
                  "item_id": "#archive1#",
                  "item_state": "published"
                }]
            },
            {
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T16:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [{
                  "item_id": "#archive._id#",
                  "item_state": "published"
                }]
            }]
        }
        """
        When we rewrite "#archive._id#"
        """
        {"desk_id": "#desks._id#"}
        """
        Then we get OK response
        When we get "/archive/#REWRITE_ID#"
        Then we get existing resource
        """
        {
            "_id": "#REWRITE_ID#",
            "assignment_id": "#secondassignment#"
        }
        """
        When we get "published_planning?sort=item_id,version"
        Then we get list with 5 items
        Then we store "PLANNING" with 5 item
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
                        "coverages": [{
                            "planning": {
                                "g2_content_type": "text",
                                "ednote": "test coverage, I want 250 words",
                                "slugline": "test slugline",
                                "scheduled": "2029-10-12T14:00:00+0000"
                            },
                            "news_coverage_status": {"qcode": "ncostat:int"},
                            "assigned_to": {
                                "desk": "#desks._id#",
                                "user": "#CONTEXT_USER_ID#",
                                "state": "completed"
                            },
                            "workflow_status": "active"
                        },
                        {
                            "planning": {
                                "g2_content_type": "text",
                                "ednote": "test coverage, I want 250 words",
                                "slugline": "test slugline",
                                "scheduled": "2029-10-12T16:00:00+0000"
                            },
                            "news_coverage_status": {"qcode": "ncostat:int"},
                            "assigned_to": {
                                "desk": "#desks._id#",
                                "user": "#CONTEXT_USER_ID#",
                                "state": "completed"
                            },
                            "workflow_status": "active"
                        }]
                    }
                }
            ]
        }
        """
        When we transmit items
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-5.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [{
                  "item_id": "#archive1#",
                  "item_state": "published"
                }]
            },
            {
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T16:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [{
                  "item_id": "#archive._id#",
                  "item_state": "published"
                },
                {
                  "item_id": "#REWRITE_ID#",
                  "item_state": "in_progress"
                }]
            }]
        }
        """
        When we publish "#REWRITE_ID#" with "publish" type and "published" state
        Then we get OK response
        When we get "/published"
        Then we get list with 3 items
        """
        {
        "_items": [
            {"_id": "#archive1#", "assignment_id": "#firstassignment#"},
            {"_id": "#archive._id#", "assignment_id": "#secondassignment#"},
            {"_id": "#REWRITE_ID#", "rewrite_of": "#archive._id#", "assignment_id": "#secondassignment#"}
        ]}
        """
        When we get "published_planning?sort=item_id,version"
        Then we get list with 6 items
        Then we store "PLANNING" with 6 item
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
                        "coverages": [{
                            "planning": {
                                "g2_content_type": "text",
                                "ednote": "test coverage, I want 250 words",
                                "slugline": "test slugline",
                                "scheduled": "2029-10-12T14:00:00+0000"
                            },
                            "news_coverage_status": {"qcode": "ncostat:int"},
                            "assigned_to": {
                                "desk": "#desks._id#",
                                "user": "#CONTEXT_USER_ID#",
                                "state": "completed"
                            },
                            "workflow_status": "active"
                        },
                        {
                            "planning": {
                                "g2_content_type": "text",
                                "ednote": "test coverage, I want 250 words",
                                "slugline": "test slugline",
                                "scheduled": "2029-10-12T16:00:00+0000"
                            },
                            "news_coverage_status": {"qcode": "ncostat:int"},
                            "assigned_to": {
                                "desk": "#desks._id#",
                                "user": "#CONTEXT_USER_ID#",
                                "state": "completed"
                            },
                            "workflow_status": "active"
                        }]
                    }
                }
            ]
        }
        """
        When we transmit items
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-6.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [{
                  "item_id": "#archive1#",
                  "item_state": "published"
                }]
            },
            {
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T16:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [{
                  "item_id": "#archive._id#",
                  "item_state": "published"
                },
                {
                  "item_id": "#REWRITE_ID#",
                  "item_state": "published"
                }]
            }]
        }
        """

    @auth
    @vocabularies
    @link_updates
    Scenario: Unlinking as coverage wil unlink the whole chain
        When we post to "/planning"
        """
        [{
            "headline": "test headline",
            "slugline": "test slugline",
            "planning_date": "2016-10-12",
            "coverages": [
                {
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    }
                }
            ]
        }]
        """
        Then we get Ok response
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [{
            "planning": {
                "g2_content_type": "text",
                "ednote": "test coverage, I want 250 words",
                "slugline": "test slugline",
                "scheduled": "2029-10-12T14:00:00.000"
            },
            "news_coverage_status": {"qcode": "ncostat:int"},
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            },
            "workflow_status": "active"
        }]}
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        Then we store coverage id in "firstcoverage" from coverage 0
        When we post to "/planning/post"
        """
        {
            "planning": "#planning._id#",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
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
                        "coverages": [{
                            "planning": {
                                "g2_content_type": "text",
                                "ednote": "test coverage, I want 250 words",
                                "slugline": "test slugline",
                                "scheduled": "2029-10-12T14:00:00+0000"
                            },
                            "news_coverage_status": {"qcode": "ncostat:int"},
                            "assigned_to": {
                                "desk": "#desks._id#",
                                "user": "#CONTEXT_USER_ID#",
                                "state": "assigned"
                            },
                            "workflow_status": "active"
                        }]
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
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "assigned"
            }]
        }
        """
        When we post to "assignments/link" with success
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        When we get "/assignments"
        Then we get array of _items by _id
        """
        {
            "#firstassignment#": {"assigned_to": {"state": "completed"}}
        }
        """
        When we get "/archive/#archive._id#"
        Then we get existing resource
        """
        {
            "_id": "#archive._id#",
            "assignment_id": "#firstassignment#"
        }
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 2 items
        Then we store "PLANNING" with 2 item
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-2.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [{"item_state": "published", "item_id": "#archive._id#"}]
            }]
        }
        """
        When we rewrite "#archive._id#"
        """
        {"desk_id": "#desks._id#"}
        """
        Then we get OK response
        When we get "/archive/#REWRITE_ID#"
        Then we get existing resource
        """
        {
            "_id": "#REWRITE_ID#",
            "event_id": "#archive.event_id#",
            "type": "text",
            "state": "in_progress",
            "assignment_id": "#firstassignment#"
        }
        """
        When we get "published_planning?sort=item_id,version"
        Then we get list with 3 items
        When we get "/published"
        Then we get existing resource
        """
        {"_items" : [{"_id": "#archive._id#", "rewritten_by": "#REWRITE_ID#", "assignment_id": "#firstassignment#"}]}
        """
        When we publish "#REWRITE_ID#" with "publish" type and "published" state
        Then we get OK response
        When we get "/published"
        Then we get list with 2 items
        """
        {
        "_items": [
            { "_id": "#archive._id#", "rewritten_by": "#REWRITE_ID#", "assignment_id": "#firstassignment#" },
            {"_id": "#REWRITE_ID#", "rewrite_of": "#archive._id#", "assignment_id": "#firstassignment#"}
        ]}
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 4 items
        Then we store "PLANNING" with 4 item
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-4.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [
                    {"item_state": "published", "item_id": "#archive._id#"},
                    {"item_state": "published", "item_id": "#REWRITE_ID#"}
                ]
            }]
        }
        """
        When we post to "assignments/unlink"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#REWRITE_ID#"
        }]
        """
        When we get "/published"
        Then we get list with 2 items
        """
        {
        "_items": [
            { "_id": "#archive._id#", "rewritten_by": "#REWRITE_ID#", "assignment_id": null },
            {"_id": "#REWRITE_ID#", "rewrite_of": "#archive._id#", "assignment_id": null}
        ]}
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 5 items
        Then we store "PLANNING" with 5 item
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-5.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "assigned",
                "deliveries": []
            }]
        }
        """

    @auth
    @vocabularies
    Scenario: No linking changes are enabled if PLANNING_LINK_UPDATES_TO_COVERAGES config is off
        When we post to "/planning"
        """
        [{
            "headline": "test headline",
            "slugline": "test slugline",
            "planning_date": "2016-10-12",
            "coverages": [
                {
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    }
                }
            ]
        }]
        """
        Then we get Ok response
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [{
            "planning": {
                "g2_content_type": "text",
                "ednote": "test coverage, I want 250 words",
                "slugline": "test slugline",
                "scheduled": "2029-10-12T14:00:00.000"
            },
            "news_coverage_status": {"qcode": "ncostat:int"},
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            },
            "workflow_status": "active"
        }]}
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        Then we store coverage id in "firstcoverage" from coverage 0
        When we post to "/planning/post"
        """
        {
            "planning": "#planning._id#",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
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
                        "coverages": [{
                            "planning": {
                                "g2_content_type": "text",
                                "ednote": "test coverage, I want 250 words",
                                "slugline": "test slugline",
                                "scheduled": "2029-10-12T14:00:00+0000"
                            },
                            "news_coverage_status": {"qcode": "ncostat:int"},
                            "assigned_to": {
                                "desk": "#desks._id#",
                                "user": "#CONTEXT_USER_ID#",
                                "state": "assigned"
                            },
                            "workflow_status": "active"
                        }]
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
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "assigned"
            }]
        }
        """
        When we post to "assignments/link" with success
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        When we get "/assignments"
        Then we get array of _items by _id
        """
        {
            "#firstassignment#": {"assigned_to": {"state": "completed"}}
        }
        """
        When we get "/archive/#archive._id#"
        Then we get existing resource
        """
        {
            "_id": "#archive._id#",
            "assignment_id": "#firstassignment#"
        }
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 2 items
        Then we store "PLANNING" with 2 item
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-2.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [{"item_state": "published", "item_id": "#archive._id#"}]
            }]
        }
        """
        When we rewrite "#archive._id#"
        """
        {"desk_id": "#desks._id#"}
        """
        Then we get OK response
        When we get "/archive/#REWRITE_ID#"
        Then we get existing resource
        """
        {
            "_id": "#REWRITE_ID#",
            "event_id": "#archive.event_id#",
            "type": "text",
            "state": "in_progress",
            "assignment_id": "__no_value__"
        }
        """
        When we get "published_planning?sort=item_id,version"
        Then we get list with 2 items
        When we get "/published"
        Then we get existing resource
        """
        {"_items" : [{"_id": "#archive._id#", "rewritten_by": "#REWRITE_ID#", "assignment_id": "#firstassignment#"}]}
        """
        When we publish "#REWRITE_ID#" with "publish" type and "published" state
        Then we get OK response
        When we get "/published/#archive._id#"
        Then we get existing resource
        """
        { "_id": "#archive._id#", "rewritten_by": "#REWRITE_ID#", "assignment_id": "#firstassignment#" }
        """
        When we get "/published/#REWRITE_ID#"
        Then we get existing resource
        """
        {"_id": "#REWRITE_ID#", "rewrite_of": "#archive._id#", "assignment_id": "__no_value__"}
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 2 items
        Then we store "PLANNING" with 2 item
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-2.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [{"item_state": "published", "item_id": "#archive._id#"}]
            }]
        }
        """

    @auth
    @vocabularies
    @link_updates
    Scenario: Associate as update to a news story linked to an assignment also gets linked
        When we post to "/planning"
        """
        [{
            "headline": "test headline",
            "slugline": "test slugline",
            "planning_date": "2016-10-12",
            "coverages": [
                {
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    }
                }
            ]
        }]
        """
        Then we get Ok response
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [{
            "planning": {
                "g2_content_type": "text",
                "ednote": "test coverage, I want 250 words",
                "slugline": "test slugline",
                "scheduled": "2029-10-12T14:00:00.000"
            },
            "news_coverage_status": {"qcode": "ncostat:int"},
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            },
            "workflow_status": "active"
        }]}
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        Then we store coverage id in "firstcoverage" from coverage 0
        When we post to "/planning/post"
        """
        {
            "planning": "#planning._id#",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
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
                        "coverages": [{
                            "planning": {
                                "g2_content_type": "text",
                                "ednote": "test coverage, I want 250 words",
                                "slugline": "test slugline",
                                "scheduled": "2029-10-12T14:00:00+0000"
                            },
                            "news_coverage_status": {"qcode": "ncostat:int"},
                            "assigned_to": {
                                "desk": "#desks._id#",
                                "user": "#CONTEXT_USER_ID#",
                                "state": "assigned"
                            },
                            "workflow_status": "active"
                        }]
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
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "assigned"
            }]
        }
        """
        When we post to "assignments/link" with success
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        When we get "/assignments"
        Then we get array of _items by _id
        """
        {
            "#firstassignment#": {"assigned_to": {"state": "completed"}}
        }
        """
        When we get "/archive/#archive._id#"
        Then we get existing resource
        """
        {
            "_id": "#archive._id#",
            "assignment_id": "#firstassignment#"
        }
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 2 items
        Then we store "PLANNING" with 2 item
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-2.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [{"item_state": "published", "item_id": "#archive._id#"}]
            }]
        }
        """
        And we store "archive1" with value "#archive._id#" to context
        And we store "event1" with value "#archive.event_id#" to context
        When we post to "/archive"
        """
        [{"type": "text", "headline": "test", "state": "in_progress", "priority": 2,
         "subject":[{"qcode": "01000000", "name": "arts, culture and entertainment"}],
         "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID#"}}]
        """
        Then we get OK response
        When we rewrite "#archive1#"
        """
            {"update": {"_id": "#archive._id#", "type": "text", "headline": "test",
            "state": "in_progress", "priority": 2,
            "subject":[{"qcode": "01000000", "name": "arts, culture and entertainment"}],
            "task": {"desk": "#desks._id#", "stage": "#desks.incoming_stage#", "user": "#CONTEXT_USER_ID#"}}}
        """
        Then we get OK response
        When we get "/archive/#archive._id#"
        Then we get existing resource
        """
        {
            "_id": "#archive._id#",
            "event_id": "#event1#",
            "type": "text",
            "state": "in_progress",
            "assignment_id": "#firstassignment#"
        }
        """
        When we get "/archive/#archive1#"
        Then we get existing resource
        """
        {
            "_id": "#archive1#",
            "event_id": "#event1#",
            "rewritten_by": "#archive._id#"
        }
        """
        When we get "published_planning?sort=item_id,version"
        Then we get list with 3 items
        When we get "/published"
        Then we get existing resource
        """
        {"_items" : [{"_id": "#archive1#", "rewritten_by": "#archive._id#", "assignment_id": "#firstassignment#"}]}
        """
        When we publish "#archive._id#" with "publish" type and "published" state
        Then we get OK response
        When we get "/published"
        Then we get list with 2 items
        """
        {
        "_items": [
            { "_id": "#archive1#", "rewritten_by": "#archive._id#", "assignment_id": "#firstassignment#" },
            {"_id": "#archive._id#", "rewrite_of": "#archive1#", "assignment_id": "#firstassignment#"}
        ]}
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 4 items
        Then we store "PLANNING" with 4 item
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-4.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [
                    {"item_state": "published", "item_id": "#archive1#"},
                    {"item_state": "published", "item_id": "#archive._id#"}
                ]
            }]
        }
        """

    @auth
    @vocabularies
    @link_updates
    Scenario: Delivery has proper sequence_no populated
        When we post to "/planning"
        """
        [{
            "headline": "test headline",
            "slugline": "test slugline",
            "planning_date": "2016-10-12",
            "coverages": [
                {
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    }
                }
            ]
        }]
        """
        Then we get Ok response
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [{
            "planning": {
                "g2_content_type": "text",
                "ednote": "test coverage, I want 250 words",
                "slugline": "test slugline",
                "scheduled": "2029-10-12T14:00:00.000"
            },
            "news_coverage_status": {"qcode": "ncostat:int"},
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            },
            "workflow_status": "active"
        }]}
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        Then we store coverage id in "firstcoverage" from coverage 0
        When we post to "/planning/post"
        """
        {
            "planning": "#planning._id#",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
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
                        "coverages": [{
                            "planning": {
                                "g2_content_type": "text",
                                "ednote": "test coverage, I want 250 words",
                                "slugline": "test slugline",
                                "scheduled": "2029-10-12T14:00:00+0000"
                            },
                            "news_coverage_status": {"qcode": "ncostat:int"},
                            "assigned_to": {
                                "desk": "#desks._id#",
                                "user": "#CONTEXT_USER_ID#",
                                "state": "assigned"
                            },
                            "workflow_status": "active"
                        }]
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
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "assigned"
            }]
        }
        """
        When we post to "assignments/link" with success
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        When we get "/assignments"
        Then we get array of _items by _id
        """
        {
            "#firstassignment#": {"assigned_to": {"state": "completed"}}
        }
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 2 items
        Then we store "PLANNING" with 2 item
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-2.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [{
                    "item_state": "published",
                    "item_id": "#archive._id#",
                    "sequence_no": 0
                }]
            }]
        }
        """
        When we rewrite "#archive._id#"
        """
        {"desk_id": "#desks._id#"}
        """
        Then we get OK response
        When we get "/archive/#REWRITE_ID#"
        Then we get existing resource
        """
        {
            "_id": "#REWRITE_ID#",
            "assignment_id": "#firstassignment#"
        }
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 3 items
        Then we store "PLANNING" with 3 item
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-3.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [
                    {"item_state": "published", "item_id": "#archive._id#", "sequence_no": 0},
                    {"item_state": "in_progress", "item_id": "#REWRITE_ID#", "sequence_no": 1}
                ]
            }]
        }
        """
        When we get "/published"
        Then we get existing resource
        """
        {"_items" : [{"_id": "#archive._id#", "rewritten_by": "#REWRITE_ID#", "assignment_id": "#firstassignment#"}]}
        """
        When we publish "#REWRITE_ID#" with "publish" type and "published" state
        Then we get OK response
        When we get "/published"
        Then we get list with 2 items
        """
        {
        "_items": [
            { "_id": "#archive._id#", "rewritten_by": "#REWRITE_ID#", "assignment_id": "#firstassignment#" },
            {"_id": "#REWRITE_ID#", "rewrite_of": "#archive._id#", "assignment_id": "#firstassignment#"}
        ]}
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 4 items
        Then we store "PLANNING" with 4 item
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-4.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [
                    {"item_state": "published", "item_id": "#archive._id#", "sequence_no": 0},
                    {"item_state": "published", "item_id": "#REWRITE_ID#", "sequence_no": 1}
                ]
            }]
        }
        """
        And we store "rewrite1" with value "#REWRITE_ID#" to context
        When we rewrite "#rewrite1#"
        """
        {"desk_id": "#desks._id#"}
        """
        Then we get OK response
        When we get "/archive/#REWRITE_ID#"
        Then we get existing resource
        """
        {
            "_id": "#REWRITE_ID#",
            "assignment_id": "#firstassignment#",
            "rewrite_of": "#rewrite1#"
        }
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 5 items
        Then we store "PLANNING" with 5 item
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-5.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [
                    {"item_state": "published", "item_id": "#archive._id#", "sequence_no": 0},
                    {"item_state": "published", "item_id": "#rewrite1#", "sequence_no": 1},
                    {"item_state": "in_progress", "item_id": "#REWRITE_ID#", "sequence_no": 2}
                ]
            }]
        }
        """

    @auth
    @vocabularies
    Scenario: Only single content update gets linked if config PLANNING_LINK_UPDATES_TO_COVERAGES is off
        When we post to "/planning"
        """
        [{
            "headline": "test headline",
            "slugline": "test slugline",
            "planning_date": "2016-10-12",
            "coverages": [
                {
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    }
                }
            ]
        }]
        """
        Then we get Ok response
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [{
            "planning": {
                "g2_content_type": "text",
                "ednote": "test coverage, I want 250 words",
                "slugline": "test slugline",
                "scheduled": "2029-10-12T14:00:00.000"
            },
            "news_coverage_status": {"qcode": "ncostat:int"},
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            },
            "workflow_status": "active"
        }]}
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        Then we store coverage id in "firstcoverage" from coverage 0
        When we post to "/planning/post"
        """
        {
            "planning": "#planning._id#",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
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
                        "coverages": [{
                            "planning": {
                                "g2_content_type": "text",
                                "ednote": "test coverage, I want 250 words",
                                "slugline": "test slugline",
                                "scheduled": "2029-10-12T14:00:00+0000"
                            },
                            "news_coverage_status": {"qcode": "ncostat:int"},
                            "assigned_to": {
                                "desk": "#desks._id#",
                                "user": "#CONTEXT_USER_ID#",
                                "state": "assigned"
                            },
                            "workflow_status": "active"
                        }]
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
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "assigned"
            }]
        }
        """
        When we rewrite "#archive._id#"
        """
        {"desk_id": "#desks._id#"}
        """
        Then we get OK response
        When we get "/archive/#archive._id#"
        Then we get existing resource
        """
        {
            "_id": "#archive._id#",
            "event_id": "#archive.event_id#",
            "type": "text",
            "assignment_id": "__no_value__"
        }
        """
        When we get "/archive/#REWRITE_ID#"
        Then we get existing resource
        """
        {
            "_id": "#REWRITE_ID#",
            "event_id": "#archive.event_id#",
            "type": "text",
            "state": "in_progress",
            "assignment_id": "__no_value__"
        }
        """
        When we get "/published"
        Then we get existing resource
        """
        {"_items" : [{"_id": "#archive._id#", "rewritten_by": "#REWRITE_ID#", "assignment_id": "__no_value__"}]}
        """
        When we post to "assignments/link" with success
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#REWRITE_ID#",
            "reassign": true
        }]
        """
        When we get "/assignments"
        Then we get array of _items by _id
        """
        {
            "#firstassignment#": {"assigned_to": {"state": "in_progress"}}
        }
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 2 items
        Then we store "PLANNING" with 2 item
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-2.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "active"
            }]
        }
        """
        When we publish "#REWRITE_ID#" with "publish" type and "published" state
        Then we get OK response
        When we get "/published/#archive._id#"
        Then we get existing resource
        """
        { "_id": "#archive._id#", "rewritten_by": "#REWRITE_ID#", "assignment_id": "__no_value__" }
        """
        When we get "/published/#REWRITE_ID#"
        Then we get existing resource
        """
        { "_id": "#REWRITE_ID#", "rewrite_of": "#archive._id#", "assignment_id": "#firstassignment#" }
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 3 items
        Then we store "PLANNING" with 3 item
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-3.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [
                    {"item_state": "published", "item_id": "#REWRITE_ID#", "sequence_no": 1}
                ]

            }]
        }
        """

    @auth
    @vocabularies
    @link_updates
    Scenario: Completed Assignment moves desks with story updates and remains in completed status
        When we post to "/planning"
        """
        [{
            "headline": "test headline",
            "slugline": "test slugline",
            "planning_date": "2016-10-12",
            "coverages": [
                {
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    }
                }
            ]
        }]
        """
        Then we get Ok response
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [{
            "planning": {
                "g2_content_type": "text",
                "ednote": "test coverage, I want 250 words",
                "slugline": "test slugline",
                "scheduled": "2029-10-12T14:00:00.000"
            },
            "news_coverage_status": {"qcode": "ncostat:int"},
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            },
            "workflow_status": "active"
        }]}
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        Then we store coverage id in "firstcoverage" from coverage 0
        When we post to "/planning/post"
        """
        {
            "planning": "#planning._id#",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
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
                        "coverages": [{
                            "planning": {
                                "g2_content_type": "text",
                                "ednote": "test coverage, I want 250 words",
                                "slugline": "test slugline",
                                "scheduled": "2029-10-12T14:00:00+0000"
                            },
                            "news_coverage_status": {"qcode": "ncostat:int"},
                            "assigned_to": {
                                "desk": "#desks._id#",
                                "user": "#CONTEXT_USER_ID#",
                                "state": "assigned"
                            },
                            "workflow_status": "active"
                        }]
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
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "assigned"
            }]
        }
        """
        When we post to "assignments/link" with success
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        When we get "/assignments"
        Then we get array of _items by _id
        """
        {
            "#firstassignment#": {"assigned_to": {"state": "completed"}}
        }
        """
        When we get "/archive/#archive._id#"
        Then we get existing resource
        """
        {
            "_id": "#archive._id#",
            "assignment_id": "#firstassignment#"
        }
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 2 items
        Then we store "PLANNING" with 2 item
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-2.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [{"item_state": "published", "item_id": "#archive._id#"}]
            }]
        }
        """
        When we post to "desks"
        """
            [{
                "name": "Politics",
                "members": [{"user": "#CONTEXT_USER_ID#"}]
            }]
        """
        When we get "/desks/#desks._id#"
        Then we get existing resource
        """
        {
            "_id": "#desks._id#",
            "name": "Politics"
        }
        """
        When we rewrite "#archive._id#"
        """
        {"desk_id": "#desks._id#"}
        """
        Then we get OK response
        When we get "/archive/#REWRITE_ID#"
        Then we get existing resource
        """
        {
            "_id": "#REWRITE_ID#",
            "event_id": "#archive.event_id#",
            "type": "text",
            "state": "in_progress",
            "assignment_id": "#firstassignment#"
        }
        """
        When we get "/assignments"
        Then we get array of _items by _id
        """
        {
            "#firstassignment#": {"assigned_to": {"state": "completed", "desk": "#desks._id#"}}
        }
        """
        When we get "published_planning?sort=item_id,version"
        Then we get list with 3 items
        When we get "/published"
        Then we get existing resource
        """
        {"_items" : [{"_id": "#archive._id#", "rewritten_by": "#REWRITE_ID#", "assignment_id": "#firstassignment#"}]}
        """
        When we publish "#REWRITE_ID#" with "publish" type and "published" state
        Then we get OK response
        When we get "/published"
        Then we get list with 2 items
        """
        {
        "_items": [
            { "_id": "#archive._id#", "rewritten_by": "#REWRITE_ID#", "assignment_id": "#firstassignment#" },
            {"_id": "#REWRITE_ID#", "rewrite_of": "#archive._id#", "assignment_id": "#firstassignment#"}
        ]}
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 4 items
        Then we store "PLANNING" with 4 item
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-4.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [
                    {"item_state": "published", "item_id": "#archive._id#"},
                    {"item_state": "published", "item_id": "#REWRITE_ID#"}
                ]
            }]
        }
        """

    @auth
    @vocabularies
    @link_updates
    Scenario: When updated story is locked, assignment is not locked
        When we post to "/planning"
        """
        [{
            "headline": "test headline",
            "slugline": "test slugline",
            "planning_date": "2016-10-12",
            "coverages": [
                {
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    }
                }
            ]
        }]
        """
        Then we get Ok response
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [{
            "planning": {
                "g2_content_type": "text",
                "ednote": "test coverage, I want 250 words",
                "slugline": "test slugline",
                "scheduled": "2029-10-12T14:00:00.000"
            },
            "news_coverage_status": {"qcode": "ncostat:int"},
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            },
            "workflow_status": "active"
        }]}
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        Then we store coverage id in "firstcoverage" from coverage 0
        When we post to "/planning/post"
        """
        {
            "planning": "#planning._id#",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
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
                        "coverages": [{
                            "planning": {
                                "g2_content_type": "text",
                                "ednote": "test coverage, I want 250 words",
                                "slugline": "test slugline",
                                "scheduled": "2029-10-12T14:00:00+0000"
                            },
                            "news_coverage_status": {"qcode": "ncostat:int"},
                            "assigned_to": {
                                "desk": "#desks._id#",
                                "user": "#CONTEXT_USER_ID#",
                                "state": "assigned"
                            },
                            "workflow_status": "active"
                        }]
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
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "assigned"
            }]
        }
        """
        When we post to "assignments/link" with success
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        When we get "/assignments"
        Then we get array of _items by _id
        """
        {
            "#firstassignment#": {"assigned_to": {"state": "completed"}}
        }
        """
        When we get "/archive/#archive._id#"
        Then we get existing resource
        """
        {
            "_id": "#archive._id#",
            "assignment_id": "#firstassignment#"
        }
        """
        When we transmit items
        When we get "published_planning?sort=item_id,version"
        Then we get list with 2 items
        Then we store "PLANNING" with 2 item
        Then we get transmitted item "/tmp/#PLANNING.item_id#-#PLANNING.version#-2.txt"
        """
        {
            "state": "scheduled",
            "pubstatus": "usable",
            "guid": "#PLANNING.item_id#",
            "coverages": [{
                "planning": {
                    "g2_content_type": "text",
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "scheduled": "2029-10-12T14:00:00+0000"
                },
                "news_coverage_status": {"qcode": "ncostat:int"},
                "workflow_status": "completed",
                "deliveries": [{"item_state": "published", "item_id": "#archive._id#"}]
            }]
        }
        """
        When we rewrite "#archive._id#"
        """
        {"desk_id": "#desks._id#"}
        """
        Then we get OK response
        When we get "/archive/#REWRITE_ID#"
        Then we get existing resource
        """
        {
            "_id": "#REWRITE_ID#",
            "event_id": "#archive.event_id#",
            "type": "text",
            "state": "in_progress",
            "assignment_id": "#firstassignment#"
        }
        """
        When we patch "/desks/#desks._id#"
        """
        {"members":[{"user":"#CONTEXT_USER_ID#"}]}
        """
        Then we get OK response
        When we post to "/archive/#REWRITE_ID#/lock"
        """
        { "lock_action": "edit" }
        """
        Then we get new resource
        """
        { "_id": "#REWRITE_ID#", "lock_user": "#CONTEXT_USER_ID#" }
        """
        When we get "/assignments/#firstassignment#"
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
            "lock_user": null,
            "lock_action": null
        }
        """

    @auth
    @vocabularies
    Scenario: When not linking and updated story is locked, assignment is also locked
        When we post to "/planning"
        """
        [{
            "headline": "test headline",
            "slugline": "test slugline",
            "planning_date": "2016-10-12",
            "coverages": [
                {
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    }
                }
            ]
        }]
        """
        Then we get Ok response
        When we patch "/planning/#planning._id#"
        """
        {"coverages": [{
            "planning": {
                "g2_content_type": "text",
                "ednote": "test coverage, I want 250 words",
                "slugline": "test slugline",
                "scheduled": "2029-10-12T14:00:00.000"
            },
            "news_coverage_status": {"qcode": "ncostat:int"},
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            },
            "workflow_status": "active"
        }]}
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        Then we store coverage id in "firstcoverage" from coverage 0
        When we post to "/planning/post"
        """
        {
            "planning": "#planning._id#",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
        When we rewrite "#archive._id#"
        """
        {"desk_id": "#desks._id#"}
        """
        Then we get OK response
        When we get "/archive/#REWRITE_ID#"
        Then we get existing resource
        """
        {
            "_id": "#REWRITE_ID#",
            "event_id": "#archive.event_id#",
            "type": "text",
            "state": "in_progress"
        }
        """
        When we post to "assignments/link" with success
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#REWRITE_ID#",
            "reassign": true
        }]
        """
        When we get "/archive/#REWRITE_ID#"
        Then we get existing resource
        """
        {
            "_id": "#REWRITE_ID#",
            "assignment_id": "#firstassignment#"
        }
        """
        When we patch "/desks/#desks._id#"
        """
        {"members":[{"user":"#CONTEXT_USER_ID#"}]}
        """
        Then we get OK response
        When we post to "/archive/#REWRITE_ID#/lock"
        """
        { "lock_action": "edit" }
        """
        Then we get new resource
        """
        { "_id": "#REWRITE_ID#", "lock_user": "#CONTEXT_USER_ID#" }
        """
        When we get "/assignments/#firstassignment#"
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_action": "content_edit"
        }
        """
