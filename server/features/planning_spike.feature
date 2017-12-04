Feature: Planning Spike
    @auth
    Scenario: Planning state defaults to draft
        When we post to "planning"
        """
        [{
            "slugline": "TestPlan"
        }]
        """
        Then we get OK response
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "slugline": "TestPlan",
            "state": "draft"
        }
        """

    @auth
    @notification
    Scenario: Spike a Planning item
        Given "desks"
        """
        [{"_id": "desk_123", "name": "Politic Desk"}]
        """
        Given "assignments"
        """
        [{
            "_id": "aaaaaaaaaaaaaaaaaaaaaaaa",
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline",
                "g2_content_type": "text"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "state": "assigned"
            }
        }]
        """
        Given "planning"
        """
        [{
            "slugline": "TestPlan",
            "state": "draft",
            "coverages": [{
                "coverage_id": "cov1",
                "slugline": "TestCoverage 1",
                "planning": {
                    "internal_note": "Cover something please!"
                },
                "planning_item": "plan1",
                "news_coverage_status": {
                    "qcode": "ncostat:int",
                    "name": "Coverage intended"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#",
                    "assignment_id": "aaaaaaaaaaaaaaaaaaaaaaaa"
                }
            }]

        }]
        """
        When we spike planning "#planning._id#"
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "planning:spiked",
            "extra": {
                "item": "#planning._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        },
        {
            "event": "activity",
            "extra": {
                "activity": {
                "message" : "{{actioning_user}} has spiked a {{coverage_type}} coverage for \"{{slugline}}\"",
                "user_name" : "test_user"
                }
            }
        }]
        """
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "slugline": "TestPlan",
            "state": "spiked",
            "revert_state": "draft"
        }
        """
        When we get "/planning_history?where=planning_id==%22#planning._id#%22"
        Then we get list with 2 items
        """
        {"_items": [{
            "planning_id": "#planning._id#",
            "operation": "spiked",
            "update": {"state" : "spiked", "revert_state": "draft"}
            },
            {
            "planning_id": "#planning._id#",
            "operation": "coverage deleted",
            "update": {"coverage_id": "cov1"}
            }
            ]}
        """

    @auth
    @notification
    Scenario: Unspike a Planning item
        Given "planning"
        """
        [{
            "slugline": "TestPlan",
            "state": "spiked",
            "revert_state": "draft"
        }]
        """
        When we unspike planning "#planning._id#"
        Then we get OK response
        And we get notifications
        """
        [{
            "event": "planning:unspiked",
            "extra": {
                "item": "#planning._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }]
        """
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "slugline": "TestPlan",
            "state": "draft"
        }
        """
        When we get "/planning_history?where=planning_id==%22#planning._id#%22"
        Then we get list with 1 items
        """
        {"_items": [{
            "planning_id": "#planning._id#",
            "operation": "unspiked",
            "update": {"state" : "draft"}}
        ]}
        """

    @auth
    Scenario: Planning item can be spiked and unspiked only by user having privileges
        Given "planning"
        """
        [{
            "slugline": "TestPlan"
        }]
        """
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {
            "user_type": "user",
            "privileges": {
                "planning_planning_spike": 0,
                "users": 1
            }
        }
        """
        Then we get OK response
        When we spike planning "#planning._id#"
        Then we get error 403
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {
            "user_type": "user",
            "privileges": {
                "planning_planning_spike": 1,
                "planning_planning_unspike": 0,
                "users": 1
            }
        }
        """
        Then we get OK response
        When we spike planning "#planning._id#"
        Then we get OK response
        When we unspike planning "#planning._id#"
        Then we get error 403
        When we patch "/users/#CONTEXT_USER_ID#"
        """
        {
            "user_type": "user",
            "privileges": {
                "planning_planning_unspike": 1,
                "users": 1
            }
        }
        """
        Then we get OK response
        When we unspike planning "#planning._id#"
        Then we get OK response
