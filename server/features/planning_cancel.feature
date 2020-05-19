Feature: Cancel all coverage

    @auth
    @notification
    Scenario: Changes planning item state to `cancelled`
      When we post to "planning" with success
      """
      [{
          "guid": "123",
          "headline": "test headline",
          "slugline": "test slugline",
          "state": "scheduled",
          "pubstatus": "usable",
          "planning_date": "2016-01-02",
          "coverages": [
            {
                "planning": {
                    "ednote": "test coverage, 250 words",
                    "headline": "test headline",
                    "slugline": "test slugline",
                    "scheduled": "2029-11-21T14:00:00.000Z",
                    "g2_content_type": "text"
                },
                "workflow_status": "draft",
                "news_coverage_status": {
                    "qcode": "ncostat:int"
                }
            }
          ]
      }]
      """
      When we perform cancel on planning "123"
      Then we get OK response
      And we get notifications
      """
      [{
          "event": "planning:created",
          "extra": {"item": "123"}
      },
      {
          "event": "planning:cancelled",
          "extra": {"item": "123","user": "#CONTEXT_USER_ID#"}
      }]
      """
      When we get "planning/#planning._id#"
      Then we get existing resource
      """
      {
          "guid": "123",
          "headline": "test headline",
          "slugline": "test slugline",
          "state": "cancelled",
          "pubstatus": "usable"
      }
      """

    @auth
    @notification
    Scenario: Published planning gets updated
      When we post to "/products" with success
      """
      {
          "name":"prod-1","codes":"abc,xyz", "product_type": "both"
      }
      """
      And we post to "/subscribers" with success
      """
      {
          "name":"News1","media_type":"media", "subscriber_type": "digital", "sequence_num_settings":{"min" : 1, "max" : 10}, "email": "test@test.com",
          "products": ["#products._id#"],
          "codes": "xyz, abc",
          "destinations": [{"name":"events", "format": "json_event", "delivery_type": "File", "config":{"file_path": "/tmp"}}]
      }
      """
      When we post to "planning" with success
      """
      [{
          "guid": "123",
          "headline": "test headline",
          "slugline": "test slugline",
          "state": "draft",
          "lock_action": "planning_cancel",
          "coverages": [{
              "workflow_status": "draft",
              "news_coverage_status": {
                  "qcode": "ncostat:int"
              },
              "planning": {
                  "ednote": "test coverage, 250 words",
                  "headline": "test headline",
                  "slugline": "test slugline",
                  "scheduled": "2029-11-21T14:00:00.000Z",
                  "g2_content_type": "text"
              }
          }],
          "planning_date": "2016-01-02"
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
      When we perform cancel on planning "123"
      """
      { "reason": "Just like that!" }
      """
      Then we get OK response
      And we get notifications
      """
      [{
          "event": "planning:posted",
          "extra": {"item": "123"}
      },
      {
          "event": "planning:created",
          "extra": {"item": "123"}
      },
      {
          "event": "planning:cancelled",
          "extra": {"item": "123","user": "#CONTEXT_USER_ID#"}
      },
      {
          "event": "planning:posted",
          "extra": {"item": "123"}
      }]
      """
      When we get "planning/#planning._id#"
      Then we get existing resource
      """
      {
          "guid": "123",
          "headline": "test headline",
          "slugline": "test slugline",
          "state": "cancelled",
          "pubstatus": "usable",
          "state_reason": "Just like that!",
          "coverages": [{
            "planning": {
              "ednote": "test coverage, 250 words",
              "g2_content_type": "text",
              "headline": "test headline",
              "scheduled": "2029-11-21T14:00:00+0000",
              "slugline": "test slugline",
              "workflow_status_reason": "Just like that!"
            },
            "previous_status": "draft",
            "workflow_status": "cancelled"
          }]
      }
      """

    @auth
    @notification
    @vocabulary
    Scenario: Posted planning gets updated on cancel all coverage
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
          "lock_action": "cancel_all_coverage",
          "coverages": [
              {
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
                  },
                  "workflow_status": "draft"
              }
          ],
          "planning_date": "2016-01-02"
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
      When we perform cancel on planning "123"
      Then we get OK response
      And we get notifications
      """
      [{
          "event": "planning:posted",
          "extra": {"item": "123"}
      },
      {
          "event": "planning:created",
          "extra": {"item": "123"}
      },
      {
          "event": "planning:cancelled",
          "extra": {"item": "123","user": "#CONTEXT_USER_ID#"}
      },
      {
          "event": "planning:posted",
          "extra": {"item": "123"}
      }]
      """
      When we get "planning/#planning._id#"
      Then we get existing resource
      """
      {
          "_id": "#planning._id#",
          "state": "cancelled",
          "pubstatus": "usable",
          "coverages": [
              {
                  "coverage_id": "__any_value__",
                  "planning": {
                      "ednote": "test coverage, 250 words",
                      "g2_content_type": "text"
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
    Scenario: Associated event remains unchanged
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
      },
      {
          "_id": "eventoccurstatus",
          "display_name": "Event Occurence Status",
          "type": "manageable",
          "unique_field": "qcode",
          "items": [
              {"is_active": true, "qcode": "eocstat:eos0", "name": "Unplanned event"},
              {"is_active": true, "qcode": "eocstat:eos1", "name": "Planned, occurence planned only"},
              {"is_active": true, "qcode": "eocstat:eos2", "name": "Planned, occurence highly uncertain"},
              {"is_active": true, "qcode": "eocstat:eos3", "name": "Planned, May occur"},
              {"is_active": true, "qcode": "eocstat:eos4", "name": "Planned, occurence highly likely"},
              {"is_active": true, "qcode": "eocstat:eos5", "name": "Planned, occurs certainly"},
              {"is_active": true, "qcode": "eocstat:eos6", "name": "Planned, then cancelled"}
          ]
        }]
      """
      Given "contacts"
      """
        [{"first_name": "Albert", "last_name": "Foo"}]
      """
      Given "events"
      """
      [
          {
              "guid": "789",
              "unique_id": "789",
              "unique_name": "789 name",
              "name": "event 789",
              "slugline": "event-789",
              "definition_short": "short value",
              "definition_long": "long value",
              "relationships":{
                  "broader": "broader value",
                  "narrower": "narrower value",
                  "related": "related value"
              },
              "dates": {
                  "start": "2016-01-02",
                  "end": "2016-01-03"
              },
              "subject": [{"qcode": "test qcaode", "name": "test name"}],
              "event_contact_info": ["#contacts._id#"],
              "occur_status": {
                  "name": "Planned, occurs certainly",
                  "qcode": "eocstat:eos5"
              },
              "state": "draft"
          }
      ]
      """
      When we get "events/#events._id#"
      Then we get existing resource
      """
      {
          "guid": "789",
          "unique_id": 789
      }
      """
      When we post to "planning" with success
      """
      [{
          "guid": "123",
          "headline": "test headline",
          "slugline": "test slugline",
          "event_item": "#events._id#",
          "state": "scheduled",
          "pubstatus": "usable",
          "coverages": [
              {
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
                  },
                  "workflow_status": "draft"
              }
          ],
          "planning_date": "2016-01-02"
      }]
      """
      When we perform cancel on planning "123"
      Then we get OK response
      When we get "events/#events._id#"
      Then we get existing resource
      """
      {
          "guid": "789",
          "unique_id": 789,
          "unique_name": "789 name",
          "name": "event 789",
          "slugline": "event-789",
          "definition_short": "short value",
          "definition_long": "long value",
          "relationships":{
              "broader": "broader value",
              "narrower": "narrower value",
              "related": "related value"
          },
          "dates": {
              "start": "2016-01-02T00:00:00+0000",
              "end": "2016-01-03T00:00:00+0000"
          },
          "subject": [{"qcode": "test qcaode", "name": "test name"}],
          "event_contact_info": ["#contacts._id#"],
          "occur_status": {
              "name": "Planned, occurs certainly",
              "qcode": "eocstat:eos5"
          },
          "state": "draft"
      }
      """

    @auth
    @notification
    @vocabulary
    Scenario: Changes coverage status on cancel all coverage
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
          "ednote": "something happened",
          "coverages": [
              {
                  "workflow_status": "draft",
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
                  "workflow_status": "draft",
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
          ],
          "planning_date": "2016-01-02"
      }]
      """
      Then we get OK response
      Then we store coverage id in "firstcoverage" from coverage 0
      Then we store coverage id in "secondcoverage" from coverage 1
      When we perform cancel on planning "123"
      """
      {
        "reason": "Just like that!",
        "cancel_all_coverage": true
      }
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
          "coverages": [
              {
                  "planning": {
                      "ednote": "test coverage, 250 words",
                      "g2_content_type": "text",
                      "workflow_status_reason": "Just like that!"
                  },
                  "news_coverage_status": {
                      "qcode" : "ncostat:notint"
                  }
              },
              {
                  "planning": {
                      "ednote": "test coverage2, 250 words",
                      "g2_content_type": "text",
                      "workflow_status_reason": "Just like that!"
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
    Scenario: Posted planning gets updated on cancel planing
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
                  "workflow_status": "draft",
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
                  "workflow_status": "draft",
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
                      "ednote": "test coverage, 250 words",
                      "g2_content_type": "text"
                  },
                  "news_coverage_status": {
                      "qcode" : "ncostat:notint"
                  }
              },
              {
                  "planning": {
                      "ednote": "test coverage2, 250 words",
                      "g2_content_type": "text"
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
    Scenario: Cancelling coverage linked to an archive item will unlink the assignment
        Given the "validators"
        """
        [
        {
            "schema": {},
            "type": "text",
            "act": "post",
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
        When we post to "/archive"
        """
        [{
            "type": "text",
            "headline": "test headline",
            "slugline": "test slugline",
            "task": {
                "desk": "#desks._id#",
                "stage": "#desks.incoming_stage#"
            }
        }]
        """
        Then we get OK response
        When we post to "/planning"
        """
        [{
            "item_class": "item class value",
            "slugline": "test slugline",
            "planning_date": "2016-01-02"
        }]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "workflow_status": "active",
                "news_coverage_status": {
                    "qcode": "ncostat:int",
                    "name": "coverage intended",
                    "label": "Planned"
                },
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline",
                    "g2_content_type" : "text"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#"
                }
            }],
            "planning_date": "2016-01-02"
        }
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        When we reset notifications
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#",
            "reassign": true
        }]
        """
        Then we get OK response
        Then we get notifications
        """
        [{"event": "content:update"}]
        """
        When we get "/archive/#archive._id#"
        Then we get existing resource
        """
        {
            "assignment_id": "#firstassignment#"
        }
        """
        When we get "assignments/#firstassignment#"
        Then we get existing resource
        """
        {
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "in_progress"
            }
        }
        """
        When we perform cancel on planning "#planning._id#"
        Then we get OK response
        When we get "/archive/#archive._id#"
        Then we get existing resource
        """
        {
            "assignment_id": null
        }
        """
        When we get "/assignments_history"
        Then we get list with 4 items
        """
        {"_items": [
            {
                "assignment_id": "#firstassignment#",
                "operation": "create"
            },
            {
                "assignment_id": "#firstassignment#",
                "operation": "content_link"
            },
            {
                "assignment_id": "#firstassignment#",
                "operation": "unlink"
            },
            {
                "assignment_id": "#firstassignment#",
                "operation": "cancelled"
            }
        ]}
        """


    @auth
    Scenario: Reason field can configured as required field for planning item
        Given "planning_types"
        """
        [
            {
                "_id": "planning_planning_cancel",
                "name": "planning_planning_cancel",
                "schema": {
                    "reason": {
                        "required": true
                    }
                }
            }
        ]
        """
        And "planning"
      """
      [{
          "guid": "123",
          "headline": "test headline",
          "slugline": "test slugline",
          "state": "scheduled",
          "pubstatus": "usable",
          "planning_date": "2016-01-02",
          "lock_user": "#CONTEXT_USER_ID#",
          "lock_session": "#SESSION_ID#",
          "lock_action": "planning_cancel",
          "lock_time": "#DATE#",
          "coverages": [
            {
                "planning": {
                    "ednote": "test coverage, 250 words",
                    "headline": "test headline",
                    "slugline": "test slugline",
                    "scheduled": "2029-11-21T14:00:00.000Z",
                    "g2_content_type": "text"
                },
                "workflow_status": "draft",
                "news_coverage_status": {
                    "qcode": "ncostat:int"
                }
            }
          ]
      }]
      """
      When we perform cancel on planning "123"
      Then we get error 400
      When we perform cancel on planning "123"
      """
      {"reason": "cancel"}
      """
      Then we get OK response
      When we get "planning/#planning._id#"
      Then we get existing resource
      """
      {
          "guid": "123",
          "headline": "test headline",
          "slugline": "test slugline",
          "state": "cancelled",
          "pubstatus": "usable"
      }
      """

    @auth
    @notification
    @vocabulary
    Scenario: Reason field is required field for cancel all coverage action
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
        And "planning_types"
        """
        [
            {
                "_id": "planning_cancel_all_coverage",
                "name": "planning_cancel_all_coverage",
                "schema": {
                    "reason": {
                        "required": true
                    }
                }
            }
        ]
        """
      And "planning"
      """
      [{
          "guid": "123",
          "headline": "test headline",
          "slugline": "test slugline",
          "state": "scheduled",
          "pubstatus": "usable",
          "ednote": "something happened",
          "lock_user": "#CONTEXT_USER_ID#",
          "lock_session": "#SESSION_ID#",
          "lock_action": "cancel_all_coverage",
          "lock_time": "#DATE#",
          "type": "planning",
          "coverages": [
              {
                  "workflow_status": "draft",
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
                  "workflow_status": "draft",
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
          ],
          "planning_date": "2016-01-02"
      }]
      """
      When we get "/planning/123"
      Then we get OK response
      Then we store coverage id in "firstcoverage" from coverage 0
      Then we store coverage id in "secondcoverage" from coverage 1
      When we perform cancel on planning "123"
      """
      {
        "cancel_all_coverage": true
      }
      """
      Then we get error 400
      When we perform cancel on planning "123"
      """
      {
        "reason": "Just like that!",
        "cancel_all_coverage": true
      }
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
          "coverages": [
              {
                  "planning": {
                      "ednote": "test coverage, 250 words",
                      "g2_content_type": "text",
                      "workflow_status_reason": "Just like that!"
                  },
                  "news_coverage_status": {
                      "qcode" : "ncostat:notint"
                  }
              },
              {
                  "planning": {
                      "ednote": "test coverage2, 250 words",
                      "g2_content_type": "text",
                      "workflow_status_reason": "Just like that!"
                  },
                  "news_coverage_status": {
                      "qcode" : "ncostat:notint"
                  }
              }
          ]
      }
      """
