Feature: Export combined Planning and Event items with default template
    Background: Initial Setup
        Given "content_templates"
        """
        [{
            "template_name": "Planning export",
            "template_type": "planning_export",
            "data": {"slugline": "Foo"}
        }]
        """
        Given "desks"
        """
        [{
            "name": "sports",
            "default_content_template": "#content_templates._id#"
        }]
        """
        Given "vocabularies"
        """
        [{
            "_id": "g2_content_type",
            "items": [
                {"is_active": true, "name": "Text", "qcode": "text"},
                {"is_active": true, "name": "Photo", "qcode": "photo"}
            ]
        }]
        """
        Given "planning_export_templates"
        """
        [{
            "name": "conf_template",
            "label": "Default Combined Template",
            "type": "combined",
            "data": {
                "body_html_template": "test_combined_export_template.html"
            }
        }]
        """
        Given "events"
        """
        [{
            "_id": "event1",
            "guid": "event1",
            "name": "test",
            "dates": {
                "start": "2021-01-11T14:00:00.000Z",
                "end": "2021-01-11T16:00:00.000Z",
                "tz": "Europe/Prague"
            },
            "location": []
        }]
        """
        Given "planning"
        """
        [{
            "_id": "plan1",
            "guid": "plan1",
            "headline": "Planning 1",
            "slugline": "planning-1",
            "description_text": "desc",
            "event_item": "#events._id#",
            "ednote": "Ed. note 1",
            "coverages": [{
                "coverage_id": "123",
                "planning": {
                    "g2_content_type": "text"
                }
            },
            {
                "coverage_id": "456",
                "planning": {
                    "g2_content_type": "photo"
                }
            }],
            "planning_date": "2021-01-11T16:00:00.000Z"
        }, {
            "_id": "plan2",
            "guid": "plan2",
            "headline": "Planning 2",
            "slugline": "planning-2",
            "description_text": "desc 2",
            "ednote": "Ed. note 2",
            "coverages": [{
                "coverage_id": "789",
                "planning": {
                    "g2_content_type": "text"
                }
            },
            {
                "coverage_id": "012",
                "planning": {
                    "g2_content_type": "photo"
                }
            }],
            "planning_date": "2021-01-11T16:00:00.000Z"
        }]
        """

    @auth
    Scenario: Export combined items as an article
        When we post to "planning_article_export"
        """
        {
            "items": ["event1", "plan1", "plan2"],
            "desk": "#desks._id#",
            "type": "combined"
        }
        """
        Then we get new resource
        """
        {
            "type": "text",
            "slugline": "Foo",
            "task": {
                "desk": "#desks._id#",
                "stage": "#desks.working_stage#"
            }
        }
        """
        And we get text in "body_html"
        """
        <h2>Events</h2>
        <p><b>test</b>, 1500</p>
        <p><b>Planned coverage:</b> Text, Photo</p>
        <p>---</p>
        """
        And we get text in "body_html"
        """
        <h2>Planning</h2>
        <p><b>Planning 2</b></p>
        <p>desc 2</p>
        <p></p>
        <p>Editorial note: Ed. note 2</p>
        <p>Planned coverage: Text, Photo
        <p>---</p>
        """
        When we get "archive"
        Then we get list with 1 items
        """
        {"_items": [{
            "slugline": "Foo"
        }]}
        """

    @auth
    Scenario: Supports configured template
        When we post to "planning_article_export"
        """
        {
            "items": ["event1", "plan1", "plan2"],
            "desk": "#desks._id#",
            "template": "#planning_export_templates.name#",
            "type": "combined"
        }
        """
        Then we get new resource
        """
        {
            "type": "text",
            "slugline": "Foo",
            "task": {
                "desk": "#desks._id#",
                "stage": "#desks.working_stage#"
            }
        }
        """
        And we get text in "body_html"
        """
        <h1>Planned Coverages</h1>
        <p></p>
        <p><b>Event:</b> test</p>
        <p><b>Coverages:</b> Text, Photo</p>
        <p>---</p>
        <p><b>Planning:</b> Planning 2</p>
        <p><b>Coverages:</b> Text, Photo</p>
        <p>---</p>
        """

    @auth
    Scenario: Supports article templates
        When we post to "planning_article_export"
        """
        {
            "items": ["event1", "plan1", "plan2"],
            "desk": "#desks._id#",
            "template": "#planning_export_templates.name#",
            "article_template": "#content_templates._id#",
            "type": "combined"
        }
        """
        Then we get new resource
        """
        {
            "type": "text",
            "slugline": "Foo",
            "task": {
                "desk": "#desks._id#",
                "stage": "#desks.working_stage#"
            }
        }
        """
        And we get text in "body_html"
        """
        <h1>Planned Coverages</h1>
        <p></p>
        <p><b>Event:</b> test</p>
        <p><b>Coverages:</b> Text, Photo</p>
        <p>---</p>
        <p><b>Planning:</b> Planning 2</p>
        <p><b>Coverages:</b> Text, Photo</p>
        <p>---</p>
        """
        When we get "archive"
        Then we get list with 1 items
        """
        {"_items": [{"slugline": "Foo"}]}
        """

    @auth
    Scenario: Use COMBINED_EXPORT_BODY_TEMPLATE config to override default template
        Given config update
        """
        {"COMBINED_EXPORT_BODY_TEMPLATE": "{% for item in items %}<p>{{ item.name or item.headline }}</p>{% endfor %}"}
        """
        When we post to "planning_article_export"
        """
        {
            "items": ["event1", "plan1", "plan2"],
            "desk": "#desks._id#",
            "type": "combined"
        }
        """
        Then we get new resource
        """
        {
            "type": "text",
            "slugline": "Foo",
            "task": {
                "desk": "#desks._id#",
                "stage": "#desks.working_stage#"
            }
        }
        """
        When we get "archive"
        Then we get list with 1 items
        """
        {"_items": [{
            "slugline": "Foo",
            "body_html": "<p>test</p><p>Planning 2</p>"
        }]}
        """
