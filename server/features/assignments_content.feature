Feature: Assignment content
    Background: Setup data
        Given "content_templates"
        """
        [
            {
                "template_name": "Default",
                "template_type": "create",
                "data": {
                  "slugline": "Foo",
                  "headline": "Headline From Template"
                }
            }
        ]
        """

        Given "desks"
        """
        [
            {"name": "sports", "default_content_template": "#content_templates._id#",
            "members": [{"user": "#CONTEXT_USER_ID#"}]}
        ]
        """

        Given "vocabularies"
        """
        [
            {"_id": "g2_content_type", "items": [
                {"is_active": true, "name": "Text", "qcode": "text"},
                {"is_active": true, "name": "Photo", "qcode": "photo"}
            ]}
        ]
        """
        When we post to "/planning"
        """
        [
            {
                "item_class": "item class value",
                "slugline": "test slugline"
            }
        ]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [
                {
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "slugline": "test slugline",
                        "g2_content_type": "text"
                    },
                    "assigned_to": {
                        "desk": "#desks._id#"
                    }
                }
            ]
        }
        """
        Then we get OK response
        Then we store coverage id in "firstcoverage" from coverage 0
        Then we store assignment id in "firstassignment" from coverage 0
        When we get "/planning/#planning._id#"
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "item_class": "item class value",
            "slugline": "test slugline",
            "coverages": [
                {
                    "coverage_id": "#firstcoverage#",
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "slugline": "test slugline",
                        "g2_content_type": "text"
                    },
                    "assigned_to": {
                        "desk": "#desks._id#",
                        "assignment_id": "#firstassignment#",
                        "state": "assigned"
                    }
                }
            ]
        }
        """
        When we get "/assignments/#firstassignment#"
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "slugline": "test slugline",
                "g2_content_type": "text"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "state": "assigned"
            }
        }
        """

    @auth
    @vocabularies
    Scenario: Content creation fails if there is no archive privilege
        When we login as user "foo" with password "bar" and user type "user"
        """
        {"user_type": "user", "email": "foo.bar@foobar.org"}
        """
        And we post to "/assignments/content"
        """
        [{"assignment_id": "#firstassignment#"}]
        """
        Then we get response code 403


    @auth
    @vocabularies
    Scenario: Create content from assignment
        When we post to "/assignments/content"
        """
        [{"assignment_id": "#firstassignment#"}]
        """
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "__any_value__",
            "assignment_id": "#firstassignment#",
            "task": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "stage": "#desks.working_stage#"
            },
            "slugline": "test slugline",
            "type": "text",
            "ednote": "test coverage, I want 250 words",
            "headline": "Headline From Template"
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
                "operation": "start_working"
            }
        ]}
        """

    @auth
    @vocabularies
    Scenario: Content creation fails if assignment not found
        When we post to "/assignments/content"
        """
        [{"assignment_id": "123"}]
        """
        Then we get error 400
        """
        {"_status": "ERR", "_message": "Assignment not found."}
        """

    @auth
    @vocabularies
    Scenario: Content creation fails workflow started
        When we post to "/assignments/content"
        """
        [{"assignment_id": "#firstassignment#"}]
        """
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "__any_value__",
            "assignment_id": "#firstassignment#",
            "task": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "stage": "#desks.working_stage#"
            },
            "slugline": "test slugline",
            "type": "text",
            "ednote": "test coverage, I want 250 words",
            "headline": "Headline From Template"
        }
        """
        When we post to "/assignments/content"
        """
        [{"assignment_id": "#firstassignment#"}]
        """
        Then we get error 400
        """
        {"_status": "ERR", "_message": "Assignment workflow started. Cannot create content."}
        """

    @auth
    @vocabularies
    Scenario: Perpetuate marked_for_not_publication flag when creating content from assignment
        When we patch "/planning/#planning._id#"
        """
        {"flags": {"marked_for_not_publication": true}}
        """
        When we post to "/assignments/content"
        """
        [{"assignment_id": "#firstassignment#"}]
        """
        Then we get OK response
        Then we get existing resource
        """
        {
            "_id": "__any_value__",
            "assignment_id": "#firstassignment#",
            "task": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#",
                "stage": "#desks.working_stage#"
            },
            "slugline": "test slugline",
            "type": "text",
            "ednote": "test coverage, I want 250 words",
            "headline": "Headline From Template",
            "flags": {"marked_for_not_publication": true}
        }
        """
