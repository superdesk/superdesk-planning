Feature: Post Planning

    @auth
    Scenario: Post Planning
        When we post to "agenda"
        """
        [{
            "name": "TestAgenda"
        }]
        """
        When we post to "/planning"
        """
        [{
            "headline": "test headline",
            "slugline": "test slugline",
            "agendas": ["#agenda._id#"],
            "guid": "123",
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
                        "slugline": "test slugline",
                        "g2_content_type" : "text"
                    }
                }
            ],
            "planning_date": "2016-01-02"
        }
        """
        And we save etag
        Then we get OK response
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
            "destinations": [{"name":"planning", "format": "json_planning", "delivery_type": "File", "config":{"file_path": "/tmp"}}]
        }
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
        And we get different etag
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {"state": "scheduled"}
        """
        When we get "published_planning"
        Then we get list with 1 items
        Then we store "PLANNING" with first item
        When we get "published_planning?where={\"item_id\": \"#PLANNING.item_id#\", \"version\": #PLANNING.version#}"
        Then we get list with 1 items
        """
        {
            "_items": [
                {
                    "item_id": "#planning._id#",
                    "type": "planning",
                    "published_item": {
                        "_id": "#planning._id#",
                        "agendas": ["#agenda._id#"],
                        "coverages": [
                            {
                                "workflow_status": "draft",
                                "news_coverage_status": {
                                  "qcode": "ncostat:int"
                                },
                                "planning": {
                                    "ednote": "test coverage, I want 250 words",
                                    "headline": "test headline",
                                    "slugline": "test slugline",
                                    "g2_content_type" : "text"
                                }
                            }
                        ]
                    }
                }
            ]
        }
        """
        When we get "published_planning?where={\"item_id\": \"#PLANNING.item_id#\", \"version\": #PLANNING.version#}&embedded={\"agendas\": 1}"
        Then we get list with 1 items
        """
        {
            "_items": [
                {
                    "item_id": "#planning._id#",
                    "type": "planning",
                    "published_item": {
                        "_id": "#planning._id#",
                        "agendas": [{
                            "_id": "#agenda._id#",
                            "name": "TestAgenda"
                        }]
                    }
                }
            ]
        }
        """
        When we get "publish_queue"
        Then we get list with 1 items



    @auth
    Scenario: Fail to post a planning item with insufficient privileges
    When we post to "/planning" with success
    """
    {
        "headline": "test headline",
        "slugline": "test slugline",
        "planning_date": "2016-01-02"
    }
    """
    When we patch "/users/#CONTEXT_USER_ID#"
    """
    {"user_type": "user", "privileges": {"planning_event_post": 0, "users": 1}}
    """
    When we post to "/planning/post"
    """
    {
        "planning": "#planning._id#",
        "etag": "#planning._etag#",
        "pubstatus": "usable"
    }
    """
    Then we get error 403



    @auth
    Scenario: Unpost planning item will delete associated assignment in workflow
        Given we have sessions "/sessions"
        Given the "validators"
        """
        [{
            "schema": {},
            "type": "text",
            "act": "publish",
            "_id": "publish_text"
        },
        {
            "_id": "publish_composite",
            "act": "publish",
            "type": "composite",
            "schema": {}
        }]
        """
        And "desks"
        """
        [{"name": "Sports", "content_expiry": 60, "members": [{"user": "#CONTEXT_USER_ID#"}]}]
        """
        When we post to "/planning"
        """
        [{
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
            "coverages": [{
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "headline": "test headline",
                    "slugline": "test slugline",
                    "g2_content_type" : "text"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#",
                    "state": "assigned"
                },
                "workflow_status": "active"
            }],
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#"
        }
        """
        Then we get OK response
        Then we store coverage id in "coverageId" from coverage 0
        Then we store assignment id in "assignmentId" from coverage 0
        When we post to "/planning/post"
        """
        {
            "planning": "#planning._id#",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
        When we post to "/planning/post"
        """
        {
            "planning": "#planning._id#",
            "etag": "#planning._etag#",
            "pubstatus": "cancelled"
        }
        """
        Then we get OK response
        When we get "/assignments/"
        Then we get list with 0 items

    @auth
    @notification
    Scenario: Unpost planning item will send notification if deletion of assignment fails
        Given we have sessions "/sessions"
        Given the "validators"
        """
        [{
            "schema": {},
            "type": "text",
            "act": "publish",
            "_id": "publish_text"
        },
        {
            "_id": "publish_composite",
            "act": "publish",
            "type": "composite",
            "schema": {}
        }]
        """
        And "desks"
        """
        [{"name": "Sports", "content_expiry": 60, "members": [{"user": "#CONTEXT_USER_ID#"}]}]
        """
        When we post to "/planning"
        """
        [{
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
            "coverages": [{
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "headline": "test headline",
                    "slugline": "test slugline",
                    "g2_content_type" : "text"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#",
                    "state": "assigned"
                },
                "workflow_status": "active"
            }],
            "lock_user": "#CONTEXT_USER_ID#",
            "lock_session": "#SESSION_ID#"
        }
        """
        Then we get OK response
        Then we store coverage id in "coverageId" from coverage 0
        Then we store assignment id in "assignmentId" from coverage 0
        When we post to "/planning/post"
        """
        {
            "planning": "#planning._id#",
            "etag": "#planning._etag#",
            "pubstatus": "usable"
        }
        """
        Then we get OK response
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
        When we post to "assignments/link"
        """
        [{"assignment_id": "#assignmentId#", "item_id": "#archive._id#", "reassign": true}]
        """
        Then we get OK response
        When we get "/archive/#archive._id#"
        Then we get existing resource
        """
        {"assignment_id": "#assignmentId#"}
        """
        When we patch "/archive/#archive._id#"
        """
        {"lock_user": "#users._id#"}
        """
        Then we get OK response
        When we post to "/planning/post"
        """
        {
            "planning": "#planning._id#",
            "etag": "#planning._etag#",
            "pubstatus": "cancelled"
        }
        """
        Then we get OK response
        When we get "/assignments/"
        Then we get list with 1 items
        And we get notifications
        """
        [{
            "event": "assignments:delete:fail",
            "extra": {
                "items": [
                  {
                    "slugline": "test slugline",
                    "type": "text"
                  }
                ],
                "session": "#SESSION_ID#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """

    @auth
    Scenario: Can not add planning with a disabled agenda
        Given "agenda"
        """
        [{
            "_id": "5d0b2fe75f627d4675887ae0",
            "name": "TestAgenda",
            "is_enabled": true
        },{
            "_id": "5d0b2fe75f627d4675887ae1",
            "name": "DisablesAgenda",
            "is_enabled": false
        }]
        """
        When we post to "/planning"
        """
        [{
            "headline": "test headline",
            "slugline": "test slugline",
            "agendas": ["5d0b2fe75f627d4675887ae0", "5d0b2fe75f627d4675887ae1"],
            "guid": "123",
            "planning_date": "2016-01-02"
        }]
        """
        Then we get error 403

    @auth
    Scenario: Can not update planning with a disabled agenda
        Given "agenda"
        """
        [{
            "_id": "5d0b2fe75f627d4675887ae0",
            "name": "TestAgenda",
            "is_enabled": true
        },{
            "_id": "5d0b2fe75f627d4675887ae1",
            "name": "DisablesAgenda",
            "is_enabled": false
        }]
        """
        When we post to "/planning"
        """
        [{
            "headline": "test headline",
            "slugline": "test slugline",
            "agendas": ["5d0b2fe75f627d4675887ae0"],
            "guid": "123",
            "planning_date": "2016-01-02"
        }]
        """
        Then we get OK response
        When we patch "/planning/123"
        """
        {
            "agendas": ["5d0b2fe75f627d4675887ae0", "5d0b2fe75f627d4675887ae1"]
        }
        """
        Then we get error 400
