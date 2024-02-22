Feature: Recurring Events & Planning
    Background: Initial setup
        When we post to "/events"
        """
        [{
            "name": "Daily Club",
            "dates": {
                "start": "2024-11-21T12:00:00.000Z",
                "end": "2024-11-21T14:00:00.000Z",
                "tz": "Australia/Sydney",
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
        When we get "/events"
        Then we get list with 3 items
        """
        {"_items": [{
            "_id": "#EVENT1._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "name": "Daily Club",
            "dates": {"start": "2024-11-21T12:00:00+0000", "end": "2024-11-21T14:00:00+0000"}
        }, {
            "_id": "#EVENT2._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "name": "Daily Club",
            "dates": {"start": "2024-11-22T12:00:00+0000", "end": "2024-11-22T14:00:00+0000"}
        }, {
            "_id": "#EVENT3._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "name": "Daily Club",
            "dates": {"start": "2024-11-23T12:00:00+0000", "end": "2024-11-23T14:00:00+0000"}
        }]}
        """
        When we post to "/planning?add_to_series=true"
        """
        [{
            "event_item": "#EVENT1._id#",
            "planning_date": "2024-11-21T12:00:00.000Z",
            "coverages": [{
                "workflow_status": "draft",
                "news_coverage_status": {"qcode": "ncostat:int"},
                "planning": {
                    "slugline": "test text slugline",
                    "g2_content_type": "text",
                    "scheduled": "2024-11-21T15:00:00.000Z"
                }
            }, {
                "workflow_status": "draft",
                "news_coverage_status": {"qcode": "ncostat:int"},
                "planning": {
                    "slugline": "test pic slugline",
                    "g2_content_type": "picture",
                    "scheduled": "2024-11-21T16:00:00.000Z"
                }
            }]
        }]
        """
        Then we get OK response
        And we store "PLAN1" with first item
        And we store "PLAN2" with 2 item
        And we store "PLAN3" with 3 item
        And we store coverage id in "TEXT_COVERAGE_1_ID" from plan 0 coverage 0
        And we store coverage id in "PIC_COVERAGE_1_ID" from plan 0 coverage 1
        And we store coverage id in "TEXT_COVERAGE_2_ID" from plan 1 coverage 0
        And we store coverage id in "PIC_COVERAGE_2_ID" from plan 1 coverage 1
        And we store coverage id in "TEXT_COVERAGE_3_ID" from plan 2 coverage 0
        And we store coverage id in "PIC_COVERAGE_3_ID" from plan 2 coverage 1

    @auth
    Scenario: Update all items and metadata in Planning series
        When we get "/planning"
        Then we get list with 3 items
        """
        {"_items": [{
            "guid": "#PLAN1._id#",
            "type": "planning",
            "planning_date": "2024-11-21T12:00:00+0000",
            "event_item": "#EVENT1._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "planning_recurrence_id": "#PLAN1.planning_recurrence_id#",
            "coverages": [
                {
                    "coverage_id": "#TEXT_COVERAGE_1_ID#",
                    "original_coverage_id": "#TEXT_COVERAGE_1_ID#",
                    "planning": {
                        "g2_content_type": "text",
                        "slugline": "test text slugline",
                        "scheduled": "2024-11-21T15:00:00+0000"
                    }
                },
                {
                    "coverage_id": "#PIC_COVERAGE_1_ID#",
                    "original_coverage_id": "#PIC_COVERAGE_1_ID#",
                    "planning": {
                        "g2_content_type": "picture",
                        "slugline": "test pic slugline",
                        "scheduled": "2024-11-21T16:00:00+0000"
                    }
                }
            ]
        }, {
            "guid": "#PLAN2._id#",
            "type": "planning",
            "planning_date": "2024-11-22T12:00:00+0000",
            "event_item": "#EVENT2._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "planning_recurrence_id": "#PLAN1.planning_recurrence_id#",
            "coverages": [
                {
                    "coverage_id": "#TEXT_COVERAGE_2_ID#",
                    "original_coverage_id": "#TEXT_COVERAGE_1_ID#",
                    "planning": {
                        "g2_content_type": "text",
                        "slugline": "test text slugline",
                        "scheduled": "2024-11-22T15:00:00+0000"
                    }
                },
                {
                    "coverage_id": "#PIC_COVERAGE_2_ID#",
                    "original_coverage_id": "#PIC_COVERAGE_1_ID#",
                    "planning": {
                        "g2_content_type": "picture",
                        "slugline": "test pic slugline",
                        "scheduled": "2024-11-22T16:00:00+0000"
                    }
                }
            ]
        }, {
            "guid": "#PLAN3._id#",
            "type": "planning",
            "planning_date": "2024-11-23T12:00:00+0000",
            "event_item": "#EVENT3._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "planning_recurrence_id": "#PLAN1.planning_recurrence_id#",
            "coverages": [
                {
                    "coverage_id": "#TEXT_COVERAGE_3_ID#",
                    "original_coverage_id": "#TEXT_COVERAGE_1_ID#",
                    "planning": {
                        "g2_content_type": "text",
                        "slugline": "test text slugline",
                        "scheduled": "2024-11-23T15:00:00+0000"
                    }
                },
                {
                    "coverage_id": "#PIC_COVERAGE_3_ID#",
                    "original_coverage_id": "#PIC_COVERAGE_1_ID#",
                    "planning": {
                        "g2_content_type": "picture",
                        "slugline": "test pic slugline",
                        "scheduled": "2024-11-23T16:00:00+0000"
                    }
                }
            ]
        }]}
        """
        When we patch "/planning/#PLAN2._id#"
        """
        {
            "update_method": "all",
            "planning_date": "2024-11-22T14:00:00+0000",
            "coverages": [
                {
                    "coverage_id": "#TEXT_COVERAGE_2_ID#",
                    "original_coverage_id": "#TEXT_COVERAGE_1_ID#",
                    "workflow_status": "draft",
                    "news_coverage_status": {"qcode": "ncostat:int"},
                    "planning": {
                        "slugline": "test text slugline v2",
                        "g2_content_type": "text",
                        "scheduled": "2024-11-22T15:00:00.000Z"
                    }
                },
                {
                    "coverage_id": "#PIC_COVERAGE_2_ID#",
                    "original_coverage_id": "#PIC_COVERAGE_1_ID#",
                    "workflow_status": "draft",
                    "news_coverage_status": {"qcode": "ncostat:int"},
                    "planning": {
                        "slugline": "test pic slugline v2",
                        "g2_content_type": "picture",
                        "scheduled": "2024-11-22T16:00:00.000Z"
                    }
                }
            ]
        }
        """
        Then we get OK response
        When we get "/planning"
        Then we get list with 3 items
        """
        {"_items": [{
            "guid": "#PLAN1._id#",
            "planning_date": "2024-11-21T14:00:00+0000",
            "coverages": [
                {
                    "coverage_id": "#TEXT_COVERAGE_1_ID#",
                    "original_coverage_id": "#TEXT_COVERAGE_1_ID#",
                    "planning": {
                        "slugline": "test text slugline v2",
                        "scheduled": "2024-11-21T15:00:00+0000"
                    }
                },
                {
                    "coverage_id": "#PIC_COVERAGE_1_ID#",
                    "original_coverage_id": "#PIC_COVERAGE_1_ID#",
                    "planning": {
                        "slugline": "test pic slugline v2",
                        "scheduled": "2024-11-21T16:00:00+0000"
                    }
                }
            ]
        }, {
            "guid": "#PLAN2._id#",
            "planning_date": "2024-11-22T14:00:00+0000",
            "coverages": [
                {
                    "coverage_id": "#TEXT_COVERAGE_2_ID#",
                    "original_coverage_id": "#TEXT_COVERAGE_1_ID#",
                    "planning": {
                        "slugline": "test text slugline v2",
                        "scheduled": "2024-11-22T15:00:00+0000"
                    }
                },
                {
                    "coverage_id": "#PIC_COVERAGE_2_ID#",
                    "original_coverage_id": "#PIC_COVERAGE_1_ID#",
                    "planning": {
                        "slugline": "test pic slugline v2",
                        "scheduled": "2024-11-22T16:00:00+0000"
                    }
                }
            ]
        }, {
            "guid": "#PLAN3._id#",
            "planning_date": "2024-11-23T14:00:00+0000",
            "coverages": [
                {
                    "coverage_id": "#TEXT_COVERAGE_3_ID#",
                    "original_coverage_id": "#TEXT_COVERAGE_1_ID#",
                    "planning": {
                        "slugline": "test text slugline v2",
                        "scheduled": "2024-11-23T15:00:00+0000"
                    }
                },
                {
                    "coverage_id": "#PIC_COVERAGE_3_ID#",
                    "original_coverage_id": "#PIC_COVERAGE_1_ID#",
                    "planning": {
                        "slugline": "test pic slugline v2",
                        "scheduled": "2024-11-23T16:00:00+0000"
                    }
                }
            ]
        }]}
        """
        When we patch "/events/#EVENT2._id#"
        """
        {
            "name": "Daily Club v2",
            "update_method": "all",
            "embedded_planning": [
                {
                    "planning_id": "#PLAN2._id#",
                    "update_method": "all",
                    "coverages": [
                        {
                            "coverage_id": "#TEXT_COVERAGE_2_ID#",
                            "slugline": "test text slugline v3",
                            "scheduled": "2024-11-22T17:00:00+0000"
                        },
                        {
                            "coverage_id": "#PIC_COVERAGE_2_ID#",
                            "slugline": "test pic slugline v3",
                            "scheduled": "2024-11-22T18:00:00+0000"
                        }
                    ]
                }
            ]
        }
        """
        Then we get OK response
        When we get "/events"
        Then we get list with 3 items
        """
        {"_items": [{
            "_id": "#EVENT1._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "name": "Daily Club v2",
            "dates": {"start": "2024-11-21T12:00:00+0000", "end": "2024-11-21T14:00:00+0000"}
        }, {
            "_id": "#EVENT2._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "name": "Daily Club v2",
            "dates": {"start": "2024-11-22T12:00:00+0000", "end": "2024-11-22T14:00:00+0000"}
        }, {
            "_id": "#EVENT3._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "name": "Daily Club v2",
            "dates": {"start": "2024-11-23T12:00:00+0000", "end": "2024-11-23T14:00:00+0000"}
        }]}
        """
        When we get "/planning"
        Then we get list with 3 items
        """
        {"_items": [{
            "guid": "#PLAN1._id#",
            "coverages": [
                {
                    "coverage_id": "#TEXT_COVERAGE_1_ID#",
                    "planning": {
                        "slugline": "test text slugline v3",
                        "scheduled": "2024-11-21T17:00:00+0000"
                    }
                },
                {
                    "coverage_id": "#PIC_COVERAGE_1_ID#",
                    "planning": {
                        "slugline": "test pic slugline v3",
                        "scheduled": "2024-11-21T18:00:00+0000"
                    }
                }
            ]
        }, {
            "guid": "#PLAN2._id#",
            "coverages": [
                {
                    "coverage_id": "#TEXT_COVERAGE_2_ID#",
                    "original_coverage_id": "#TEXT_COVERAGE_1_ID#",
                    "planning": {
                        "slugline": "test text slugline v3",
                        "scheduled": "2024-11-22T17:00:00+0000"
                    }
                },
                {
                    "coverage_id": "#PIC_COVERAGE_2_ID#",
                    "original_coverage_id": "#PIC_COVERAGE_1_ID#",
                    "planning": {
                        "slugline": "test pic slugline v3",
                        "scheduled": "2024-11-22T18:00:00+0000"
                    }
                }
            ]
        }, {
            "guid": "#PLAN3._id#",
            "coverages": [
                {
                    "coverage_id": "#TEXT_COVERAGE_3_ID#",
                    "original_coverage_id": "#TEXT_COVERAGE_1_ID#",
                    "planning": {
                        "slugline": "test text slugline v3",
                        "scheduled": "2024-11-23T17:00:00+0000"
                    }
                },
                {
                    "coverage_id": "#PIC_COVERAGE_3_ID#",
                    "original_coverage_id": "#PIC_COVERAGE_1_ID#",
                    "planning": {
                        "slugline": "test pic slugline v3",
                        "scheduled": "2024-11-23T18:00:00+0000"
                    }
                }
            ]
        }]}
        """

    @auth
    Scenario: Update single item in Planning series
        When we patch "/planning/#PLAN2._id#"
        """
        {
            "update_method": "single",
            "planning_date": "2024-11-22T14:00:00+0000",
            "coverages": [
                {
                    "coverage_id": "#TEXT_COVERAGE_2_ID#",
                    "original_coverage_id": "#TEXT_COVERAGE_1_ID#",
                    "workflow_status": "draft",
                    "news_coverage_status": {"qcode": "ncostat:int"},
                    "planning": {
                        "slugline": "test text slugline v2",
                        "g2_content_type": "text",
                        "scheduled": "2024-11-22T17:00:00.000Z"
                    }
                },
                {
                    "coverage_id": "#PIC_COVERAGE_2_ID#",
                    "original_coverage_id": "#PIC_COVERAGE_1_ID#",
                    "workflow_status": "draft",
                    "news_coverage_status": {"qcode": "ncostat:int"},
                    "planning": {
                        "slugline": "test pic slugline v2",
                        "g2_content_type": "picture",
                        "scheduled": "2024-11-22T18:00:00.000Z"
                    }
                }
            ]
        }
        """
        Then we get OK response
        When we get "/planning"
        Then we get list with 3 items
        """
        {"_items": [{
            "guid": "#PLAN1._id#",
            "planning_date": "2024-11-21T12:00:00+0000",
            "coverages": [
                {
                    "coverage_id": "#TEXT_COVERAGE_1_ID#",
                    "planning": {
                        "slugline": "test text slugline",
                        "scheduled": "2024-11-21T15:00:00+0000"
                    }
                },
                {
                    "coverage_id": "#PIC_COVERAGE_1_ID#",
                    "planning": {
                        "slugline": "test pic slugline",
                        "scheduled": "2024-11-21T16:00:00+0000"
                    }
                }
            ]
        }, {
            "guid": "#PLAN2._id#",
            "planning_date": "2024-11-22T14:00:00+0000",
            "coverages": [
                {
                    "coverage_id": "#TEXT_COVERAGE_2_ID#",
                    "original_coverage_id": "#TEXT_COVERAGE_1_ID#",
                    "planning": {
                        "slugline": "test text slugline v2",
                        "scheduled": "2024-11-22T17:00:00+0000"
                    }
                },
                {
                    "coverage_id": "#PIC_COVERAGE_2_ID#",
                    "original_coverage_id": "#PIC_COVERAGE_1_ID#",
                    "planning": {
                        "slugline": "test pic slugline v2",
                        "scheduled": "2024-11-22T18:00:00+0000"
                    }
                }
            ]
        }, {
            "guid": "#PLAN3._id#",
            "planning_date": "2024-11-23T12:00:00+0000",
            "coverages": [
                {
                    "coverage_id": "#TEXT_COVERAGE_3_ID#",
                    "original_coverage_id": "#TEXT_COVERAGE_1_ID#",
                    "planning": {
                        "slugline": "test text slugline",
                        "scheduled": "2024-11-23T15:00:00+0000"
                    }
                },
                {
                    "coverage_id": "#PIC_COVERAGE_3_ID#",
                    "original_coverage_id": "#PIC_COVERAGE_1_ID#",
                    "planning": {
                        "slugline": "test pic slugline",
                        "scheduled": "2024-11-23T16:00:00+0000"
                    }
                }
            ]
        }]}
        """

    @auth
    Scenario: Update future items in Planning series
        When we patch "/planning/#PLAN2._id#"
        """
        {
            "update_method": "future",
            "planning_date": "2024-11-22T14:00:00+0000",
            "coverages": [
                {
                    "coverage_id": "#TEXT_COVERAGE_2_ID#",
                    "original_coverage_id": "#TEXT_COVERAGE_1_ID#",
                    "workflow_status": "draft",
                    "news_coverage_status": {"qcode": "ncostat:int"},
                    "planning": {
                        "slugline": "test text slugline v2",
                        "g2_content_type": "text",
                        "scheduled": "2024-11-22T17:00:00.000Z"
                    }
                },
                {
                    "coverage_id": "#PIC_COVERAGE_2_ID#",
                    "original_coverage_id": "#PIC_COVERAGE_1_ID#",
                    "workflow_status": "draft",
                    "news_coverage_status": {"qcode": "ncostat:int"},
                    "planning": {
                        "slugline": "test pic slugline v2",
                        "g2_content_type": "picture",
                        "scheduled": "2024-11-22T18:00:00.000Z"
                    }
                }
            ]
        }
        """
        Then we get OK response
        When we get "/planning"
        Then we get list with 3 items
        """
        {"_items": [{
            "guid": "#PLAN1._id#",
            "planning_date": "2024-11-21T12:00:00+0000",
            "coverages": [
                {
                    "coverage_id": "#TEXT_COVERAGE_1_ID#",
                    "planning": {
                        "slugline": "test text slugline",
                        "scheduled": "2024-11-21T15:00:00+0000"
                    }
                },
                {
                    "coverage_id": "#PIC_COVERAGE_1_ID#",
                    "planning": {
                        "slugline": "test pic slugline",
                        "scheduled": "2024-11-21T16:00:00+0000"
                    }
                }
            ]
        }, {
            "guid": "#PLAN2._id#",
            "planning_date": "2024-11-22T14:00:00+0000",
            "coverages": [
                {
                    "coverage_id": "#TEXT_COVERAGE_2_ID#",
                    "original_coverage_id": "#TEXT_COVERAGE_1_ID#",
                    "planning": {
                        "slugline": "test text slugline v2",
                        "scheduled": "2024-11-22T17:00:00+0000"
                    }
                },
                {
                    "coverage_id": "#PIC_COVERAGE_2_ID#",
                    "original_coverage_id": "#PIC_COVERAGE_1_ID#",
                    "planning": {
                        "slugline": "test pic slugline v2",
                        "scheduled": "2024-11-22T18:00:00+0000"
                    }
                }
            ]
        }, {
            "guid": "#PLAN3._id#",
            "planning_date": "2024-11-23T14:00:00+0000",
            "coverages": [
                {
                    "coverage_id": "#TEXT_COVERAGE_3_ID#",
                    "original_coverage_id": "#TEXT_COVERAGE_1_ID#",
                    "planning": {
                        "slugline": "test text slugline v2",
                        "scheduled": "2024-11-23T17:00:00+0000"
                    }
                },
                {
                    "coverage_id": "#PIC_COVERAGE_3_ID#",
                    "original_coverage_id": "#PIC_COVERAGE_1_ID#",
                    "planning": {
                        "slugline": "test pic slugline v2",
                        "scheduled": "2024-11-23T18:00:00+0000"
                    }
                }
            ]
        }]}
        """

    @auth
    Scenario: Can add new coverages to Planning series
        When we patch "/events/#EVENT3._id#"
        """
        {
            "update_method": "all",
            "embedded_planning": [
                {
                    "planning_id": "#PLAN3._id#",
                    "update_method": "all",
                    "coverages": [
                        {"coverage_id": "#TEXT_COVERAGE_3_ID#"},
                        {"coverage_id": "#PIC_COVERAGE_3_ID#"},
                        {
                            "g2_content_type": "video",
                            "slugline": "test video slugline",
                            "scheduled": "2024-11-23T19:00:00+0000",
                            "news_coverage_status": "ncostat:onreq"
                        }
                    ]
                }
            ]
        }
        """
        When we get "/planning"
        Then we get list with 3 items
        """
        {"_items": [{
            "guid": "#PLAN1._id#",
            "type": "planning",
            "planning_date": "2024-11-21T12:00:00+0000",
            "event_item": "#EVENT1._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "planning_recurrence_id": "#PLAN1.planning_recurrence_id#",
            "coverages": [
                {
                    "coverage_id": "#TEXT_COVERAGE_1_ID#",
                    "original_coverage_id": "#TEXT_COVERAGE_1_ID#",
                    "planning": {"g2_content_type": "text"},
                    "news_coverage_status": {"qcode": "ncostat:int"}
                },
                {
                    "coverage_id": "#PIC_COVERAGE_1_ID#",
                    "original_coverage_id": "#PIC_COVERAGE_1_ID#",
                    "planning": {"g2_content_type": "picture"},
                    "news_coverage_status": {"qcode": "ncostat:int"}
                },
                {
                    "planning": {
                        "g2_content_type": "video",
                        "slugline": "test video slugline",
                        "scheduled": "2024-11-21T19:00:00+0000"
                    },
                    "news_coverage_status": {"qcode": "ncostat:onreq"}
                }
            ]
        }, {
            "guid": "#PLAN2._id#",
            "type": "planning",
            "planning_date": "2024-11-22T12:00:00+0000",
            "event_item": "#EVENT2._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "planning_recurrence_id": "#PLAN1.planning_recurrence_id#",
            "coverages": [
                {
                    "coverage_id": "#TEXT_COVERAGE_2_ID#",
                    "original_coverage_id": "#TEXT_COVERAGE_1_ID#",
                    "planning": {"g2_content_type": "text"},
                    "news_coverage_status": {"qcode": "ncostat:int"}
                },
                {
                    "coverage_id": "#PIC_COVERAGE_2_ID#",
                    "original_coverage_id": "#PIC_COVERAGE_1_ID#",
                    "planning": {"g2_content_type": "picture"},
                    "news_coverage_status": {"qcode": "ncostat:int"}
                },
                {
                    "planning": {
                        "g2_content_type": "video",
                        "slugline": "test video slugline",
                        "scheduled": "2024-11-22T19:00:00+0000"
                    },
                    "news_coverage_status": {"qcode": "ncostat:onreq"}
                }
            ]
        }, {
            "guid": "#PLAN3._id#",
            "type": "planning",
            "planning_date": "2024-11-23T12:00:00+0000",
            "event_item": "#EVENT3._id#",
            "recurrence_id": "#EVENT1.recurrence_id#",
            "planning_recurrence_id": "#PLAN1.planning_recurrence_id#",
            "coverages": [
                {
                    "coverage_id": "#TEXT_COVERAGE_3_ID#",
                    "original_coverage_id": "#TEXT_COVERAGE_1_ID#",
                    "planning": {"g2_content_type": "text"},
                    "news_coverage_status": {"qcode": "ncostat:int"}
                },
                {
                    "coverage_id": "#PIC_COVERAGE_3_ID#",
                    "original_coverage_id": "#PIC_COVERAGE_1_ID#",
                    "planning": {"g2_content_type": "picture"},
                    "news_coverage_status": {"qcode": "ncostat:int"}
                },
                {
                    "planning": {
                        "g2_content_type": "video",
                        "slugline": "test video slugline",
                        "scheduled": "2024-11-23T19:00:00+0000"
                    },
                    "news_coverage_status": {"qcode": "ncostat:onreq"}
                }
            ]
        }]}
        """
