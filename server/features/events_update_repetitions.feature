Feature: Events Update Repetitions

    @auth
    @notification
    Scenario: Increases series using count
        Given we have sessions "/sessions"
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2029-11-22T01:00:00.000Z",
                "end": "2029-11-22T04:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 4,
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
        When we get "/events"
        Then we get list with 4 items
        """
        {"_items": [
            {"_id": "#EVENT1._id#", "recurrence_id": "#EVENT1.recurrence_id#"},
            {"_id": "#EVENT2._id#", "recurrence_id": "#EVENT1.recurrence_id#"},
            {"_id": "#EVENT3._id#", "recurrence_id": "#EVENT1.recurrence_id#"},
            {"_id": "#EVENT4._id#", "recurrence_id": "#EVENT1.recurrence_id#"}
        ]}
        """
        When we post to "/events/#EVENT2._id#/lock" with success
        """
        {"lock_action": "update_repetitions"}
        """
        When we reset notifications
        And we perform update_repetitions on events "#EVENT2._id#"
        """
        {
            "dates": {
                "start": "2029-11-23T01:00:00.000Z",
                "end": "2029-11-23T04:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 6,
                    "endRepeatMode": "count"
                }
            }
        }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:unlock",
            "extra": {
                "item": "#EVENT2._id#",
                "lock_session": "#SESSION_ID#",
                "user": "#CONTEXT_USER_ID#"
            }
        }, {
            "event": "events:update_repetitions:recurring",
            "extra": {
                "item": "#EVENT2._id#",
                "recurrence_id": "#EVENT2.recurrence_id#"
            }
        }]
        """
        When we get "/events"
        Then we get list with 6 items
        """
        {"_items": [
            {
                "_id": "#EVENT1._id#",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2029-11-22T01:00:00+0000",
                    "end": "2029-11-22T04:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "DAILY",
                        "interval": 1,
                        "count": 6,
                        "endRepeatMode": "count"
                    }
                }
            }, {
                "_id": "#EVENT2._id#",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2029-11-23T01:00:00+0000",
                    "end": "2029-11-23T04:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "DAILY",
                        "interval": 1,
                        "count": 6,
                        "endRepeatMode": "count"
                    }
                }
            }, {
                "_id": "#EVENT3._id#",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2029-11-24T01:00:00+0000",
                    "end": "2029-11-24T04:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "DAILY",
                        "interval": 1,
                        "count": 6,
                        "endRepeatMode": "count"
                    }
                }
            }, {
                "_id": "#EVENT4._id#",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2029-11-25T01:00:00+0000",
                    "end": "2029-11-25T04:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "DAILY",
                        "interval": 1,
                        "count": 6,
                        "endRepeatMode": "count"
                    }
                }
            }, {
                "_id": "__any_value__",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2029-11-26T01:00:00+0000",
                    "end": "2029-11-26T04:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "DAILY",
                        "interval": 1,
                        "count": 6,
                        "endRepeatMode": "count"
                    }
                }
            }, {
                "_id": "__any_value__",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2029-11-27T01:00:00+0000",
                    "end": "2029-11-27T04:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "DAILY",
                        "interval": 1,
                        "count": 6,
                        "endRepeatMode": "count"
                    }
                }
            }
        ]}
        """
        When we get "/events_history"
        Then we get list with 10 items
        """
        {"_items": [
          {"operation": "create", "event_id": "#EVENT1._id#"},
          {"operation": "create", "event_id": "#EVENT2._id#"},
          {"operation": "create", "event_id": "#EVENT3._id#"},
          {"operation": "create", "event_id": "#EVENT4._id#"},
          {
              "operation": "update_repetitions",
              "event_id": "#EVENT1._id#",
              "update": {
                  "dates": {
                      "start": "2029-11-22T01:00:00+0000",
                      "end": "2029-11-22T04:00:00+0000",
                      "tz": "Australia/Sydney",
                      "recurring_rule": {
                          "frequency": "DAILY",
                          "interval": 1,
                          "count": 6,
                          "endRepeatMode": "count"
                      }
                  }
              }
          },
          {
              "operation": "update_repetitions",
              "event_id": "#EVENT2._id#",
              "update": {
                  "dates": {
                      "start": "2029-11-23T01:00:00+0000",
                      "end": "2029-11-23T04:00:00+0000",
                      "tz": "Australia/Sydney",
                      "recurring_rule": {
                          "frequency": "DAILY",
                          "interval": 1,
                          "count": 6,
                          "endRepeatMode": "count"
                      }
                  }
              }
          },
          {
              "operation": "update_repetitions",
              "event_id": "#EVENT3._id#",
              "update": {
                  "dates": {
                      "start": "2029-11-24T01:00:00+0000",
                      "end": "2029-11-24T04:00:00+0000",
                      "tz": "Australia/Sydney",
                      "recurring_rule": {
                          "frequency": "DAILY",
                          "interval": 1,
                          "count": 6,
                          "endRepeatMode": "count"
                      }
                  }
              }
          },
          {
              "operation": "update_repetitions",
              "event_id": "#EVENT4._id#",
              "update": {
                  "dates": {
                      "start": "2029-11-25T01:00:00+0000",
                      "end": "2029-11-25T04:00:00+0000",
                      "tz": "Australia/Sydney",
                      "recurring_rule": {
                          "frequency": "DAILY",
                          "interval": 1,
                          "count": 6,
                          "endRepeatMode": "count"
                      }
                  }
              }
          },
          {
              "operation": "create",
              "event_id": "__any_value__",
              "update": {
                  "dates": {
                      "start": "2029-11-26T01:00:00+0000",
                      "end": "2029-11-26T04:00:00+0000",
                      "tz": "Australia/Sydney",
                      "recurring_rule": {
                          "frequency": "DAILY",
                          "interval": 1,
                          "count": 6,
                          "endRepeatMode": "count"
                      }
                  }
              }
          },
          {
              "operation": "create",
              "event_id": "__any_value__",
              "update": {
                  "dates": {
                      "start": "2029-11-27T01:00:00+0000",
                      "end": "2029-11-27T04:00:00+0000",
                      "tz": "Australia/Sydney",
                      "recurring_rule": {
                          "frequency": "DAILY",
                          "interval": 1,
                          "count": 6,
                          "endRepeatMode": "count"
                      }
                  }
              }
          }
        ]}
        """

    @auth
    Scenario: Reduces series using count
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2029-11-22T01:00:00.000Z",
                "end": "2029-11-22T04:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 4,
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
        When we get "/events"
        Then we get list with 4 items
        """
        {"_items": [
            {"_id": "#EVENT1._id#", "recurrence_id": "#EVENT1.recurrence_id#"},
            {"_id": "#EVENT2._id#", "recurrence_id": "#EVENT1.recurrence_id#"},
            {"_id": "#EVENT3._id#", "recurrence_id": "#EVENT1.recurrence_id#"},
            {"_id": "#EVENT4._id#", "recurrence_id": "#EVENT1.recurrence_id#"}
        ]}
        """
        When we post to "/events/#EVENT2._id#/lock" with success
        """
        {"lock_action": "update_repetitions"}
        """
        When we perform update_repetitions on events "#EVENT2._id#"
        """
        {
            "dates": {
                "start": "2029-11-23T01:00:00.000Z",
                "end": "2029-11-23T04:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 2,
                    "endRepeatMode": "count"
                }
            }
        }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 2 items
        """
        {"_items": [
            {
                "_id": "#EVENT1._id#",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2029-11-22T01:00:00+0000",
                    "end": "2029-11-22T04:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "DAILY",
                        "interval": 1,
                        "count": 2,
                        "endRepeatMode": "count"
                    }
                }
            }, {
                "_id": "#EVENT2._id#",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2029-11-23T01:00:00+0000",
                    "end": "2029-11-23T04:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "DAILY",
                        "interval": 1,
                        "count": 2,
                        "endRepeatMode": "count"
                    }
                }
            }
        ]}
        """

    @auth
    Scenario: Increases series using until
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2029-11-22T01:00:00.000Z",
                "end": "2029-11-22T04:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "until": "2029-11-25T01:00:00.000Z",
                    "endRepeatMode": "until"
                }
            }
        }]
        """
        Then we get OK response
        Then we store "EVENT1" with first item
        Then we store "EVENT2" with 2 item
        Then we store "EVENT3" with 3 item
        Then we store "EVENT4" with 4 item
        When we get "/events"
        Then we get list with 4 items
        """
        {"_items": [
            {"_id": "#EVENT1._id#", "recurrence_id": "#EVENT1.recurrence_id#"},
            {"_id": "#EVENT2._id#", "recurrence_id": "#EVENT1.recurrence_id#"},
            {"_id": "#EVENT3._id#", "recurrence_id": "#EVENT1.recurrence_id#"},
            {"_id": "#EVENT4._id#", "recurrence_id": "#EVENT1.recurrence_id#"}
        ]}
        """
        When we post to "/events/#EVENT2._id#/lock" with success
        """
        {"lock_action": "update_repetitions"}
        """
        When we perform update_repetitions on events "#EVENT2._id#"
        """
        {
            "dates": {
                "start": "2029-11-23T01:00:00.000Z",
                "end": "2029-11-23T04:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "until": "2029-11-27T01:00:00.000Z",
                    "endRepeatMode": "until",
                    "count": null
                }
            }
        }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 6 items
        """
        {"_items": [
            {
                "_id": "#EVENT1._id#",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2029-11-22T01:00:00+0000",
                    "end": "2029-11-22T04:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "DAILY",
                        "interval": 1,
                        "until": "2029-11-27T01:00:00+0000",
                        "endRepeatMode": "until"
                    }
                }
            }, {
                "_id": "#EVENT2._id#",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2029-11-23T01:00:00+0000",
                    "end": "2029-11-23T04:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "DAILY",
                        "interval": 1,
                        "until": "2029-11-27T01:00:00+0000",
                        "endRepeatMode": "until"
                    }
                }
            }, {
                "_id": "#EVENT3._id#",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2029-11-24T01:00:00+0000",
                    "end": "2029-11-24T04:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "DAILY",
                        "interval": 1,
                        "until": "2029-11-27T01:00:00+0000",
                        "endRepeatMode": "until"
                    }
                }
            }, {
                "_id": "#EVENT4._id#",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2029-11-25T01:00:00+0000",
                    "end": "2029-11-25T04:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "DAILY",
                        "interval": 1,
                        "until": "2029-11-27T01:00:00+0000",
                        "endRepeatMode": "until"
                    }
                }
            }, {
                "_id": "__any_value__",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2029-11-26T01:00:00+0000",
                    "end": "2029-11-26T04:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "DAILY",
                        "interval": 1,
                        "until": "2029-11-27T01:00:00+0000",
                        "endRepeatMode": "until"
                    }
                }
            }, {
                "_id": "__any_value__",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2029-11-27T01:00:00+0000",
                    "end": "2029-11-27T04:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "DAILY",
                        "interval": 1,
                        "until": "2029-11-27T01:00:00+0000",
                        "endRepeatMode": "until"
                    }
                }
            }
        ]}
        """

    @auth
    Scenario: Reduces series using count
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2029-11-22T01:00:00.000Z",
                "end": "2029-11-22T04:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "until": "2029-11-25T01:00:00.000Z",
                    "endRepeatMode": "until"
                }
            }
        }]
        """
        Then we get OK response
        Then we store "EVENT1" with first item
        Then we store "EVENT2" with 2 item
        Then we store "EVENT3" with 3 item
        Then we store "EVENT4" with 4 item
        When we get "/events"
        Then we get list with 4 items
        """
        {"_items": [
            {"_id": "#EVENT1._id#", "recurrence_id": "#EVENT1.recurrence_id#"},
            {"_id": "#EVENT2._id#", "recurrence_id": "#EVENT1.recurrence_id#"},
            {"_id": "#EVENT3._id#", "recurrence_id": "#EVENT1.recurrence_id#"},
            {"_id": "#EVENT4._id#", "recurrence_id": "#EVENT1.recurrence_id#"}
        ]}
        """
        When we post to "/events/#EVENT2._id#/lock" with success
        """
        {"lock_action": "update_repetitions"}
        """
        When we perform update_repetitions on events "#EVENT2._id#"
        """
        {
            "dates": {
                "start": "2029-11-23T01:00:00.000Z",
                "end": "2029-11-23T04:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "until": "2029-11-23T01:00:00.000Z",
                    "endRepeatMode": "until"
                }
            }
        }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 2 items
        """
        {"_items": [
            {
                "_id": "#EVENT1._id#",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2029-11-22T01:00:00+0000",
                    "end": "2029-11-22T04:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "DAILY",
                        "interval": 1,
                        "until": "2029-11-23T01:00:00+0000",
                        "endRepeatMode": "until"
                    }
                }
            }, {
                "_id": "#EVENT2._id#",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2029-11-23T01:00:00+0000",
                    "end": "2029-11-23T04:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "DAILY",
                        "interval": 1,
                        "until": "2029-11-23T01:00:00+0000",
                        "endRepeatMode": "until"
                    }
                }
            }
        ]}
        """

    @auth
    Scenario: Increases series from count to until
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2029-11-22T01:00:00.000Z",
                "end": "2029-11-22T04:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 4,
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
        When we get "/events"
        Then we get list with 4 items
        """
        {"_items": [
            {"_id": "#EVENT1._id#", "recurrence_id": "#EVENT1.recurrence_id#"},
            {"_id": "#EVENT2._id#", "recurrence_id": "#EVENT1.recurrence_id#"},
            {"_id": "#EVENT3._id#", "recurrence_id": "#EVENT1.recurrence_id#"},
            {"_id": "#EVENT4._id#", "recurrence_id": "#EVENT1.recurrence_id#"}
        ]}
        """
        When we post to "/events/#EVENT2._id#/lock" with success
        """
        {"lock_action": "update_repetitions"}
        """
        When we perform update_repetitions on events "#EVENT2._id#"
        """
        {
            "dates": {
                "start": "2029-11-23T01:00:00.000Z",
                "end": "2029-11-23T04:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "until": "2029-11-27T01:00:00.000Z",
                    "endRepeatMode": "until",
                    "count": null
                }
            }
        }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 6 items
        """
        {"_items": [
            {
                "_id": "#EVENT1._id#",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2029-11-22T01:00:00+0000",
                    "end": "2029-11-22T04:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "DAILY",
                        "interval": 1,
                        "count": "__none__",
                        "endRepeatMode": "until",
                        "until": "2029-11-27T01:00:00+0000"
                    }
                }
            }, {
                "_id": "#EVENT2._id#",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2029-11-23T01:00:00+0000",
                    "end": "2029-11-23T04:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "DAILY",
                        "interval": 1,
                        "count": "__none__",
                        "endRepeatMode": "until",
                        "until": "2029-11-27T01:00:00+0000"
                    }
                }
            }, {
                "_id": "#EVENT3._id#",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2029-11-24T01:00:00+0000",
                    "end": "2029-11-24T04:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "DAILY",
                        "interval": 1,
                        "count": "__none__",
                        "endRepeatMode": "until",
                        "until": "2029-11-27T01:00:00+0000"
                    }
                }
            }, {
                "_id": "#EVENT4._id#",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2029-11-25T01:00:00+0000",
                    "end": "2029-11-25T04:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "DAILY",
                        "interval": 1,
                        "count": "__none__",
                        "endRepeatMode": "until",
                        "until": "2029-11-27T01:00:00+0000"
                    }
                }
            }, {
                "_id": "__any_value__",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2029-11-26T01:00:00+0000",
                    "end": "2029-11-26T04:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "DAILY",
                        "interval": 1,
                        "count": "__none__",
                        "endRepeatMode": "until",
                        "until": "2029-11-27T01:00:00+0000"
                    }
                }
            }, {
                "_id": "__any_value__",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2029-11-27T01:00:00+0000",
                    "end": "2029-11-27T04:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "DAILY",
                        "interval": 1,
                        "count": "__none__",
                        "endRepeatMode": "until",
                        "until": "2029-11-27T01:00:00+0000"
                    }
                }
            }
        ]}
        """

    @auth
    Scenario: Increases series from until to count
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2029-11-22T01:00:00.000Z",
                "end": "2029-11-22T04:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "endRepeatMode": "until",
                    "until": "2029-11-25T01:00:00.000Z"
                }
            }
        }]
        """
        Then we get OK response
        Then we store "EVENT1" with first item
        Then we store "EVENT2" with 2 item
        Then we store "EVENT3" with 3 item
        Then we store "EVENT4" with 4 item
        When we get "/events"
        Then we get list with 4 items
        """
        {"_items": [
            {"_id": "#EVENT1._id#", "recurrence_id": "#EVENT1.recurrence_id#"},
            {"_id": "#EVENT2._id#", "recurrence_id": "#EVENT1.recurrence_id#"},
            {"_id": "#EVENT3._id#", "recurrence_id": "#EVENT1.recurrence_id#"},
            {"_id": "#EVENT4._id#", "recurrence_id": "#EVENT1.recurrence_id#"}
        ]}
        """
        When we post to "/events/#EVENT2._id#/lock" with success
        """
        {"lock_action": "update_repetitions"}
        """
        When we perform update_repetitions on events "#EVENT2._id#"
        """
        {
            "dates": {
                "start": "2029-11-23T01:00:00.000Z",
                "end": "2029-11-23T04:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "until": null,
                    "endRepeatMode": "count",
                    "count": 6
                }
            }
        }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 6 items
        """
        {"_items": [
            {
                "_id": "#EVENT1._id#",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2029-11-22T01:00:00+0000",
                    "end": "2029-11-22T04:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "DAILY",
                        "interval": 1,
                        "count": 6,
                        "endRepeatMode": "count",
                        "until": "__none__"
                    }
                }
            }, {
                "_id": "#EVENT2._id#",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2029-11-23T01:00:00+0000",
                    "end": "2029-11-23T04:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "DAILY",
                        "interval": 1,
                        "count": 6,
                        "endRepeatMode": "count",
                        "until": "__none__"
                    }
                }
            }, {
                "_id": "#EVENT3._id#",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2029-11-24T01:00:00+0000",
                    "end": "2029-11-24T04:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "DAILY",
                        "interval": 1,
                        "count": 6,
                        "endRepeatMode": "count",
                        "until": "__none__"
                    }
                }
            }, {
                "_id": "#EVENT4._id#",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2029-11-25T01:00:00+0000",
                    "end": "2029-11-25T04:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "DAILY",
                        "interval": 1,
                        "count": 6,
                        "endRepeatMode": "count",
                        "until": "__none__"
                    }
                }
            }, {
                "_id": "__any_value__",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2029-11-26T01:00:00+0000",
                    "end": "2029-11-26T04:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "DAILY",
                        "interval": 1,
                        "count": 6,
                        "endRepeatMode": "count",
                        "until": "__none__"
                    }
                }
            }, {
                "_id": "__any_value__",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2029-11-27T01:00:00+0000",
                    "end": "2029-11-27T04:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "DAILY",
                        "interval": 1,
                        "count": 6,
                        "endRepeatMode": "count",
                        "until": "__none__"
                    }
                }
            }
        ]}
        """

    @auth
    @vocabulary
    Scenario: Cancels Events that are in use
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2029-11-22T01:00:00.000Z",
                "end": "2029-11-22T04:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 8,
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
        Then we store "EVENT6" with 6 item
        Then we store "EVENT7" with 7 item
        Then we store "EVENT8" with 8 item
        When we get "/events"
        When we post to "/events/publish"
        """
        {"event": "#EVENT3._id#", "etag": "#EVENT3._etag#", "pubstatus": "usable"}
        """
        When we post to "/planning" with success
        """
        [{
            "slugline": "Friday Club",
            "headline": "Fourth Meeting",
            "event_item": "#EVENT4._id#"
        }]
        """
        When we post to "/events/#EVENT5._id#/lock" with success
        """
        {"lock_action": "cancel"}
        """
        When we perform cancel on events "#EVENT5._id#"
        Then we get OK response
        When we post to "/events/#EVENT6._id#/lock" with success
        """
        {"lock_action": "postpone"}
        """
        When we perform postpone on events "#EVENT6._id#"
        Then we get OK response
        When we spike events "#EVENT7._id#"
        Then we get OK response
        When we post to "/events/#EVENT2._id#/lock" with success
        """
        {"lock_action": "update_repetitions"}
        """
        When we perform update_repetitions on events "#EVENT2._id#"
        """
        {
            "dates": {
                "start": "2029-11-23T01:00:00.000Z",
                "end": "2029-11-23T04:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 2,
                    "endRepeatMode": "count"
                }
            }
        }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 4 items
        """
        {"_items": [
            {
                "_id": "#EVENT1._id#",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2029-11-22T01:00:00+0000",
                    "end": "2029-11-22T04:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "DAILY",
                        "interval": 1,
                        "count": 2,
                        "endRepeatMode": "count"
                    }
                },
                "state": "draft"
            }, {
                "_id": "#EVENT2._id#",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2029-11-23T01:00:00+0000",
                    "end": "2029-11-23T04:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "DAILY",
                        "interval": 1,
                        "count": 2,
                        "endRepeatMode": "count"
                    }
                },
                "state": "draft"
            }, {
                "_id": "#EVENT3._id#",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2029-11-24T01:00:00+0000",
                    "end": "2029-11-24T04:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "DAILY",
                        "interval": 1,
                        "count": 2,
                        "endRepeatMode": "count"
                    }
                },
                "state": "cancelled"
            }, {
                "_id": "#EVENT4._id#",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2029-11-25T01:00:00+0000",
                    "end": "2029-11-25T04:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "DAILY",
                        "interval": 1,
                        "count": 2,
                        "endRepeatMode": "count"
                    }
                },
                "state": "cancelled"
            }
        ]}
        """

    @auth
    Scenario: Can only be actioned on a series
        Given we have sessions "/sessions"
        Given "events"
        """
        [{
            "_id": "event1", "guid": "event1",
            "name": "TestEvent",
            "dates": {
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney"
            },
            "state": "draft",
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "update_repetitions",
            "lock_time": "#DATE#"
        }]
        """
        When we perform update_repetitions on events "event1"
        """
        {
            "dates": {
                "start": "2029-11-22T12:00:00.000Z",
                "end": "2029-11-22T14:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 4,
                    "endRepeatMode": "count"
                }
            }
        }
        """
        Then we get error 400
        """
        {"_issues": {"validator exception": "400: Not a series of recurring events"}, "_status": "ERR"}
        """

    @auth
    Scenario: Must provide dates and recurring rule in update
        Given we have sessions "/sessions"
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2099-11-21T12:00:00.000Z",
                "end": "2099-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 4,
                    "endRepeatMode": "count"
                }
            },
            "state": "draft"
        }]
        """
        Then we get OK response
        Then we store "EVENT1" with first item
        When we post to "/events/#EVENT1._id#/lock" with success
        """
        {"lock_action": "update_repetitions"}
        """
        When we perform update_repetitions on events "#EVENT1._id#"
        """
        {
            "dates": {
                "start": "2029-11-22T12:00:00.000Z",
                "end": "2029-11-22T14:00:00.000Z",
                "tz": "Australia/Sydney"
            }
        }
        """
        Then we get error 400
        """
        {"_issues": {"validator exception": "400: New recurring rules not provided"}, "_status": "ERR"}
        """
        When we perform update_repetitions on events "#EVENT1._id#"
        """
        {}
        """
        Then we get error 400
        """
        {"_issues": {"validator exception": "400: New recurring rules not provided"}, "_status": "ERR"}
        """

    @auth
    Scenario: Event must be locked to update repetitions of an Event
        Given we have sessions "/sessions"
        Given "events"
        """
        [{
            "_id": "event1",
            "guid": "event1",
            "dates": {
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney"
            }
        }, {
            "_id": "event2",
            "guid": "event2",
            "dates": {
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney"
            },
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "session123",
            "lock_action": "update_repetitions",
            "lock_time": "#DATE#"
        }, {
            "_id": "event3",
            "guid": "event3",
            "dates": {
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney"
            },
            "lock_user": "user123",
            "lock_session": "session456",
            "lock_action": "update_repetitions",
            "lock_time": "#DATE#"
        }, {
            "_id": "event4",
            "guid": "event4",
            "dates": {
                "start": "2029-11-21T12:00:00.000Z",
                "end": "2029-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney"
            },
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#",
            "lock_action": "edit",
            "lock_time": "#DATE#"
        }]
        """
        When we perform update_repetitions on events "event1"
        """
        {
            "dates": {
                "start": "2029-11-21T02:00:00.000Z",
                "end": "2029-11-21T04:00:00.000Z",
                "tz": "Australia/Sydney"
            }
        }
        """
        Then we get error 400
        """
        {"_issues": {"validator exception": "403: The event must be locked"}, "_status": "ERR"}
        """
        When we perform update_repetitions on events "event2"
        """
        {
            "dates": {
                "start": "2029-11-21T02:00:00.000Z",
                "end": "2029-11-21T04:00:00.000Z",
                "tz": "Australia/Sydney"
            }
        }
        """
        Then we get error 400
        """
        {"_issues": {"validator exception": "403: The event is locked by you in another session"}, "_status": "ERR"}
        """
        When we perform update_repetitions on events "event3"
        """
        {
            "dates": {
                "start": "2029-11-21T02:00:00.000Z",
                "end": "2029-11-21T04:00:00.000Z",
                "tz": "Australia/Sydney"
            }
        }
        """
        Then we get error 400
        """
        {"_issues": {"validator exception": "403: The event is locked by another user"}, "_status": "ERR"}
        """
        When we perform update_repetitions on events "event4"
        """
        {
            "dates": {
                "start": "2029-11-21T02:00:00.000Z",
                "end": "2029-11-21T04:00:00.000Z",
                "tz": "Australia/Sydney"
            }
        }
        """
        Then we get error 400
        """
        {"_issues": {"validator exception": "403: The lock must be for the `update repetitions` action"}, "_status": "ERR"}
        """
