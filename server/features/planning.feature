Feature: Planning

    @auth
    Scenario: Empty planning list
        Given empty "planning"
        When we get "/planning"
        Then we get list with 0 items

    @auth
    @notification
    Scenario: Create new planning item without agenda
        Given empty "users"
        Given empty "planning"
        When we post to "users"
        """
        {"username": "foo", "email": "foo@bar.com", "is_active": true, "sign_off": "abc"}
        """
        Then we get existing resource
        """
        {"_id": "#users._id#", "invisible_stages": []}
        """
        When we post to "/planning"
        """
        [
            {
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "test slugline"
            }
        ]
        """
        Then we get OK response
        Then we store "planning_date" with value "#planning._planning_date#" to context
        And we get notifications
        """
        [{
            "event": "planning:created",
            "extra": {
                "item": "#planning._id#",
                "user": "#CONTEXT_USER_ID#",
                "added_agendas": [],
                "removed_agendas": [],
                "session": "__any_value__"
            }
        }]
        """
        When we get "/planning"
        Then we get list with 1 items
        """
            {"_items": [{
                "guid": "__any_value__",
                "type": "planning",
                "original_creator": "__any_value__",
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "test slugline"
            }]}
        """
        When we get "/planning_history"
        Then we get a list with 1 items
        """
            {"_items": [{
                "planning_id":  "#planning._id#",
                "operation": "create",
                "update": {
                    "original_creator": "__any_value__",
                    "item_class": "item class value",
                    "headline": "test headline",
                    "slugline": "test slugline"
            }}]}
        """
        When we patch "/planning/#planning._id#"
        """
        {"slugline": "test test test"}
        """
        Then we get OK response
        When we get "/planning"
        Then we get list with 1 items
        """
            {"_items": [{
                "guid": "__any_value__",
                "original_creator": "__any_value__",
                "item_class": "item class value",
                "headline": "test headline",
                "slugline": "test test test"
            }]}
        """

    @auth
    @notification
    Scenario: Create new planning item with agenda
        Given empty "users"
        Given empty "planning"
        When we post to "users"
        """
        {"username": "foo", "email": "foo@bar.com", "is_active": true, "sign_off": "abc"}
        """
        Then we get existing resource
        """
        {"_id": "#users._id#", "invisible_stages": []}
        """
        When we post to "agenda" with "agenda1" and success
        """
        [{"name": "foo1"}]
        """
        And we post to "agenda" with "agenda2" and success
        """
        [{"name": "foo2"}]
        """
        And we post to "/planning"
        """
        [
            {
                "item_class": "item class value",
                "headline": "test headline",
                "agendas": ["#agenda1#"]
            }
        ]
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "planning:created",
            "extra": {
                "item": "#planning._id#",
                "user": "#CONTEXT_USER_ID#",
                "added_agendas": ["#agenda1#"],
                "removed_agendas": [],
                "session": "__any_value__"
            }
        }]
        """
        When we get "/planning"
        Then we get list with 1 items
        """
            {"_items": [{
                "guid": "__any_value__",
                "type": "planning",
                "original_creator": "__any_value__",
                "item_class": "item class value",
                "headline": "test headline",
                "agendas": ["#agenda1#"]
            }]}
        """
        When we get "/planning_history"
        Then we get list with 1 items
        """
            {"_items": [
                {
                    "planning_id":  "#planning._id#",
                    "operation": "create",
                    "update": {
                        "original_creator": "__any_value__",
                        "item_class": "item class value",
                        "headline": "test headline",
                        "agendas": ["#agenda1#"]
                    }
                }
            ]}
        """
        When we patch "/planning/#planning._id#"
        """
        { "agendas": ["#agenda1#", "#agenda2#"] }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "planning:updated",
            "extra": {
                "item": "#planning._id#",
                "user": "#CONTEXT_USER_ID#",
                "added_agendas": ["#agenda1#", "#agenda2#"],
                "removed_agendas": [],
                "session": "__any_value__"
            }
        }]
        """
        When we patch "/planning/#planning._id#"
        """
        { "agendas": [] }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "planning:updated",
            "extra": {
                "item": "#planning._id#",
                "user": "#CONTEXT_USER_ID#",
                "added_agendas": ["#agenda1#", "#agenda2#"],
                "removed_agendas": [],
                "session": "__any_value__"
            }
        },
        {
            "event": "planning:updated",
            "extra": {
                "item": "#planning._id#",
                "user": "#CONTEXT_USER_ID#",
                "added_agendas": [],
                "removed_agendas": ["#agenda1#", "#agenda2#"],
                "session": "__any_value__"
            }
        }
        ]
        """

    @auth
    Scenario: Planning item can be created only by user having privileges
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"planning_planning_management": 0, "users": 1}}
        """
        Then we get OK response
        When we post to "planning"
        """
        [{
            "slugline": "test slugline",
            "headline": "test headline"
        }]
        """
        Then we get error 403
        When we setup test user
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"planning_planning_management": 1, "users": 1}}
        """
        Then we get OK response
        When we post to "planning"
        """
        [{
            "slugline": "test slugline",
            "headline": "test headline"
        }]
        """
        Then we get OK response

    @auth
    @notification
    Scenario: Create and update coverages for planning with assignments.
        Given empty "planning"
        When we post to "planning"
        """
        [{
            "guid": "123",
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline"
        }]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    }
                }
            ]
        }
        """
        Then we get OK response
        Then we store coverage id in "firstcoverage" from coverage 0
        Then the assignment not created for coverage 0
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "guid": "123",
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline",
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    }
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
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "desk": "Politic Desk",
                        "user": "507f191e810c19729de870eb"
                    }
                }
            ]
        }
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "guid": "123",
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline",
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "desk": "Politic Desk",
                        "user": "507f191e810c19729de870eb",
                        "assignment_id": "#firstassignment#"
                    }
                }
            ]
        }
        """
        When we get "assignments/#firstassignment#"
        Then we get OK response


    @auth
    @notification
    Scenario: Coverage cannot be deleted after assignment is created.
        Given empty "planning"
        When we post to "planning"
        """
        [{
            "guid": "123",
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline"
        }]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    }
                }
            ]
        }
        """
        Then we get OK response
        Then we store coverage id in "firstcoverage" from coverage 0
        Then the assignment not created for coverage 0
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "guid": "123",
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline",
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    }
                }
            ]
        }
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": []
        }
        """
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "guid": "123",
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline",
            "coverages": []
        }
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "desk": "Politic Desk",
                        "user": "507f191e810c19729de870eb"
                    }
                }
            ]
        }
        """
        Then we get OK response
        Then we store coverage id in "firstcoverage" from coverage 0
        Then we store assignment id in "firstassignment" from coverage 0
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "guid": "123",
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline",
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "desk": "Politic Desk",
                        "user": "507f191e810c19729de870eb",
                        "assignment_id": "#firstassignment#"
                    }
                }
            ]
        }
        """
        When we get "assignments/#firstassignment#"
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": []
        }
        """
        Then we get error 200

    @auth
    @notification
    @vocabulary
    Scenario: Cancel specific coverage
        Given "vocabularies"
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
        }]
        """
        When we post to "planning" with success
        """
        [{
          "guid": "123",
          "headline": "test headline",
          "slugline": "test slugline",
          "state": "scheduled",
          "pubstatus": "usable",
          "coverages": [
              {
                  "coverage_id": "cov_123",
                  "planning": {
                      "ednote": "test coverage, 250 words",
                      "headline": "test headline",
                      "slugline": "test slugline",
                      "scheduled": "2029-11-21T14:00:00.000Z",
                      "g2_content_type": "text"
                  },
                  "news_coverage_status": {
                      "qcode": "ncostat:int",
                      "name": "coverage intended",
                      "label": "Planned"
                  }
              }
          ]
        }]
        """
        When we patch "/planning/#planning._id#"
        """
        {
          "coverages": [
              {
                  "coverage_id": "#firstcoverage#",
                  "news_coverage_status": {
                      "name" : "coverage not intended",
                      "qcode" : "ncostat:notint"
                  },
                  "planning": {
                      "ednote": "test coverage, 250 words",
                      "headline": "test headline",
                      "slugline": "test slugline",
                      "scheduled": "2029-11-21T14:00:00.000Z",
                      "g2_content_type": "text",
                      "internal_note" : "\n\n------------------------------------------------------------\nCoverage cancelled\n"
                  }
              }
          ]
        }
        """
        Then we get OK response
        And we get notifications
        """
        [{
          "event": "planning:created",
          "extra": {"item": "123"}
        }]
        """
        When we get "planning/#planning._id#"
        Then we get existing resource
        """
        {
          "_id": "#planning._id#",
          "state": "scheduled",
          "pubstatus": "usable",
          "coverages": [
              {
                  "coverage_id": "__any_value__",
                  "planning": {
                      "ednote": "test coverage, 250 words",
                      "g2_content_type": "text",
                      "internal_note" : "\n\n------------------------------------------------------------\nCoverage cancelled\n"
                  },
                  "news_coverage_status": {
                      "name" : "coverage not intended",
                      "qcode" : "ncostat:notint"
                  }
              }
          ]
        }
        """

    @auth
    @notification
    @vocabulary
    @test
    Scenario: Cancelling coverage also cancels related assignment
        Given "desks"
        """
        [{"_id": "desk_123", "name": "Politic Desk"}]
        """
        Given "vocabularies"
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
        }]
        """
        When we post to "/planning"
        """
        [
          {
              "item_class": "item class value",
              "headline": "test headline",
              "slugline": "test slugline"
          }
        ]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
          "coverages": [
              {
                  "planning": {
                      "ednote": "test coverage, I want 250 words",
                      "headline": "test headline",
                      "slugline": "test slugline"
                  },
                  "assigned_to": {
                      "desk": "desk_123",
                      "user": "507f191e810c19729de870eb"
                  },
                  "news_coverage_status": {
                      "name" : "coverage intended",
                      "qcode" : "ncostat:int"
                  },
                  "workflow_status": "active"
              }
          ]
        }
        """
        Then we get OK response
        Then we store coverage id in "firstcoverage" from coverage 0
        Then we store assignment id in "firstassignment" from coverage 0
        When we get "/planning/#planning._id#"
        Then we get OK response
        Then we get existing resource
        """
        {
          "_id": "#planning._id#",
          "item_class": "item class value",
          "headline": "test headline",
          "slugline": "test slugline",
          "coverages": [
              {
                  "coverage_id": "#firstcoverage#",
                  "planning": {
                      "ednote": "test coverage, I want 250 words",
                      "headline": "test headline",
                      "slugline": "test slugline"
                  },
                  "assigned_to": {
                      "desk": "desk_123",
                      "user": "507f191e810c19729de870eb",
                      "assignment_id": "#firstassignment#"
                  },
                  "workflow_status": "active"
              }
          ]
        }
        """
        When we get "/assignments/#firstassignment#"
        Then we get OK response
        Then we get existing resource
        """
        {
          "_id": "#firstassignment#",
          "planning": {
              "ednote": "test coverage, I want 250 words",
              "headline": "test headline",
              "slugline": "test slugline"
          },
          "assigned_to": {
              "desk": "desk_123",
              "user": "507f191e810c19729de870eb",
              "state": "assigned"
          }
        }
        """
        When we patch "/planning/#planning._id#"
        """
        {
          "coverages": [
              {
                  "coverage_id": "#firstcoverage#",
                  "planning": {
                      "ednote": "test coverage, I want 250 words",
                      "headline": "test headline",
                      "slugline": "test slugline",
                      "g2_content_type": "text",
                      "internal_note" : "\n\n------------------------------------------------------------\nCoverage cancelled\n"
                  },
                  "news_coverage_status": {
                      "name" : "coverage not intended",
                      "qcode" : "ncostat:notint"
                  },
                  "assigned_to": {
                      "desk": "desk_123",
                      "user": "507f191e810c19729de870eb",
                      "assignment_id": "#firstassignment#"
                  },
                  "workflow_status": "cancelled"
              }
          ]
        }
        """
        Then we get OK response
        When we get "/assignments/#firstassignment#"
        Then we get OK response
        Then we get existing resource
        """
        {
          "_id": "#firstassignment#",
          "planning": {
              "ednote": "test coverage, I want 250 words",
              "headline": "test headline",
              "slugline": "test slugline"
          },
          "assigned_to": {
              "desk": "desk_123",
              "user": "507f191e810c19729de870eb",
              "state": "cancelled"
          }
        }
        """
        When we get "activity"
        Then we get list with 3 items
        """
        {"_items":[
            {
                "resource": "assignments",
                "message": "Assignment {{slugline}} for desk {{desk}} has been cancelled by {{user}}",
                "data": {
                    "desk": "Politic Desk",
                    "user": "test_user",
                    "slugline": "test slugline"
                 },
                 "recipients": [{"user_id": "507f191e810c19729de870eb"}]
            },
            {
                "resource": "assignments",
                "message": "{{assignor}} assigned a coverage to {{assignee}}"
            }
        ]}
        """
        When we get "planning/#planning._id#"
        Then we get existing resource
        """
        {
          "_id": "#planning._id#",
          "state": "draft",
          "coverages": [
              {
                  "coverage_id": "#firstcoverage#",
                  "planning": {
                      "ednote": "test coverage, I want 250 words"
                  },
                  "news_coverage_status": {
                      "name" : "coverage not intended",
                      "qcode" : "ncostat:notint"
                  },
                  "workflow_status": "cancelled"
              }
          ]
        }
        """
        When we get "/assignments/#firstassignment#"
        Then we get OK response
        Then we get existing resource
        """
        {
          "_id": "#firstassignment#",
          "planning": {
              "ednote": "test coverage, I want 250 words",
              "headline": "test headline",
              "slugline": "test slugline"
          },
          "assigned_to": {
              "desk": "desk_123",
              "user": "507f191e810c19729de870eb",
              "state": "cancelled"
          }
        }
        """
        When we get "planning/#planning._id#"
        Then we get existing resource
        """
        {
          "_id": "#planning._id#",
          "state": "draft",
          "coverages": [
              {
                  "coverage_id": "#firstcoverage#",
                  "planning": {
                      "ednote": "test coverage, I want 250 words"
                  },
                  "news_coverage_status": {
                      "name" : "coverage not intended",
                      "qcode" : "ncostat:notint"
                  },
                  "assigned_to": { "state": "cancelled" },
                  "workflow_status": "cancelled"
              }
          ]
        }
        """

    @auth
    @notification
    Scenario: Planning item can be modified only by user having privileges
        When we post to "planning"
        """
        [{"slugline": "slugger"}]
        """
        Then we get OK response
        Then we store "planningId" with value "#planning._id#" to context
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"planning_planning_management": 0, "users": 1}}
        """
        Then we get OK response
        When we patch "/planning/#planningId#"
        """
        {"headline": "header"}
        """
        Then we get error 403
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {"user_type": "user", "privileges": {"planning_planning_management": 1, "users": 1}}
        """
        Then we get OK response
        When we patch "/planning/#planningId#"
        """
        {"headline": "header"}
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "planning:updated",
            "extra": {
                "item": "#planningId#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """

    @auth
    @notification
    Scenario: Planning history tracks updates
        Given empty "planning"
        When we post to "/planning" with success
        """
        [
            {
                "item_class": "item class value",
                "headline": "test headline"
            }
        ]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {"headline": "updated test headline"}
        """
        Then we get OK response
        When we get "/planning_history"
        Then we get a list with 2 items
        """
            {"_items": [{
                "planning_id":  "#planning._id#",
                "operation": "create",
                "update": {
                    "original_creator": "__any_value__",
                    "item_class": "item class value",
                    "headline": "test headline"}},
                {"planning_id":  "#planning._id#",
                "operation": "update",
                "update": {"headline": "updated test headline"}}
            ]}
        """

    @auth
    Scenario: Creating planning related to an event is tracked in event history
        Given "events"
        """
        [
            {
                "unique_id": "123",
                "name": "Friday Club",
                "dates": {
                    "start": "2016-11-17T12:00:00.000Z",
                    "end": "2016-11-17T14:00:00.000Z",
                    "tz": "Europe/Berlin",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "count": 3,
                        "endRepeatMode": "count"
                    }
                },
                "occur_status": {
                    "name": "Planned, occurs certainly",
                    "qcode": "eocstat:eos5"
                }
            }
        ]
        """
        When we post to "/planning" with success
        """
        [
            {
                "item_class": "item class value",
                "headline": "test headline",
                "event_item": "#events._id#"
            }
        ]
        """
        Then we get OK response
        When we get "/planning_history"
        Then we get a list with 1 items
        """
            {"_items": [{
                "planning_id":  "#planning._id#",
                "operation": "create"}
            ]}
        """
        When we get "/events_history"
        Then we get a list with 1 items
        """
            {"_items": [{
                "event_id": "#events._id#",
                "operation": "planning created",
                "update": {"planning_id": "#planning._id#"}}
            ]}
        """

    @auth
    @notification
    @vocabulary
    Scenario: Updating the internal note sends a notification
        Given "desks"
        """
        [{"_id": "desk_123", "name": "Politic Desk"}]
        """
        When we post to "planning" with success
        """
        [{
          "guid": "123",
          "headline": "test headline",
          "slugline": "test slugline",
          "state": "scheduled",
          "pubstatus": "usable",
          "coverages": [
              {
                  "coverage_id": "cov_123",
                  "planning": {
                      "ednote": "test coverage, 250 words",
                      "headline": "test headline",
                      "slugline": "test slugline",
                      "scheduled": "2029-11-21T14:00:00.000Z",
                      "g2_content_type": "text",
                      "internal_note": "Harmless"
                  },
                  "assigned_to": {
                        "desk": "#desks._id#",
                        "user": "#CONTEXT_USER_ID#"
                  }
              }
          ]
        }]
        """
        When we patch "/planning/#planning._id#"
        """
        {
          "coverages": [
              {
                  "coverage_id": "cov_123",
                  "planning": {
                      "internal_note" : "Mostly harmless",
                      "g2_content_type": "text",
                      "slugline": "test slugline",
                      "scheduled": "2029-11-21T14:00:00.000Z"
                  },
                  "assigned_to": {
                        "desk": "#desks._id#",
                        "user": "#CONTEXT_USER_ID#"
                  }
              }
          ]
        }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "activity",
            "extra": {
                "activity": {
                    "message" : "{{coverage_type}} coverage \"slugline\": {{internal_note}}",
                    "data" : {
                        "coverage_type" : "text",
                        "internal_note" : "Mostly harmless",
                        "slugline" : "test slugline"
                    }
                }
            }
        }]
        """

    @auth
    @notification
    @vocabulary
    Scenario: Updating the scheduled time send a notification
        Given "desks"
        """
        [{"_id": "desk_123", "name": "Politic Desk"}]
        """
        When we post to "planning" with success
        """
        [{
          "guid": "123",
          "headline": "test headline",
          "slugline": "test slugline",
          "state": "scheduled",
          "pubstatus": "usable",
          "coverages": [
              {
                  "coverage_id": "cov_123",
                  "planning": {
                      "ednote": "test coverage, 250 words",
                      "headline": "test headline",
                      "slugline": "test slugline",
                      "scheduled": "2029-11-21T14:00:00.000Z",
                      "g2_content_type": "text",
                      "internal_note": "Harmless"
                  },
                  "assigned_to": {
                        "desk": "#desks._id#",
                        "user": "#CONTEXT_USER_ID#"
                  }
              }
          ]
        }]
        """
        When we patch "/planning/#planning._id#"
        """
        {
          "coverages": [
              {
                  "coverage_id": "cov_123",
                  "planning": {
                      "g2_content_type": "text",
                      "slugline": "test slugline",
                      "scheduled": "2030-11-21T13:00:00.000Z",
                      "internal_note": "Harmless"
                  },
                  "assigned_to": {
                        "desk": "#desks._id#",
                        "user": "#CONTEXT_USER_ID#"
                  }
              }
          ]
        }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "activity",
            "extra": {
                "activity": {
                "message" : "Due time has been amended to {{due}} for {{coverage_type}} coverage \"{{slugline}}\"",
                "user_name" : "test_user"
                }
            }
        }]
        """


    @auth
    @notification
    Scenario: Published planning gets updated on cancel planing
      Given "vocabularies"
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
      }]
      """
      When we post to "planning" with success
      """
      [{
          "guid": "123",
          "headline": "test headline",
          "slugline": "test slugline",
          "state": "draft",
          "ednote": "something happened",
          "coverages": [
              {
                  "planning": {
                      "ednote": "test coverage, 250 words",
                      "g2_content_type": "text"
                  },
                  "news_coverage_status": {
                      "qcode": "ncostat:int",
                      "name": "coverage intended",
                      "label": "Planned"
                  }
              },
              {
                  "planning": {
                      "ednote": "test coverage2, 250 words",
                      "g2_content_type": "text"
                  },
                  "news_coverage_status": {
                      "qcode": "ncostat:int",
                      "name": "coverage intended",
                      "label": "Planned"
                  }
              }
          ]
      }]
      """
      Then we get OK response
      Then we store coverage id in "firstcoverage" from coverage 0
      Then we store coverage id in "secondcoverage" from coverage 1
      When we post to "/planning/publish"
        """
        {
            "planning": "#planning._id#",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
        """
      Then we get OK response
      When we perform cancel on planning "123"
      """
      { "cancel_all_coverage": true }
      """
      Then we get OK response
      And we get notifications
      """
      [{
          "event": "planning:created",
          "extra": {"item": "123"}
      },
      {
          "event": "coverage:cancelled",
          "extra": {"planning_item": "123","ids": ["#firstcoverage#", "#secondcoverage#"]}
      }]
      """
      When we get "/planning/#planning._id#"
      Then we get existing resource
      """
      {
          "_id": "#planning._id#",
          "headline": "test headline",
          "slugline": "test slugline",
          "state": "scheduled",
          "pubstatus": "usable",
          "ednote": "something happened",
          "coverages":       [
              {
                  "planning": {
                      "ednote": "test coverage, 250 words",
                      "g2_content_type": "text",
                      "internal_note" : "\n\n------------------------------------------------------------\nCoverage cancelled\n"
                  },
                  "news_coverage_status": {
                      "qcode" : "ncostat:notint"
                  }
              },
              {
                  "planning": {
                      "ednote": "test coverage2, 250 words",
                      "g2_content_type": "text",
                      "internal_note" : "\n\n------------------------------------------------------------\nCoverage cancelled\n"
                  },
                  "news_coverage_status": {
                      "qcode" : "ncostat:notint"
                  }
              }
          ]
      }
      """

    @auth
    @notification
    @vocabulary
    @newtest
    Scenario: Published planning republishes after an update
        When we post to "/planning"
        """
        [{
            "item_class": "item class value",
            "slugline": "test slugline"
        }]
        """
        Then we get OK response
        When we post to "/planning/publish"
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
        When we patch "/planning/#planning._id#"
        """
        {"slugline": "test test test"}
        """
        Then we get OK response
        When we get "/planning_history"
        Then we get a list with 4 items
        """
        {"_items": [
            {
                "planning_id":  "#planning._id#",
                "operation": "create"
            },
            {
                "planning_id":  "#planning._id#",
                "operation": "publish"
            },
            {
                "planning_id":  "#planning._id#",
                "operation": "update",
                "update": { "slugline": "test test test" }
            },
            {
                "planning_id":  "#planning._id#",
                "operation": "publish"
            }
        ]}
    """