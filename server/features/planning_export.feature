Feature: Export planning items with default template
    Background: Initial setup
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
        Given "events"
        """
        [{
            "name": "test",
            "dates": {
                "start": "2016-01-02",
                "end": "2016-01-03"
            },
            "location": []
        }]
        """
        Given "planning"
        """
        [{
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
            "planning_date": "2016-01-02"
        }]
        """

    @auth
    Scenario: Export planning items as an article
        When we post to "planning_article_export"
        """
        {
            "items": ["#planning._id#"],
            "desk": "#desks._id#",
            "type": "planning"
        }
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
        Planned coverage: Text, Photo
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
        Given "planning_export_templates"
        """
        [{
            "name": "conf_template",
            "label": "Default Planning Template",
            "type": "planning",
            "data": {
                "body_html_template": "test_planning_export_template.html"
            }
        }]
        """
        When we post to "planning_article_export"
        """
        {
            "items": ["#planning._id#"],
            "desk": "#desks._id#",
            "template": "#planning_export_templates.name#",
            "type": "planning"
        }
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
        {"_items": [{
            "slugline": "Foo",
            "body_html": "Editorial note: Ed. note 1"
        }]}
        """

    @auth
    Scenario: Support article templates
        Given "content_templates"
        """
        [{
            "template_name": "editor_template",
            "template_type": "editor_template",
            "data": {
                "slugline": "Foo",
                "body_html": "<p>header</p>\n<p>{{content}}</p>",
                "body_text": "test\n{{content}}"
            }
        }]
        """
        Given "desks"
        """
        [{
            "name": "sports",
            "default_content_template": "#content_templates._id#"
        }]
        """
        Given "planning_export_templates"
        """
        [{
            "name": "conf_template",
            "label": "Default Planning Template",
            "type": "planning",
            "data": {
                "body_html_template": "test_planning_export_template.html",
                "body_text": "template"
            }
        }]
        """
        When we post to "planning_article_export"
        """
        {
            "items": ["#planning._id#"],
            "desk": "#desks._id#",
            "template": "#planning_export_templates.name#",
            "article_template": "#content_templates._id#",
            "type": "planning"
        }
        """
        Then we get new resource
        """
        {
            "type": "text",
            "slugline": "Foo",
            "task": {"desk": "#desks._id#", "stage": "#desks.working_stage#"},
            "body_html": "<p>header</p>\nEditorial note: Ed. note 1",
            "body_text": "test\ntemplate"
        }
        """
        When we get "archive"
        Then we get list with 1 items
        """
        {"_items": [{
            "slugline": "Foo",
            "body_html": "<p>header</p>\nEditorial note: Ed. note 1",
            "body_text": "test\ntemplate"
        }]}
        """

    @auth
    Scenario: Use PLANNING_EXPORT_BODY_TEMPLATE config to override default template
        Given config update
        """
        {"PLANNING_EXPORT_BODY_TEMPLATE": "{% for item in items %}{{ item.headline }}{% endfor %}"}
        """
        When we post to "planning_article_export"
        """
        {
            "items": ["#planning._id#"],
            "desk": "#desks._id#",
            "type": "planning"
        }
        """
        Then we get new resource
        """
        {
            "type": "text",
            "slugline": "Foo",
            "task": {"desk": "#desks._id#", "stage": "#desks.working_stage#"},
            "body_html": "Planning 1"
        }
        """
        When we get "archive"
        Then we get list with 1 items
        """
        {"_items": [{
            "slugline": "Foo",
            "body_html": "Planning 1"
        }]}
        """

    @auth
    Scenario: Appends to the body_html from template if placeholder not found
        Given "content_templates"
        """
        [{
            "template_name": "editor_template",
            "template_type": "editor_template",
            "data": {
                "slugline": "Foo",
                "body_html": "<p>header</p>",
                "body_text": "test\n"
            }
        }]
        """
        Given "desks"
        """
        [{
            "name": "sports",
            "default_content_template": "#content_templates._id#"
        }]
        """
        Given "planning_export_templates"
        """
        [{
            "name": "conf_template",
            "label": "Default Planning Template",
            "type": "planning",
            "data": {
                "body_html_template": "test_planning_export_template.html",
                "body_text": "template"
            }
        }]
        """
        When we post to "planning_article_export"
        """
        {
            "items": ["#planning._id#"],
            "desk": "#desks._id#",
            "template": "#planning_export_templates.name#",
            "article_template": "#content_templates._id#",
            "type": "planning"
        }
        """
        Then we get new resource
        """
        {
            "type": "text",
            "slugline": "Foo",
            "task": {"desk": "#desks._id#", "stage": "#desks.working_stage#"},
            "body_html": "<p>header</p>Editorial note: Ed. note 1",
            "body_text": "test\ntemplate"
        }
        """
        When we get "archive"
        Then we get list with 1 items
        """
        {"_items": [{
            "slugline": "Foo",
            "body_html": "<p>header</p>Editorial note: Ed. note 1",
            "body_text": "test\ntemplate"
        }]}
        """
