Feature: Events Locking

    @auth
    Scenario: Lock item and edit
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
        When we patch "/events/#events._id#/"
        """
        {"name": "event 123.2"}
        """
        Then we get OK response

    @auth
    Scenario: Fail edit on locked item
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
        When we switch user
        And we patch "/events/#events._id#/"
        """
        {"name": "event 123.2"}
        """
        Then we get error 400

    @auth
    Scenario: Fail lock if item is locked in another session
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
        When we setup test user
        When we post to "/events/#events._id#/lock"
        """
        {"lock_action": "edit"}
        """
        Then we get error 403

    @auth
    Scenario: Fail to unlock a planning item without privilege
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
      When we switch user
      When we patch "/users/#USERS_ID#"
      """
      {"user_type": "user", "privileges": {"planning_unlock":0}}
      """
      Then we get OK response
      When we post to "/events/#events._id#/unlock"
      """
      {}
      """
      Then we get error 403

    @auth
    @test
    Scenario: Can unlock a planning item and edit it
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
      When we switch user
      And we post to "/events/#events._id#/unlock"
      """
      {}
      """
      Then we get OK response
      When we post to "/events/#events._id#/lock"
      """
      {"lock_action": "edit"}
      """
      When we patch "/events/#events._id#/"
      """
      {"name": "event 123.2"}
      """
      Then we get OK response
