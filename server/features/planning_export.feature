Feature: Export planning items

    @wip
    @auth
    Scenario: Export planning items as an article
        Given "desks"
        """
        [
            {"name": "sports"}
        ]
        """

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

        Given "planning"
        """
        [
            {"headline": "Planning 1", "slugline": "planning-1", "description_text": "desc"}
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
        When we get "archive"
        Then we get list with 1 items
        """
        {"_items": [
            {"slugline": "Foo"}
        ]}
        """
