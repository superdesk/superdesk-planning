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
          "pubstatus": "usable"
      }]
      """
      When we post to "coverage" with success
      """
      [
          {
              "guid": "456",
              "planning_item": "123",
              "planning": {
                  "ednote": "test coverage, 250 words",
                  "assigned_to": {
                      "desk": "Some Desk",
                      "user": "507f191e810c19729de860ea"
                  },
                  "headline": "test headline",
                  "slugline": "test slugline",
                  "scheduled": "2029-11-21T14:00:00.000Z",
                  "g2_content_type": "text"
              }
          }
      ]
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
          "pubstatus": "usable",
          "ednote": "------------------------------------------------------------\nPlanning cancelled\n"
      }
      """

    @auth
    @notification
    @vocabulary
    Scenario: Changes coverage status to `coverage not intended`
      When we post to "planning" with success
      """
      [{
          "guid": "123",
          "headline": "test headline",
          "slugline": "test slugline",
          "state": "scheduled",
          "pubstatus": "usable"
      }]
      """
      When we post to "coverage" with success
      """
      [
          {
              "guid": "456",
              "planning_item": "123",
              "planning": {
                  "ednote": "test coverage, 250 words",
                  "assigned_to": {
                      "desk": "Some Desk",
                      "user": "507f191e810c19729de860ea"
                  },
                  "headline": "test headline",
                  "slugline": "test slugline",
                  "scheduled": "2029-11-21T14:00:00.000Z",
                  "g2_content_type": "text"
              }
          }
      ]
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
      When we get "coverage/#coverage._id#"
      Then we get existing resource
      """
      {
          "guid": "456",
          "planning_item": "123",
          "news_coverage_status": { "name": "coverage not intended" },
          "planning": {
              "slugline": "test slugline",
              "internal_note": "------------------------------------------------------------\nPlanning cancelled\n"
          }
      }
      """

    @auth
    @notification
    @vocabulary
    Scenario: Associated event remains unchanged
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
              "event_contact_info": [{"qcode": "test qcaode", "name": "test name"}],
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
          "pubstatus": "usable"
      }]
      """
      When we post to "coverage" with success
      """
      [
          {
              "guid": "456",
              "planning_item": "123",
              "planning": {
                  "ednote": "test coverage, 250 words",
                  "assigned_to": {
                      "desk": "Some Desk",
                      "user": "507f191e810c19729de860ea"
                  },
                  "headline": "test headline",
                  "slugline": "test slugline",
                  "scheduled": "2029-11-21T14:00:00.000Z",
                  "g2_content_type": "text"
              }
          }
      ]
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
          "event_contact_info": [{"qcode": "test qcaode", "name": "test name"}],
          "occur_status": {
              "name": "Planned, occurs certainly",
              "qcode": "eocstat:eos5"
          },
          "state": "draft"
      }
      """