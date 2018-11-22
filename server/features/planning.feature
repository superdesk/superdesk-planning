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
                "slugline": "test slugline",
                "planning_date": "2016-01-02"
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
                "slugline": "test slugline",
                "firstcreated": "__now__",
                "versioncreated": "__now__"
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
        {
            "slugline": "test test test",
            "planning_date": "2016-01-02"
        }
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
                "agendas": ["#agenda1#"],
                "planning_date": "2016-01-02"
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
        {
            "agendas": ["#agenda1#", "#agenda2#"],
            "planning_date": "2016-01-02"
        }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "planning:updated",
            "extra": {
                "item": "#planning._id#",
                "user": "#CONTEXT_USER_ID#",
                "added_agendas": ["#agenda2#"],
                "removed_agendas": [],
                "session": "__any_value__"
            }
        }]
        """
        When we patch "/planning/#planning._id#"
        """
        {
            "agendas": [],
            "planning_date": "2016-01-02"
        }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "planning:updated",
            "extra": {
                "item": "#planning._id#",
                "user": "#CONTEXT_USER_ID#",
                "added_agendas": [],
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
            "headline": "test headline",
            "planning_date": "2016-01-02"
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
            "headline": "test headline",
            "planning_date": "2016-01-02"
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
            "slugline": "test slugline",
            "planning_date": "2016-01-02"
        }]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
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
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
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
    Scenario: Coverage cannot be deleted after assignment is added to workflow.
        Given empty "planning"
        When we post to "planning"
        """
        [{
            "guid": "123",
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline",
            "planning_date": "2016-01-02"
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
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "workflow_status": "active",
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
        Then we get OK response
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
                    "workflow_status": "active",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "desk": "Politic Desk",
                        "user": "507f191e810c19729de870eb",
                        "assignment_id": "#firstassignment#",
                        "state": "assigned"
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
        Then we get error 400

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
          ],
          "planning_date": "2016-01-02"
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
              "slugline": "test slugline",
              "planning_date": "2016-01-02"
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
        [{
            "slugline": "slugger",
            "planning_date": "2016-01-02"
        }]
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
                "headline": "test headline",
                "planning_date": "2016-01-02"
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
                "operation": "edited",
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
                "event_item": "#events._id#",
                "planning_date": "2016-01-02"
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
                "operation": "planning_created",
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
                  "workflow_status": "active",
                  "news_coverage_status": {"qcode": "ncostat:int"},
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
          ],
          "planning_date": "2016-01-02"
        }]
        """
        When we patch "/planning/#planning._id#"
        """
        {
          "coverages": [
              {
                  "coverage_id": "cov_123",
                  "workflow_status": "active",
                  "news_coverage_status": {"qcode": "ncostat:int"},
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
                        "coverage_type" : "Text",
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
        When we reset notifications
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
                  "workflow_status": "active",
                  "news_coverage_status": {"qcode": "ncostat:int"},
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
          ],
          "planning_date": "2016-01-02"
        }]
        """
        When we patch "/planning/#planning._id#"
        """
        {
          "coverages": [
              {
                  "coverage_id": "cov_123",
                  "workflow_status": "active",
                  "news_coverage_status": {"qcode": "ncostat:int"},
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
                  },
                  "workflow_status": "draft",
                  "coverage_id": "cov_123"
              },
              {
                  "planning": {
                      "ednote": "test coverage2, 250 words",
                      "g2_content_type": "text"
                  },
                  "workflow_status": "draft",
                  "news_coverage_status": {
                      "qcode": "ncostat:int",
                      "name": "coverage intended",
                      "label": "Planned"
                  }
              }
          ],
          "planning_date": "2016-01-02"
      }]
      """
      Then we get OK response
      Then we store coverage id in "firstcoverage" from coverage 0
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
                      "ednote": "test coverage, 250 words\n\n------------------------------------------------------------\nCoverage cancelled\n",
                      "g2_content_type": "text",
                      "internal_note" : "------------------------------------------------------------\nCoverage cancelled\n"
                  },
                  "news_coverage_status": {
                      "qcode" : "ncostat:notint"
                  }
              },
              {
                  "planning": {
                      "ednote": "test coverage2, 250 words\n\n------------------------------------------------------------\nCoverage cancelled\n",
                      "g2_content_type": "text",
                      "internal_note" : "------------------------------------------------------------\nCoverage cancelled\n"
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
    Scenario: Published planning repost after an update
        When we post to "/planning"
        """
        [{
            "item_class": "item class value",
            "slugline": "test slugline",
            "planning_date": "2016-01-02"
        }]
        """
        Then we get OK response
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
                "operation": "post"
            },
            {
                "planning_id":  "#planning._id#",
                "operation": "edited",
                "update": { "slugline": "test test test" }
            },
            {
                "planning_id":  "#planning._id#",
                "operation": "post"
            }
        ]}
    """

    @auth
    Scenario: Assigning disabled agenda throws an error
        When we post to "agenda" with "agenda1" and success
        """
        [{"name": "Disabled Agenda", "is_enabled": false}]
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
          ],
          "planning_date": "2016-01-02"
        }]
        """
        When we patch "/planning/#planning._id#"
        """
        {
          "agendas": ["#agenda1#"],
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
        Then we get error 400
        """
        {"_issues": { "validator exception": "403: Agenda 'Disabled Agenda' is not enabled" }}
        """


    @auth
    @notification
    Scenario: Assignments for draft coverages are removed on coverage update.
        Given empty "planning"
        When we post to "planning"
        """
        [{
            "guid": "123",
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline",
            "planning_date": "2016-01-02"
        }]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
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
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "desk": "Politic Desk",
                        "user": "507f191e810c19729de870eb",
                        "state": "draft"
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
        When we get "assignments"
        Then we get list with 1 items
        """
        { "_items": [{
            "_id": "#firstassignment#",
            "type": "assignment",
            "assigned_to": {
                "desk": "Politic Desk",
                "user": "507f191e810c19729de870eb",
                "state": "draft"
            }
        }]}
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
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    }
                }
            ]
        }
        """
        Then we get OK response
        When we get "assignments"
        Then we get list with 0 items

    @auth
    @notification
    @vocabulary
    Scenario: Updating the internal note sends a notification to all coverages
        Given "desks"
        """
        [{"_id": "desk_123", "name": "Politic Desk",
         "members": [{"user": "#CONTEXT_USER_ID#"}]}]
        """
        Given "assignments"
        """
        [{
          "_id": "aaaaaaaaaaaaaaaaaaaaaaaa",
          "planning": {
              "ednote": "test coverage, I want 250 words",
              "headline": "test headline",
              "slugline": "test slugline",
              "g2_content_type" : "text"
          },
          "assigned_to": {
              "desk": "desk_123",
              "user": "#CONTEXT_USER_ID#",
              "state": "assigned"
          }
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
          "internal_note": "Thanks for all the ",
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
                        "user": "#CONTEXT_USER_ID#",
                        "assignment_id": "aaaaaaaaaaaaaaaaaaaaaaaa",
                        "state": "assigned"
                  },
                  "workflow_status": "active"
              }
          ],
          "planning_date": "2016-01-02"
        }]
        """
        When we patch "/planning/#planning._id#"
        """
        {
          "internal_note": "Thanks for all the fish",
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
                        "user": "#CONTEXT_USER_ID#",
                        "assignment_id": "aaaaaaaaaaaaaaaaaaaaaaaa",
                        "state": "assigned"
                  },
                  "workflow_status": "active"
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
                "message" : "{{coverage_type}} coverage \"{{slugline}}\" {{internal_note}} internal note added",
                "user_name" : "test_user"
                }
            }
        }]
        """

    @auth
    Scenario: Headline is not populated when creating item from event using default type
        Given "events"
        """
        [
            {
                "name": "test name",
                "dates": {
                    "start": "2016-11-17T12:00:00.000Z",
                    "end": "2016-11-17T14:00:00.000Z",
                    "tz": "Europe/Berlin"
                }
            }
        ]
        """
        When we post to "/planning"
        """
        {
            "item_class": "item class value",
            "name": "test name",
            "slugline": "test slugline",
            "event_item": "#events._id#",
            "planning_date": "2016-01-02"
        }
        """
        Then we get new resource
        """
        {
            "name": "test name",
            "headline": "__no_value__",
            "slugline": "test slugline"
        }
        """

    @auth
    Scenario: Headline is populated when enabled in planning_type
        Given "planning_types"
        """
        [
            {"name": "planning", "editor": {
                "headline": {"enabled": true}
            }}
        ]
        """
        Given "events"
        """
        [
            {
                "name": "test name",
                "dates": {
                    "start": "2016-11-17T12:00:00.000Z",
                    "end": "2016-11-17T14:00:00.000Z",
                    "tz": "Europe/Berlin"
                }
            }
        ]
        """
        When we post to "/planning"
        """
        {
            "item_class": "item class value",
            "name": "test name",
            "slugline": "test slugline",
            "event_item": "#events._id#",
            "planning_date": "2016-01-02"
        }
        """
        Then we get new resource
        """
        {
            "name": "test name",
            "headline": "test name",
            "slugline": "test slugline"
        }
        """

    @auth
    Scenario: Don't populate headline using name when creating item manually
        Given "planning_types"
        """
        [
            {"name": "planning", "editor": {
                "headline": {"enabled": true}
            }}
        ]
        """
        When we post to "/planning"
        """
        {
            "item_class": "item class value",
            "name": "test name",
            "slugline": "test slugline",
            "planning_date": "2016-01-02"
        }
        """
        Then we get new resource
        """
        {
            "name": "test name",
            "headline": "__no_value__",
            "slugline": "test slugline"
        }
        """

    @auth
    @notification
    @vocabulary
    Scenario: Assignment cannot be edited after it is added to workflow.
        Given empty "planning"
        When we post to "planning"
        """
        [{
            "guid": "123",
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline",
            "planning_date": "2016-01-02"
        }]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
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
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
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
        Then we get OK response
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
                    "workflow_status": "active",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "desk": "Politic Desk",
                        "user": "507f191e810c19729de870eb",
                        "assignment_id": "#firstassignment#",
                        "state": "assigned"
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
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "desk": "Politic Desk",
                        "user": "507f191e810c19729de870eb",
                        "assignment_id": "#firstassignment#",
                        "state": "draft"
                    }
                }
            ]
        }
        """
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
                    "workflow_status": "active",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "desk": "Politic Desk",
                        "user": "507f191e810c19729de870eb",
                        "assignment_id": "#firstassignment#",
                        "state": "assigned"
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
                    "workflow_status": "active",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "assigned_to": {
                        "desk": "Sports Desk",
                        "user": "507f191e810c19729de870eb",
                        "assignment_id": "#firstassignment#",
                        "state": "assigned"
                    }
                }
            ]
        }
        """
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
                    "workflow_status": "active",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline"
                    },
                    "assigned_to": {
                        "desk": "Politic Desk",
                        "user": "507f191e810c19729de870eb",
                        "assignment_id": "#firstassignment#",
                        "state": "assigned"
                    }
                }
            ]
        }
        """

    @auth
    @notification @test
    Scenario: Validate planning date of a planning item
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
        Then we get error 400
        """
        {"_message": "Planning item should have a date"}
        """
