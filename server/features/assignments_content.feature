Feature: Assignment content
    Background: Setup data
        Given "content_types"
        """
        [{"schema": {"body_html": {}, "slugline": {}, "headline": {}, "ednote": null }}]
        """
        Given "content_templates"
        """
        [
            {
                "template_name": "Default",
                "template_type": "create",
                "data": {
                  "profile": "#content_types._id#",
                  "slugline": "Foo",
                  "headline": "Headline From Template"
                }
            }
        ]
        """
        Given "desks"
        """
        [
            {
                "name": "sports",
                "default_content_template": "#content_templates._id#",
                "default_content_profile": "#content_types._id#",
                "members": [{"user": "#CONTEXT_USER_ID#"}]}
        ]
        """

        Given "vocabularies"
        """
        [
            {"_id": "g2_content_type", "items": [
                {"is_active": true, "name": "Text", "qcode": "text"},
                {"is_active": true, "name": "Photo", "qcode": "photo"}
            ]},
            {
                "_id": "newscoveragestatus",
                "display_name": "News Coverage Status",
                "type": "manageable",
                "unique_field": "qcode",
                "items": [
                    {"is_active": true, "qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                    {"is_active": true, "qcode": "ncostat:notdec", "name": "coverage not decided yet",
                        "label": "On merit"},
                    {"is_active": true, "qcode": "ncostat:notint", "name": "coverage not intended",
                        "label": "Not planned"},
                    {"is_active": true, "qcode": "ncostat:onreq", "name": "coverage upon request",
                        "label": "On request"}
                ]
            }
        ]
        """
        When we post to "/planning"
        """
        [
            {
                "item_class": "item class value",
                "slugline": "test slugline",
                "planning_date": "2016-01-02"
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
                    },
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "workflow_status": "assigned"
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
    Scenario: Create content from assignment with ednote not in content as per content profile
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
            "headline": "Headline From Template",
            "profile": "#content_types._id#",
            "flags": {"marked_for_not_publication": false, "overide_auto_assign_to_workflow": "__no_value__"}
        }
        """
        And we get "ednote" does not exist
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
    Scenario: Create content with headline and abstract derived from the Assignment
        When we patch "/planning/#planning._id#"
        """
        {
            "description_text": "test description",
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
                    },
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "workflow_status": "assigned"
                }
            ]
        }
        """
        Then we get OK response
        When we get "/assignments/#firstassignment#"
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
            "description_text": "test description"
        }
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
            "headline": "Headline From Template",
            "abstract": "<p>test description</p>",
            "profile": "#content_types._id#",
            "flags": {"marked_for_not_publication": false, "overide_auto_assign_to_workflow": "__no_value__"}
        }
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
        {
            "flags": {"marked_for_not_publication": true},
            "coverages": [{
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
                }],
            "place" : [
                {
                    "state" : "",
                    "country" : "",
                    "group" : "Rest Of World",
                    "name" : "CIS",
                    "world_region" : "Commonwealth of Independent States",
                    "qcode" : "CIS"
                }
            ]
        }
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
            "headline": "Headline From Template",
            "flags": {"marked_for_not_publication": true, "overide_auto_assign_to_workflow": "__no_value__"},
            "place" : [
                {
                    "state" : "",
                    "country" : "",
                    "group" : "Rest Of World",
                    "name" : "CIS",
                    "world_region" : "Commonwealth of Independent States",
                    "qcode" : "CIS"
                }
            ]
        }
        """
