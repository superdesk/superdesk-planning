Feature: Planning Item Locking

    @auth
    Scenario: Lock item and edit
        Given "planning"
        """
        [{
            "slugline": "TestPlan"
        }]
        """
        When we post to "/planning/#planning._id#/lock"
        """
        {"lock_action": "edit"}
        """
        Then we get new resource
        """
        {
          "_id": "#planning._id#", "slugline": "TestPlan", "lock_user": "#CONTEXT_USER_ID#"
        }
        """
        When we patch "/planning/#planning._id#/"
        """
        {"slugline": "TestPlan-2"}
        """
        Then we get OK response

    @auth
    Scenario: Fail edit on locked item
        Given "planning"
        """
        [{
            "slugline": "TestPlan"
        }]
        """
        When we post to "/planning/#planning._id#/lock"
        """
        {"lock_action": "edit"}
        """
        Then we get new resource
        """
        {
          "_id": "#planning._id#", "slugline": "TestPlan", "lock_user": "#CONTEXT_USER_ID#"
        }
        """
        When we switch user
        When we patch "/planning/#planning._id#/"
        """
        {"slugline": "TestPlan-2"}
        """
        Then we get error 400

    @auth
    Scenario: Fail lock if item is locked in another session
        Given "planning"
        """
        [{
            "slugline": "TestPlan"
        }]
        """
        When we post to "/planning/#planning._id#/lock"
        """
        {"lock_action": "edit"}
        """
        Then we get new resource
        """
        {
          "_id": "#planning._id#", "slugline": "TestPlan", "lock_user": "#CONTEXT_USER_ID#"
        }
        """
        When we setup test user
        When we post to "/planning/#planning._id#/lock"
        """
        {"lock_action": "edit"}
        """
        Then we get error 403

    @auth
    Scenario: Fail to unlock a planning item without privilege
    Given "planning"
      """
      [{
          "slugline": "TestPlan"
      }]
      """
      When we post to "/planning/#planning._id#/lock"
      """
      {"lock_action": "edit"}
      """
      Then we get new resource
      """
      {
        "_id": "#planning._id#", "slugline": "TestPlan", "lock_user": "#CONTEXT_USER_ID#"
      }
      """
      When we switch user
      When we patch "/users/#USERS_ID#"
      """
      {"user_type": "user", "privileges": {"planning_unlock":0}}
      """
      Then we get OK response
      When we post to "/planning/#planning._id#/unlock"
      """
      {}
      """
      Then we get error 403

    @auth
    Scenario: Can unlock a planning item and edit it
      Given "planning"
        """
        [{
            "slugline": "TestPlan"
        }]
        """
        When we post to "/planning/#planning._id#/lock"
        """
        {"lock_action": "edit"}
        """
        Then we get new resource
        """
        {
          "_id": "#planning._id#", "slugline": "TestPlan", "lock_user": "#CONTEXT_USER_ID#"
        }
        """
        When we switch user
        When we post to "/planning/#planning._id#/unlock"
        """
        {}
        """
        Then we get OK response
        When we post to "/planning/#planning._id#/lock"
        """
        {"lock_action": "edit"}
        """
        When we patch "/planning/#planning._id#/"
        """
        {"slugline": "TestPlan-2"}
        """
        Then we get OK response

    @auth
    Scenario: Lock fails if associated event is locked
      Given "events"
      """
      [{
          "guid": "123",
          "unique_id": "123",
          "unique_name": "123 name",
          "name": "event 123",
          "dates": {
              "start": "2016-01-02",
              "end": "2016-01-03"
          }
      }]
      """
      When we post to "/planning" with success
      """
      [{
          "_id": "plan1",
          "guid": "plan1",
          "event_item": "#events._id#"
       }]
      """
      When we post to "/events/#events._id#/lock"
      """
      {"lock_action": "edit"}
      """
      Then we get new resource
      """
      { "guid": "123",
        "unique_name": "123 name",
        "dates": {
            "start": "2016-01-02T00:00:00+0000",
            "end": "2016-01-03T00:00:00+0000"
        },
        "unique_id": 123,
        "name": "event 123",
        "_id": "123",
        "lock_user": "#CONTEXT_USER_ID#"
      }
      """
      When we post to "/planning/#planning._id#/lock"
      """
      {"lock_action": "edit"}
      """
      Then we get error 403
      """
      {"_message": "An associated event is already locked."}
      """


    @auth
    Scenario: Lock fails if another planning item associated with same standalone event is locked
      Given "events"
      """
      [{
          "guid": "123",
          "unique_id": "123",
          "unique_name": "123 name",
          "name": "event 123",
          "dates": {
              "start": "2016-01-02",
              "end": "2016-01-03"
          }
      }]
      """
      When we post to "/planning" with success
      """
      [
            {
                "_id": "plan1",
                "guid": "plan1",
                "event_item": "#events._id#"
            },
            {
                "_id": "plan2",
                "guid": "plan2",
                "event_item": "#events._id#"
            }
      ]
      """
      When we get "planning"
      Then we get list with 2 items
      """
          {"_items": [
          {
              "_id": "plan1",
              "guid": "plan1",
              "event_item": "#events._id#"
          },
          {
              "_id": "plan2",
              "guid": "plan2",
              "event_item": "#events._id#"
          }]}
      """
      When we post to "/planning/plan2/lock"
      """
      {"lock_action": "edit"}
      """
      Then we get new resource
      """
      {
        "_id": "plan2",
        "lock_user": "#CONTEXT_USER_ID#"
      }
      """
      When we post to "/planning/plan1/lock"
      """
      {"lock_action": "edit"}
      """
      Then we get error 403
      """
      {"_message": "Another planning item is already locked."}
      """


    @auth
    Scenario: Fail to lock planning item if another recurring planning item is locked
      When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2019-11-21T12:00:00.000Z",
                "end": "2019-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "WEEKLY",
                    "interval": 1,
                    "byday": "FR",
                    "count": 5,
                    "endRepeatMode": "count"
                }
            }
        }]
        """
        Then we get OK response
        Then we store "EVENT1" with first item
        Then we store "EVENT2" with 2 item
        Then we store "EVENT3" with 3 item
        Then we store "EVENT4" with 4 item
        Then we store "EVENT5" with 5 item
        When we get "/events"
        Then we get list with 5 items
        """
        {"_items": [
          {
              "dates": {
                  "start": "2019-11-22T12:00:00+0000",
                  "end": "2019-11-22T14:00:00+0000"
              },
              "name": "Friday Club"
          }, {
              "dates": {
                  "start": "2019-11-29T12:00:00+0000",
                  "end": "2019-11-29T14:00:00+0000"
              },
              "name": "Friday Club"
          }, {
              "dates": {
                  "start": "2019-12-06T12:00:00+0000",
                  "end": "2019-12-06T14:00:00+0000"
              },
              "name": "Friday Club"
          }, {
              "dates": {
                  "start": "2019-12-13T12:00:00+0000",
                  "end": "2019-12-13T14:00:00+0000"
              },
              "name": "Friday Club"
          }, {
              "dates": {
                  "start": "2019-12-20T12:00:00+0000",
                  "end": "2019-12-20T14:00:00+0000"
              },
              "name": "Friday Club"
          }
        ]}
        """
        When we post to "/planning" with success
        """
        [
            {
                "_id": "plan1",
                "guid": "plan1",
                "event_item": "#EVENT1._id#"
            },
            {
                "_id": "plan2",
                "guid": "plan2",
                "event_item": "#EVENT1._id#"
            }
        ]
        """
        Then we get OK response
        When we get "planning"
        Then we get list with 2 items
        """
            {"_items": [
            {
                "_id": "plan1",
                "guid": "plan1",
                "event_item": "#EVENT1._id#",
                "recurrence_id": "#EVENT1.recurrence_id#"
            },
            {
                "_id": "plan2",
                "guid": "plan2",
                "event_item": "#EVENT1._id#",
                "recurrence_id": "#EVENT1.recurrence_id#"
            }]}
        """
        When we post to "/planning/plan2/lock"
        """
        {"lock_action": "edit"}
        """
        Then we get new resource
        """
        {
          "_id": "plan2",
          "lock_user": "#CONTEXT_USER_ID#",
          "recurrence_id": "#EVENT1.recurrence_id#"
        }
        """
        When we post to "/planning/plan1/lock"
        """
        {"lock_action": "edit"}
        """
        Then we get error 403
        """
        {"_message": "Another planning item in this recurring series is already locked."}
        """

    @auth
    Scenario: Fail to lock if any event in the recurring series is already locked
    When we post to "events"
      """
      [{
          "name": "Friday Club",
          "dates": {
              "start": "2019-11-21T12:00:00.000Z",
              "end": "2019-11-21T14:00:00.000Z",
              "tz": "Australia/Sydney",
              "recurring_rule": {
                  "frequency": "WEEKLY",
                  "interval": 1,
                  "byday": "FR",
                  "count": 5,
                  "endRepeatMode": "count"
              }
          }
      }]
      """
      Then we get OK response
      Then we store "EVENT1" with first item
      Then we store "EVENT2" with 2 item
      Then we store "EVENT3" with 3 item
      Then we store "EVENT4" with 4 item
      Then we store "EVENT5" with 5 item
      When we get "/events"
      Then we get list with 5 items
      """
      {"_items": [
        {
            "dates": {
                "start": "2019-11-22T12:00:00+0000",
                "end": "2019-11-22T14:00:00+0000"
            },
            "name": "Friday Club"
        }, {
            "dates": {
                "start": "2019-11-29T12:00:00+0000",
                "end": "2019-11-29T14:00:00+0000"
            },
            "name": "Friday Club"
        }, {
            "dates": {
                "start": "2019-12-06T12:00:00+0000",
                "end": "2019-12-06T14:00:00+0000"
            },
            "name": "Friday Club"
        }, {
            "dates": {
                "start": "2019-12-13T12:00:00+0000",
                "end": "2019-12-13T14:00:00+0000"
            },
            "name": "Friday Club"
        }, {
            "dates": {
                "start": "2019-12-20T12:00:00+0000",
                "end": "2019-12-20T14:00:00+0000"
            },
            "name": "Friday Club"
        }
      ]}
      """
      When we post to "/planning" with success
      """
      [
          {
              "_id": "plan1",
              "guid": "plan1",
              "event_item": "#EVENT1._id#"
          }
      ]
      """
      Then we get OK response
      When we get "planning"
      Then we get list with 1 items
      """
          {"_items": [
            {
              "_id": "plan1",
              "guid": "plan1",
              "event_item": "#EVENT1._id#",
              "recurrence_id": "#EVENT1.recurrence_id#"
            }]
          }
      """
      When we post to "/events/#EVENT3._id#/lock"
      """
      {"lock_action": "edit"}
      """
      Then we get new resource
      """
      {
        "_id": "#EVENT3._id#",
        "name": "Friday Club",
        "lock_user": "#CONTEXT_USER_ID#"
      }
      """
      When we post to "/planning/plan1/lock"
      """
      {"lock_action": "edit"}
      """
      Then we get error 403
      """
      {"_message": "An associated event in this recurring series is already locked."}
      """



