Feature: Export planning items

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

        Given "vocabularies"
        """
        [
            {"_id": "g2_content_type", "items": [
                {"is_active": true, "name": "Text", "qcode": "text"},
                {"is_active": true, "name": "Photo", "qcode": "photo"}
            ]}
        ]
        """

        Given "events"
        """
        [
            {"name": "test", "dates": {}, "location": []}
        ]
        """

        Given "planning"
        """
        [
            {
                "headline": "Planning 1",
                "slugline": "planning-1",
                "description_text": "desc",
                "event_item": "#events._id#",
                "coverages": [
                    {
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
                    }
                ]
            }
        ]
        """
        When we post to "planning_export"
        """
        {"items": ["#planning._id#"], "desk": "#desks._id#"}
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
        {"_items": [
            {"slugline": "Foo"}
        ]}
        """
