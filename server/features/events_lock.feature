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
    Scenario: Fail edit on locked event if associated planning item is locked
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
        Given "planning"
        """
        [{
            "slugline": "TestPlan",
            "event_item": "123"
        }]
        """
        When we post to "/planning/#planning._id#/lock"
        """
        {"lock_action": "edit"}
        """
        Then we get new resource
        """
        {
          "slugline": "TestPlan",
          "event_item": "123",
          "lock_user": "#CONTEXT_USER_ID#"
        }

        """
        When we post to "/events/#events._id#/lock"
        """
        {"lock_action": "edit"}
        """
        Then we get error 403
        """
        {"_message": "An associated planning item is already locked."}
        """

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
    Scenario: Fail lock if planning item in the recurring relationship is locked
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
                "item_class": "item class value",
                "headline": "test headline",
                "event_item": "#EVENT3._id#"
            }
        ]
        """
        Then we get OK response
        When we post to "/planning/#planning._id#/lock"
        """
        {"lock_action": "edit"}
        """
        Then we get new resource
        """
        {
          "item_class": "item class value",
          "headline": "test headline",
          "event_item": "#EVENT3._id#",
          "lock_user": "#CONTEXT_USER_ID#"
        }
        """
        # Try to obtain lock for a different event (EVENT1) in the series
        When we post to "/events/#EVENT1._id#/lock"
        """
        {"lock_action": "edit"}
        """
        Then we get error 403
        """
        {"_message": "An associated planning item in this recurring series is already locked."}
        """

    @auth
    Scenario: Fail to unlock an event without privilege
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
    Scenario: Can unlock an event and edit it
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

    @auth
    Scenario: Locking a recurrent event fails when an event in the series already holds the lock
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
                    "count": 3,
                    "endRepeatMode": "count"
                }
            }
        }]
        """
        Then we get OK response
        Then we store "EVENT1" with first item
        Then we store "EVENT2" with 2 item
        Then we store "EVENT3" with 3 item
        When we get "/events"
        Then we get list with 3 items
        """
        {"_items": [
            {
                "name": "Friday Club",
                "dates": {
                    "start": "2019-11-22T12:00:00+0000",
                    "end": "2019-11-22T14:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "count": 3,
                        "endRepeatMode": "count"
                    }
                }
            }, {
                "name": "Friday Club",
                "dates": {
                    "start": "2019-11-29T12:00:00+0000",
                    "end": "2019-11-29T14:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "count": 3,
                        "endRepeatMode": "count"
                    }
                }
            }, {
                "name": "Friday Club",
                "dates": {
                    "start": "2019-12-06T12:00:00+0000",
                    "end": "2019-12-06T14:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "count": 3,
                        "endRepeatMode": "count"
                    }
                }
            }
        ]}
        """
      When we post to "/events/#EVENT1._id#/lock"
      """
      {"lock_action": "edit"}
      """
      Then we get new resource
      """
      {
        "_id": "#EVENT1._id#",
        "name": "Friday Club",
        "lock_user": "#CONTEXT_USER_ID#"
      }
      """
      When we post to "/events/#EVENT3._id#/lock"
      """
      {"lock_action": "edit"}
      """
      Then we get error 403
      """
      {"_message": "Another event in this recurring series is already locked."}
      """

    @auth
    Scenario: Unlocking an event from a recurring series unlocks the actual locked event
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
                    "count": 3,
                    "endRepeatMode": "count"
                }
            }
        }]
        """
        Then we get OK response
        Then we store "EVENT1" with first item
        Then we store "EVENT2" with 2 item
        Then we store "EVENT3" with 3 item
        When we get "/events"
        Then we get list with 3 items
        """
        {"_items": [
            {
                "name": "Friday Club",
                "dates": {
                    "start": "2019-11-22T12:00:00+0000",
                    "end": "2019-11-22T14:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "count": 3,
                        "endRepeatMode": "count"
                    }
                }
            }, {
                "name": "Friday Club",
                "dates": {
                    "start": "2019-11-29T12:00:00+0000",
                    "end": "2019-11-29T14:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "count": 3,
                        "endRepeatMode": "count"
                    }
                }
            }, {
                "name": "Friday Club",
                "dates": {
                    "start": "2019-12-06T12:00:00+0000",
                    "end": "2019-12-06T14:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "count": 3,
                        "endRepeatMode": "count"
                    }
                }
            }
        ]}
        """
      When we post to "/events/#EVENT1._id#/lock"
      """
      {"lock_action": "edit"}
      """
      Then we get new resource
      """
      {
        "_id": "#EVENT1._id#",
        "name": "Friday Club",
        "lock_user": "#CONTEXT_USER_ID#"
      }
      """
      When we post to "/events/#EVENT3._id#/unlock"
      """
      {}
      """
      Then we get new resource
      """
      {
        "_id": "#EVENT1._id#",
        "name": "Friday Club",
        "lock_user": null
      }
      """

    @auth
    Scenario: Locking a recurrent event does not modify other events' lock information
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
                  "count": 3,
                  "endRepeatMode": "count"
              }
          }
      }]
      """
      Then we get OK response
      Then we store "EVENT1" with first item
      Then we store "EVENT2" with 2 item
      Then we store "EVENT3" with 3 item
      When we get "/events"
      Then we get list with 3 items
      """
      {"_items": [
          {
              "name": "Friday Club",
              "dates": {
                  "start": "2019-11-22T12:00:00+0000",
                  "end": "2019-11-22T14:00:00+0000",
                  "tz": "Australia/Sydney",
                  "recurring_rule": {
                      "frequency": "WEEKLY",
                      "interval": 1,
                      "byday": "FR",
                      "count": 3,
                      "endRepeatMode": "count"
                  }
              }
          }, {
              "name": "Friday Club",
              "dates": {
                  "start": "2019-11-29T12:00:00+0000",
                  "end": "2019-11-29T14:00:00+0000",
                  "tz": "Australia/Sydney",
                  "recurring_rule": {
                      "frequency": "WEEKLY",
                      "interval": 1,
                      "byday": "FR",
                      "count": 3,
                      "endRepeatMode": "count"
                  }
              }
          }, {
              "name": "Friday Club",
              "dates": {
                  "start": "2019-12-06T12:00:00+0000",
                  "end": "2019-12-06T14:00:00+0000",
                  "tz": "Australia/Sydney",
                  "recurring_rule": {
                      "frequency": "WEEKLY",
                      "interval": 1,
                      "byday": "FR",
                      "count": 3,
                      "endRepeatMode": "count"
                  }
              }
          }
      ]}
      """
      When we post to "/events/#EVENT1._id#/lock"
      """
      {"lock_action": "edit"}
      """
      Then we get new resource
      """
      {
        "_id": "#EVENT1._id#",
        "name": "Friday Club",
        "lock_user": "#CONTEXT_USER_ID#"
      }
      """
      When we get "/events/#EVENT2._id#"
      Then we get existing resource
      """
      {
        "_id": "#EVENT2._id#",
        "name": "Friday Club"
      }
      """
      When we get "/events/#EVENT3._id#"
      Then we get existing resource
      """
      {
        "_id": "#EVENT3._id#",
        "name": "Friday Club"
      }
      """


