Feature: Assignment Complete

  @auth
  @notification
  Scenario: Assignment State changes to completed
    Given empty "assignments"
    Given "desks"
    """
        [
            {"name": "Politic Desk",
            "members": [{"user": "#CONTEXT_USER_ID#"}]}
        ]
    """
        When we post to "/archive"
        """
        [{
            "type": "text",
            "headline": "test headline",
            "slugline": "test slugline"
        }]
        """
        Then we get OK response
        And we store "firstuser" with value "#CONTEXT_USER_ID#" to context
        When we post to "users"
        """
        {"username": "foo", "email": "foo@bar.com", "is_active": true, "sign_off": "abc"}
        """
        Then we get OK response
        And we store "seconduser" with value "#users._id#" to context
        When we patch "/desks/#desks._id#"
        """
        {"members": [{"user": "#firstuser#"}, {"user": "#seconduser#"}]}
        """
        Then we get OK response
       When we post to "/planning"
        """
        [{
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline"
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
                    "g2_content_type":"text"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#seconduser#",
                    "state": "in_progress"
                }
            }]
        }
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
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
                "desk": "#desks._id#",
                "user": "#seconduser#",
                "state": "in_progress"
            }
        }
        """
        Given empty "activity"
        When we switch user
        When we post to "/assignments/#firstassignment#/lock"
        """
        {"lock_action": "complete"}
        """
        Then we get OK response
        When we perform complete on assignments "#firstassignment#"
        """
        { }
        """
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "assignments:completed",
            "extra": {
                "item": "#firstassignment#",
                "assigned_desk": "#desks._id#",
                "planning": "#planning._id#",
                "assignment_state": "completed"
            }
        }]
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
                "desk": "#desks._id#",
                "user": "#seconduser#",
                "state": "completed"
            }
        }
        """
        Then we get OK response
        When we get "/activity"
        Then we get existing resource
        """
        {"_items": [{
            "message" : "{{coverage_type}} coverage \"{{slugline}}\" has been completed by {{assignee}}",
            "name" : "update",
            "user" : "#CONTEXT_USER_ID#",
            "user_name" : "test-user-2",
            "recipients" : [
                {
                    "read" : false,
                    "user_id" : "#firstuser#"
                }
            ],
            "data" : {
                "coverage_type" : "text",
                "assignee" : "test-user-2",
                "omit_user" : true,
                "slugline" : "test slugline"
            },
            "resource" : "assignments"}
        ]
        }
        """
        When we get "/assignments_history"
        Then we get list with 2 items
        """
        {"_items": [
            {
                "assignment_id": "#firstassignment#",
                "operation": "create"
            },
            {
                "assignment_id": "#firstassignment#",
                "operation": "complete"
            }
        ]}
        """



    @auth
    Scenario: Fail to complete when assignment not in progess state for text assignments
    Given empty "assignments"
        When we post to "/planning"
        """
        [{
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline"
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
                    "g2_content_type": "text"
                },
                "assigned_to": {
                    "desk": "Politic Desk",
                    "user": "#CONTEXT_USER_ID#",
                    "state": "assigned"
                }
            }]
        }
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        When we get "/assignments/#firstassignment#"
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline",
                "g2_content_type": "text"
            },
            "assigned_to": {
                "desk": "Politic Desk",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            }
        }
        """
        When we perform complete on assignments "#firstassignment#"
        """
        { }
        """
        Then we get error 400

    @auth
    Scenario: Non text assignments in assigned / submitted can be completed
    Given empty "assignments"
        When we post to "/planning"
        """
        [{
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline"
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
                    "g2_content_type": "video"
                },
                "assigned_to": {
                    "desk": "Politic Desk",
                    "user": "#CONTEXT_USER_ID#",
                    "state": "assigned"
                }
            }]
        }
        """
        # We are checking cancelled state because non text cannot be in_progress
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        When we get "/assignments/#firstassignment#"
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline",
                "g2_content_type": "video"
            },
            "assigned_to": {
                "desk": "Politic Desk",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            }
        }
        """
        When we perform complete on assignments "#firstassignment#"
        """
        {
            "_id": "#firstassignment#",
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline",
                "g2_content_type": "video"
            },
            "assigned_to": {
                "desk": "Politic Desk",
                "user": "#CONTEXT_USER_ID#",
                "state": "completed"
            }
        }
        """


    @auth
    Scenario: Non text assignments should be in submitted or assigned state only
    Given empty "assignments"
        When we post to "/planning"
        """
        [{
            "item_class": "item class value",
            "headline": "test headline",
            "slugline": "test slugline"
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
                    "g2_content_type": "video"
                },
                "assigned_to": {
                    "desk": "Politic Desk",
                    "user": "#CONTEXT_USER_ID#",
                    "state": "cancelled"
                }
            }]
        }
        """
        # We are checking cancelled state because non text cannot be in_progress
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        When we get "/assignments/#firstassignment#"
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline",
                "g2_content_type": "video"
            },
            "assigned_to": {
                "desk": "Politic Desk",
                "user": "#CONTEXT_USER_ID#",
                "state": "cancelled"
            }
        }
        """
        When we perform complete on assignments "#firstassignment#"
        """
        { }
        """
        Then we get error 400

  @auth
  @notification
  Scenario: Confirm availability saves revert_state in assignment document
    Given empty "assignments"
    When we post to "/planning"
    """
    [{
        "item_class": "item class value",
        "headline": "test headline",
        "slugline": "test slugline"
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
                "g2_content_type":"live_video"
            },
            "assigned_to": {
                "desk": "desk123",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            }
        }]
    }
    """
    Then we get OK response
    Then we store assignment id in "firstassignment" from coverage 0
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
            "desk": "desk123",
            "user": "#CONTEXT_USER_ID#",
            "state": "assigned"
        }
    }
    """
    When we post to "/assignments/#firstassignment#/lock"
    """
    {"lock_action": "complete"}
    """
    Then we get OK response
    When we perform complete on assignments "#firstassignment#"
    """
    { }
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
            "desk": "desk123",
            "user": "#CONTEXT_USER_ID#",
            "state": "completed",
            "revert_state": "assigned"
        }
    }
    """
