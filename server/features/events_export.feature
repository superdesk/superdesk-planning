Feature: Export events with default template

    @auth
    Scenario: Export planning items as an article
        Given "content_templates"
        """
        [
            {
                "template_name": "Planning export",
                "template_type": "planning_export",
                "data": {"slugline": "Foo"}
            }
        ]
        """

        Given "desks"
        """
        [
            {"name": "sports", "default_content_template": "#content_templates._id#"}
        ]
        """

        Given "events"
        """
        [
            {
                "name": "test",
                "dates": {
                    "start": "2016-01-02",
                    "end": "2016-01-03"
                },
                "location": []
            }
        ]
        """

        When we post to "planning_article_export"
        """
        {"items": ["#events._id#"], "desk": "#desks._id#", "type": "event"}
        """
        Then we get new resource
        """
        {
            "type": "text",
            "slugline": "Foo",
            "task": {"desk": "#desks._id#", "stage": "#desks.working_stage#"}
        }
        """
        And we get text in "body_html"
        """
        test
        """
        When we get "archive"
        Then we get list with 1 items
        """
        {"_items": [
            {"slugline": "Foo"}
        ]}
        """


    @auth
    Scenario: Supprts configured template
        Given "content_templates"
        """
        [
            {
                "template_name": "Planning export",
                "template_type": "planning_export",
                "data": {"slugline": "Foo"}
            }
        ]
        """

        Given "planning_export_templates"
        """
        [
            {
                "name": "conf_template",
                "label": "Default Event Template",
                "type": "event",
                "data": {
                    "body_html": "test_event_export_template.html"
                }
            }
        ]
        """

        Given "desks"
        """
        [
            {"name": "sports", "default_content_template": "#content_templates._id#"}
        ]
        """

        Given "events"
        """
        [
            {
                "name": "test",
                "dates": {
                    "start": "2016-01-02",
                    "end": "2016-01-03"
                },
                "location": [],
                "ednote": "Ed. note 1"
            }
        ]
        """

        When we post to "planning_article_export"
        """
        {"items": ["#events._id#"], "desk": "#desks._id#", "template": "#planning_export_templates.name#", "type": "event"}
        """
        Then we get new resource
        """
        {
            "type": "text",
            "slugline": "Foo",
            "task": {"desk": "#desks._id#", "stage": "#desks.working_stage#"},
            "body_html": "Editorial note: Ed. note 1"
        }
        """
        When we get "archive"
        Then we get list with 1 items
        """
        {"_items": [
            {"slugline": "Foo", "body_html": "Editorial note: Ed. note 1"}

        ]}
        """
