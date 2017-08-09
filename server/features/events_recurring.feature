Feature: Events Recurring

    @auth
    @notification
    Scenario: Create new recurring events
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
        And we store "EVENT1" with first item
        And we store "EVENT2" with 2 item
        And we store "EVENT3" with 3 item
        And we get notifications
        """
        [{
            "event": "events:created:recurring",
            "extra": {
                "item": "#EVENT1.recurrence_id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        Then we get a list with 3 items
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
            }
        ]}
        """
        When we get "/events?source={"query":{"match":{"recurrence_id": "#EVENT1.recurrence_id#"}}}"
        Then we get list with 3 items
        When we get "/events_history"
        Then we get list with 3 items
        """
        {"_items": [
            {"operation": "create", "event_id": "#EVENT1._id#"},
            {"operation": "create", "event_id": "#EVENT2._id#"},
            {"operation": "create", "event_id": "#EVENT3._id#"}
        ]}
        """

    @auth
    @notification
    Scenario: Convert a single event to be a recurring event
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2019-11-21T12:00:00.000Z",
                "end": "2019-11-21T14:00:00.000Z"
            }
        }]
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:created",
            "extra": {
                "item": "#events._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        And we store "EVENT_ID" with value "#events._id#" to context
        When we reset notifications
        And we patch "/events/#EVENT_ID#"
        """
        {
            "name": "Weekly Friday Club",
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
        }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:updated:recurring",
            "extra": {
                "item": "#EVENT_ID#",
                "recurrence_id": "__any_value__",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        Then we store "NEW_RECURRING" from patch
        When we get "/events"
        Then we get list with 3 items
        """
        {"_items": [
            {
                "name": "Weekly Friday Club",
                "dates": {
                    "start": "2019-11-22T12:00:00+0000",
                    "end": "2019-11-22T14:00:00+0000"
                },
                "recurrence_id": "#NEW_RECURRING.recurrence_id#"
            }, {
                "name": "Weekly Friday Club",
                "dates": {
                    "start": "2019-11-29T12:00:00+0000",
                    "end": "2019-11-29T14:00:00+0000"
                },
                "recurrence_id": "#NEW_RECURRING.recurrence_id#"
            }, {
                "name": "Weekly Friday Club",
                "dates": {
                    "start": "2019-12-06T12:00:00+0000",
                    "end": "2019-12-06T14:00:00+0000"
                },
                "recurrence_id": "#NEW_RECURRING.recurrence_id#"
            }
        ]}
        """
        When we get "/events_history"
        Then we get list with 4 items
        """
        {"_items": [
            {"operation": "create", "event_id": "#EVENT_ID#"},
            {"operation": "update", "event_id": "#EVENT_ID#", "update": {
                "name": "Weekly Friday Club",
                "dates": {
                    "start": "2019-11-22T12:00:00+0000",
                    "end": "2019-11-22T14:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "count": 3,
                        "endRepeatMode": "count",
                        "until": null
                    }
                }
            }},
            {"operation": "create", "event_id": "__any_value__"},
            {"operation": "create", "event_id": "__any_value__"}
        ]}
        """

    @auth
    @notification
    Scenario: Remove recurring rule from an event isolates that event from the series
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
        When we patch "/events/#EVENT3._id#"
        """
        {
            "name": "Detached Friday Club",
            "dates": {
                "start": "#EVENT3.dates.start#",
                "end": "#EVENT3.dates.end#",
                "tz": "Australia/Sydney",
                "recurring_rule": null
            }
        }
        """
        Then we get OK response
        When we get "/events/#EVENT3._id#"
        Then we get existing resource
        """
            {
                "name": "Detached Friday Club",
                "dates": {
                    "start": "#EVENT3.dates.start#",
                    "end": "#EVENT3.dates.end#",
                    "tz": "Australia/Sydney",
                    "recurring_rule": null
                },
                "recurrence_id": null
            }
        """

    @auth
    @notification
    Scenario: Remove recurring rule from an event creates new recurrence series for future events
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
        When we patch "/events/#EVENT3._id#"
        """
        {
            "dates": {
                "start": "#EVENT3.dates.start#",
                "end": "#EVENT3.dates.end#",
                "tz": "Australia/Sydney",
                "recurring_rule": null
            }
        }
        """
        Then we get OK response
        When we get "/events/#EVENT4._id#"
        Then we get existing resource
        """
            {
                "name": "Friday Club",
                "dates": {
                    "start": "#EVENT4.dates.start#",
                    "end": "#EVENT4.dates.end#",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "count": 2,
                        "endRepeatMode": "count"
                    }
                },
                "recurrence_id": "__any_value__"
            }
        """
        When we get "/events/#EVENT5._id#"
        Then we get existing resource
        """
            {
                "name": "Friday Club",
                "dates": {
                    "start": "#EVENT5.dates.start#",
                    "end": "#EVENT5.dates.end#",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "count": 2,
                        "endRepeatMode": "count"
                    }
                },
                "recurrence_id": "__any_value__"
            }
        """


    @auth
    @notification
    Scenario: Remove recurring rule from an event ends original series at the last of the past events
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
        Then we get a list with 5 items
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

        When we patch "/events/#EVENT3._id#"
        """
        {
            "dates": {
                "start": "#EVENT3.dates.start#",
                "end": "#EVENT3.dates.end#",
                "tz": "Australia/Sydney",
                "recurring_rule": null
            }
        }
        """
        Then we get OK response
        When we get "/events/#EVENT1._id#"
        Then we get existing resource
        """
            {
                "name": "Friday Club",
                "dates": {
                    "start": "#EVENT1.dates.start#",
                    "end": "#EVENT1.dates.end#",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "count": null,
                        "endRepeatMode": "until",
                        "until": "#EVENT2.dates.start#"
                    }
                }
            }
        """
        When we get "/events/#EVENT2._id#"
        Then we get existing resource
        """
            {
                "name": "Friday Club",
                "dates": {
                    "start": "#EVENT2.dates.start#",
                    "end": "#EVENT2.dates.end#",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "count": null,
                        "endRepeatMode": "until",
                        "until": "#EVENT2.dates.start#"
                    }
                }
            }
        """

    @auth
    @notification
    Scenario: Updating recurring rule of only a single instance will not affect other events in series
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
        When we patch "/events/#EVENT1._id#"
        """
        {
            "dates": {
                "start": "#EVENT1.dates.start#",
                "end": "#EVENT1.dates.end#",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "WEEKLY",
                    "interval": 1,
                    "byday": "TU",
                    "count": 3,
                    "endRepeatMode": "count"
                }
            }
        }
        """
        Then we get OK response
        When we get "/events/#EVENT1._id#"
        Then we get existing resource
        """
            {
                "name": "Friday Club",
                "dates": {
                    "start": "2019-11-26T12:00:00+0000",
                    "end": "2019-11-26T14:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "TU",
                        "count": 3,
                        "endRepeatMode": "count"
                    }
                }
            }
        """
        When we get "/events/#EVENT2._id#"
        Then we get existing resource
        """
            {
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
            }
        """
        When we get "/events/#EVENT3._id#"
        Then we get existing resource
        """
            {
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
        """

    @auth
    @notification
    Scenario: Increase number of occurrences
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
        When we patch "/events/#EVENT1._id#"
        """
        {
            "dates": {
                "start": "2019-11-21T12:00:00.000Z",
                "end": "2019-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "WEEKLY",
                    "interval": 1,
                    "byday": "FR",
                    "count": 4,
                    "endRepeatMode": "count"
                }
            },
            "update_method": "all"
        }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 4 items
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
                        "count": 4,
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
                        "count": 4,
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
                        "count": 4,
                        "endRepeatMode": "count"
                    }
                }
            }, {
                "name": "Friday Club",
                "dates": {
                    "start": "2019-12-13T12:00:00+0000",
                    "end": "2019-12-13T14:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "count": 4,
                        "endRepeatMode": "count"
                    }
                }
            }
        ]}
        """
        When we get "/events_history"
        Then we get list with 7 items
        # There is a problem with the current implementation where
        # the event dates are changed from their original values
        # This is why __any_value__ is used for event_id in the following tests
        # Update these tests once this has been fixed
        """
        {"_items": [
            {"operation": "create", "event_id": "#EVENT1._id#"},
            {"operation": "create", "event_id": "#EVENT2._id#"},
            {"operation": "create", "event_id": "#EVENT3._id#"},
            {"operation": "update", "event_id": "__any_value__", "update": {
                "dates": {
                    "start": "2019-11-22T12:00:00+0000",
                    "end": "2019-11-22T14:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "count": 4,
                        "endRepeatMode": "count"
                    }
                }
            }},
            {"operation": "update", "event_id": "__any_value__", "update": {
                "dates": {
                    "start": "2019-11-29T12:00:00+0000",
                    "end": "2019-11-29T14:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "count": 4,
                        "endRepeatMode": "count"
                    }
                }
            }},
            {"operation": "update", "event_id": "__any_value__", "update": {
                "dates": {
                    "start": "2019-12-06T12:00:00+0000",
                    "end": "2019-12-06T14:00:00+0000",
                    "tz": "Australia/Sydney",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "count": 4,
                        "endRepeatMode": "count"
                    }
                }
            }},
            {"operation": "create", "event_id": "__any_value__"}
        ]}
        """
        And we get notifications
        """
        [{
            "event": "events:created:recurring",
            "extra": {
                "item": "#EVENT1.recurrence_id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }, {
            "event": "events:updated:recurring",
            "extra": {
                "item": "#EVENT1._id#",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """

    @auth
    Scenario: Spike single event from recurring series
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
            }
        }]
        """
        Then we get OK response
        Then we store "EVENT1" with first item
        Then we store "EVENT2" with 2 item
        Then we store "EVENT3" with 3 item
        Then we store "EVENT4" with 4 item
        When we spike events "#EVENT2._id#"
        """
        { "update_method": "single" }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 4 items
        """
        {"_items": [
            { "_id": "#EVENT1._id#", "state": "in_progress" },
            { "_id": "#EVENT2._id#", "state": "spiked" },
            { "_id": "#EVENT3._id#", "state": "in_progress" },
            { "_id": "#EVENT4._id#", "state": "in_progress" }
        ]}
        """

    @auth
    Scenario: Spike future events from recurring series
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
            }
        }]
        """
        Then we get OK response
        Then we store "EVENT1" with first item
        Then we store "EVENT2" with 2 item
        Then we store "EVENT3" with 3 item
        Then we store "EVENT4" with 4 item
        When we spike events "#EVENT2._id#"
        """
        { "update_method": "future" }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 4 items
        """
        {"_items": [
            { "_id": "#EVENT1._id#", "state": "in_progress" },
            { "_id": "#EVENT2._id#", "state": "spiked" },
            { "_id": "#EVENT3._id#", "state": "spiked" },
            { "_id": "#EVENT4._id#", "state": "spiked" }
        ]}
        """

    @auth
    Scenario: Spike all events from recurring series
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
            }
        }]
        """
        Then we get OK response
        Then we store "EVENT1" with first item
        Then we store "EVENT2" with 2 item
        Then we store "EVENT3" with 3 item
        Then we store "EVENT4" with 4 item
        When we spike events "#EVENT2._id#"
        """
        { "update_method": "all" }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 4 items
        """
        {"_items": [
            { "_id": "#EVENT1._id#", "state": "spiked" },
            { "_id": "#EVENT2._id#", "state": "spiked" },
            { "_id": "#EVENT3._id#", "state": "spiked" },
            { "_id": "#EVENT4._id#", "state": "spiked" }
        ]}
        """

    @auth
    Scenario: Spike all recurring doesnt spike historic events
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "#DATE-3#",
                "end": "#DATE-2#",
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
        When we spike events "#EVENT3._id#"
        """
        { "update_method": "all" }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 4 items
        """
        {"_items": [
            { "_id": "#EVENT1._id#", "state": "in_progress" },
            { "_id": "#EVENT2._id#", "state": "in_progress" },
            { "_id": "#EVENT3._id#", "state": "spiked" },
            { "_id": "#EVENT4._id#", "state": "spiked" }
        ]}
        """

    @auth
    @notification
    Scenario: Update metadata of single event in recurring series
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2099-11-21T12:00:00.000Z",
                "end": "2099-11-21T14:00:00.000Z",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
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
        And we get notifications
        """
        [{
            "event": "events:created:recurring",
            "extra": {
                "item": "#EVENT1.recurrence_id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we reset notifications
        And we patch "/events/#EVENT2._id#"
        """
        {
            "name": "Friday Club - altered",
            "definition_short": "Something different today"
        }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:updated:recurring",
            "extra": {
                "item": "#EVENT2._id#",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we get "/events"
        Then we get list with 3 items
        """
        {"_items": [
            { "_id": "#EVENT1._id#", "name": "Friday Club" },
            {
                "_id": "#EVENT2._id#",
                "name": "Friday Club - altered",
                "definition_short": "Something different today"
            },
            { "_id": "#EVENT3._id#", "name": "Friday Club" }

        ]}
        """
        When we get "/events_history"
        Then we get list with 4 items
        """
        {"_items": [
            {"operation": "create", "event_id": "#EVENT1._id#"},
            {"operation": "create", "event_id": "#EVENT2._id#"},
            {"operation": "create", "event_id": "#EVENT3._id#"},
            {"operation": "update", "event_id": "#EVENT2._id#", "update": {
                "name": "Friday Club - altered",
                "definition_short": "Something different today"
            }}
        ]}
        """

    @auth
    @notification
    Scenario: Update metadata of future events in recurring series
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2099-11-21T12:00:00.000Z",
                "end": "2099-11-21T14:00:00.000Z",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
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
        And we get notifications
        """
        [{
            "event": "events:created:recurring",
            "extra": {
                "item": "#EVENT1.recurrence_id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we reset notifications
        And we patch "/events/#EVENT2._id#"
        """
        {
            "name": "Friday Club - altered",
            "definition_short": "Something different today",
            "update_method": "future"
        }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:updated:recurring",
            "extra": {
                "item": "#EVENT2._id#",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we get "/events"
        Then we get list with 3 items
        """
        {"_items": [
            { "_id": "#EVENT1._id#", "name": "Friday Club" },
            {
                "_id": "#EVENT2._id#",
                "name": "Friday Club - altered",
                "definition_short": "Something different today"
            },
            {
                "_id": "#EVENT3._id#",
                "name": "Friday Club - altered",
                "definition_short": "Something different today"
            }
        ]}
        """
        When we get "/events_history"
        Then we get list with 5 items
        """
        {"_items": [
            {"operation": "create", "event_id": "#EVENT1._id#"},
            {"operation": "create", "event_id": "#EVENT2._id#"},
            {"operation": "create", "event_id": "#EVENT3._id#"},
            {"operation": "update", "event_id": "#EVENT2._id#", "update": {
                "name": "Friday Club - altered",
                "definition_short": "Something different today"
            }},
            {"operation": "update", "event_id": "#EVENT3._id#", "update": {
                "name": "Friday Club - altered",
                "definition_short": "Something different today"
            }}
        ]}
        """

    @auth
    @notification
    Scenario: Update metadata of all events in recurring series
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2099-11-21T12:00:00.000Z",
                "end": "2099-11-21T14:00:00.000Z",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
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
        And we get notifications
        """
        [{
            "event": "events:created:recurring",
            "extra": {
                "item": "#EVENT1.recurrence_id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we reset notifications
        And we patch "/events/#EVENT2._id#"
        """
        {
            "name": "Friday Club - altered",
            "definition_short": "Something different today",
            "update_method": "all"
        }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "events:updated:recurring",
            "extra": {
                "item": "#EVENT2._id#",
                "recurrence_id": "#EVENT1.recurrence_id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we get "/events"
        Then we get list with 3 items
        """
        {"_items": [
            {
                "_id": "#EVENT1._id#",
                "name": "Friday Club - altered",
                "definition_short": "Something different today"
            },
            {
                "_id": "#EVENT2._id#",
                "name": "Friday Club - altered",
                "definition_short": "Something different today"
            },
            {
                "_id": "#EVENT3._id#",
                "name": "Friday Club - altered",
                "definition_short": "Something different today"
            }
        ]}
        """
        When we get "/events_history"
        Then we get list with 6 items
        """
        {"_items": [
            {"operation": "create", "event_id": "#EVENT1._id#"},
            {"operation": "create", "event_id": "#EVENT2._id#"},
            {"operation": "create", "event_id": "#EVENT3._id#"},
            {"operation": "update", "event_id": "#EVENT1._id#", "update": {
                "name": "Friday Club - altered",
                "definition_short": "Something different today"
            }},
            {"operation": "update", "event_id": "#EVENT2._id#", "update": {
                "name": "Friday Club - altered",
                "definition_short": "Something different today"
            }},
            {"operation": "update", "event_id": "#EVENT3._id#", "update": {
                "name": "Friday Club - altered",
                "definition_short": "Something different today"
            }}
        ]}
        """

    @auth
    Scenario: Change occurrence day midway through event series
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2019-11-21T12:00:00.000Z",
                "end": "2019-11-21T14:00:00.000Z",
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
        When we patch "/events/#EVENT3._id#"
        """
        {
            "dates": {
                "start": "2019-12-06T12:00:00.000Z",
                "end": "2019-12-06T14:00:00.000Z",
                "recurring_rule": {
                    "frequency": "WEEKLY",
                    "interval": 1,
                    "byday": "WE",
                    "count": 5,
                    "endRepeatMode": "count"
                }
            },
            "update_method": "future"
        }
        """
        Then we get OK response
        Then we store "NEW_RECURRING" from patch
        When we get "/events"
        Then we get list with 5 items
        """
        {"_items": [
            {
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2019-11-22T12:00:00+0000",
                    "end": "2019-11-22T14:00:00+0000",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "endRepeatMode": "until",
                        "until": "2019-11-29T12:00:00+0000"
                    }
                }
            },
            {
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2019-11-29T12:00:00+0000",
                    "end": "2019-11-29T14:00:00+0000",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "endRepeatMode": "until",
                        "until": "2019-11-29T12:00:00+0000"
                    }
                }
            },
            {
                "recurrence_id": "#NEW_RECURRING.recurrence_id#",
                "previous_recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2019-12-11T12:00:00+0000",
                    "end": "2019-12-11T14:00:00+0000",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "WE",
                        "count": 3,
                        "endRepeatMode": "count"
                    }
                }
            },
            {
                "recurrence_id": "#NEW_RECURRING.recurrence_id#",
                "previous_recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2019-12-18T12:00:00+0000",
                    "end": "2019-12-18T14:00:00+0000",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "WE",
                        "count": 3,
                        "endRepeatMode": "count"
                    }
                }
            },
            {
                "recurrence_id": "#NEW_RECURRING.recurrence_id#",
                "previous_recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2019-12-25T12:00:00+0000",
                    "end": "2019-12-25T14:00:00+0000",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "WE",
                        "count": 3,
                        "endRepeatMode": "count"
                    }
                }
            }
        ]}
        """

    @auth
    Scenario: Modifying recurring rules spikes events with planning items
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "slugline": "Weekly Meetings",
            "dates": {
                "start": "2019-11-21T12:00:00.000Z",
                "end": "2019-11-21T14:00:00.000Z",
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
        When we post to "/events/publish"
        """
        {"event": "#EVENT4._id#", "etag": "#EVENT4._etag#", "pubstatus": "usable"}
        """
        Then we get OK response
        When we post to "planning"
        """
        [{
            "slugline": "Weekly Meetings",
            "headline": "Friday Club",
            "event_item": "#EVENT5._id#"
        }]
        """
        Then we get OK response
        When we patch "/events/#EVENT3._id#"
        """
        {
            "dates": {
                "start": "2019-12-06T12:00:00.000Z",
                "end": "2019-12-06T14:00:00.000Z",
                "recurring_rule": {
                    "frequency": "WEEKLY",
                    "interval": 1,
                    "byday": "WE",
                    "count": 5,
                    "endRepeatMode": "count"
                }
            },
            "update_method": "future"
        }
        """
        Then we get OK response
        Then we store "NEW_RECURRING" from patch
        When we get "/events"
        Then we get list with 7 items
        """
        {"_items": [
            {
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2019-11-22T12:00:00+0000",
                    "end": "2019-11-22T14:00:00+0000",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "endRepeatMode": "until",
                        "until": "2019-11-29T12:00:00+0000"
                    }
                },
                "state": "in_progress"
            },
            {
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2019-11-29T12:00:00+0000",
                    "end": "2019-11-29T14:00:00+0000",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "endRepeatMode": "until",
                        "until": "2019-11-29T12:00:00+0000"
                    }
                },
                "state": "in_progress"
            },
            {
                "recurrence_id": "#NEW_RECURRING.recurrence_id#",
                "previous_recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2019-12-11T12:00:00+0000",
                    "end": "2019-12-11T14:00:00+0000",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "WE",
                        "count": 3,
                        "endRepeatMode": "count"
                    }
                },
                "state": "in_progress"
            },
            {
                "recurrence_id": "#NEW_RECURRING.recurrence_id#",
                "previous_recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2019-12-18T12:00:00+0000",
                    "end": "2019-12-18T14:00:00+0000",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "WE",
                        "count": 3,
                        "endRepeatMode": "count"
                    }
                },
                "state": "in_progress"
            },
            {
                "recurrence_id": "#NEW_RECURRING.recurrence_id#",
                "previous_recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2019-12-25T12:00:00+0000",
                    "end": "2019-12-25T14:00:00+0000",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "WE",
                        "count": 3,
                        "endRepeatMode": "count"
                    }
                },
                "state": "in_progress"
            },
            {
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2019-12-13T12:00:00+0000",
                    "end": "2019-12-13T14:00:00+0000",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "count": 5,
                        "endRepeatMode": "count"
                    }
                },
                "state": "spiked"
            },
            {
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2019-12-20T12:00:00+0000",
                    "end": "2019-12-20T14:00:00+0000",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "FR",
                        "count": 5,
                        "endRepeatMode": "count"
                    }
                },
                "state": "spiked"
            }
        ]}
        """
        When we get "/planning"
        Then we get list with 1 items
        """
        {"_items": [{
            "slugline": "Weekly Meetings",
            "headline": "Friday Club",
            "event_item": "#EVENT5._id#",
            "state": "spiked"
        }]}
        """

    @auth
    Scenario: Modifying recurring rules for all events doesnt change recurrence_id
        When we post to "events"
        """
        [{
            "name": "Friday Club",
            "dates": {
                "start": "2019-11-21T12:00:00.000Z",
                "end": "2019-11-21T14:00:00.000Z",
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
        When we patch "/events/#EVENT3._id#"
        """
        {
            "dates": {
                "start": "2019-12-06T12:00:00.000Z",
                "end": "2019-12-06T14:00:00.000Z",
                "recurring_rule": {
                    "frequency": "WEEKLY",
                    "interval": 1,
                    "byday": "WE",
                    "count": 5,
                    "endRepeatMode": "count"
                }
            },
            "update_method": "all"
        }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 5 items
        """
        {"_items": [
            {
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2019-11-27T12:00:00+0000",
                    "end": "2019-11-27T14:00:00+0000",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "WE",
                        "count": 5,
                        "endRepeatMode": "count"
                    }
                }
            },
            {
                "recurrence_id": "#EVENT1.recurrence_id#",
                "dates": {
                    "start": "2019-12-04T12:00:00+0000",
                    "end": "2019-12-04T14:00:00+0000",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "WE",
                        "count": 5,
                        "endRepeatMode": "count"
                    }
                }
            },
            {
                "recurrence_id": "#EVENT1.recurrence_id#",
                "previous_recurrence_id": "__no_value__",
                "dates": {
                    "start": "2019-12-11T12:00:00+0000",
                    "end": "2019-12-11T14:00:00+0000",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "WE",
                        "count": 5,
                        "endRepeatMode": "count"
                    }
                }
            },
            {
                "recurrence_id": "#EVENT1.recurrence_id#",
                "previous_recurrence_id": "__no_value__",
                "dates": {
                    "start": "2019-12-18T12:00:00+0000",
                    "end": "2019-12-18T14:00:00+0000",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "WE",
                        "count": 5,
                        "endRepeatMode": "count"
                    }
                }
            },
            {
                "recurrence_id": "#EVENT1.recurrence_id#",
                "previous_recurrence_id": "__no_value__",
                "dates": {
                    "start": "2019-12-25T12:00:00+0000",
                    "end": "2019-12-25T14:00:00+0000",
                    "recurring_rule": {
                        "frequency": "WEEKLY",
                        "interval": 1,
                        "byday": "WE",
                        "count": 5,
                        "endRepeatMode": "count"
                    }
                }
            }
        ]}
        """
