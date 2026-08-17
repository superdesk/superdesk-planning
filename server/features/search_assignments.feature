Feature: Assignment Search
    Background: Initial setup
        When we set auto workflow on
        Given "content_types"
        """
        [{"schema": {"body_html": {}, "slugline": {}, "headline": {}, "ednote": null }}]
        """
        And "content_templates"
        """
        [{"template_name": "Default", "template_type": "create", "data": {}}]
        """
        And "users"
        """
        [
            {"_id": "60ca3437a4f1ec225c378f41", "name":"foo bar", "email":"foo@bar.org", "username":"foo.bar"},
            {"_id": "60ca3437a4f1ec225c378f42", "name":"bar foo", "email":"bar@foo.org", "username":"bar.foo"}
        ]
        """
        And "desks"
        """
        [
            {
                "_id": "50ca3437a4f1ec225c378f41", "name": "Sports",
                "members": [{"user": "60ca3437a4f1ec225c378f41"}],
                "default_content_template": "#content_templates._id#",
                "default_content_profile": "#content_types._id#"
            }, {
                "_id": "50ca3437a4f1ec225c378f42", "name": "Finance",
                "members":[{"user": "60ca3437a4f1ec225c378f41"}, {"user": "60ca3437a4f1ec225c378f42"}],
                "default_content_template": "#content_templates._id#",
                "default_content_profile": "#content_types._id#"
            }
        ]
        """
        When we post to "planning"
        """
        [{
            "guid": "planning_1",
            "name": "slug123",
            "planning_date": "#DATE#",
            "description_text": "planning description",
            "coverages": [{
                "planning": {
                    "scheduled": "#DATE-1#",
                    "g2_content_type": "text",
                    "genre": [{"name": "Article (news)", "qcode": "Article"}],
                    "anpa_category": [{"name": "Sports", "qcode": "sports"}],
                    "language": "fi",
                    "priority": 5,
                    "headline": "Donkeys Escape Local Zoo",
                    "slugline": "Donkeys Zebras Zoo",
                    "ednote": "Foobars",
                    "internal_note": "Zoo",
                    "subject": [
                        {"qcode": "soccer", "name": "Soccer"},
                        {"qcode": "international", "name": "International", "scheme": "locality"}
                    ],
                    "location": [{
                        "qcode": "test-location-1",
                        "name": "Monkeys",
                        "location": {"lat": 50.0874654, "lon": 14.4212535},
                        "formatted_address": "Prague Czechia",
                        "address": {
                            "boundingbox": [
                                "49.9419006",
                                "50.1774301",
                                "14.2244355",
                                "14.7067869"
                            ],
                            "country": "Czechia",
                            "line": [""],
                            "locality": "Prague",
                            "title": null,
                            "type": "city"
                        }
                    }],
                    "fields": [
                        {"field": "my_name", "value": "Elephants being creative"},
                        {"field": "my_description", "value": "Can paint cats dancing"}
                    ]
                },
                "assigned_to": {
                    "desk": "50ca3437a4f1ec225c378f41",
                    "priority": 1
                },
                "workflow_status": "active",
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"}
            }, {
                "planning": {
                    "scheduled": "#DATE#",
                    "g2_content_type": "photo",
                    "priority": 4,
                    "headline": "Zebras Arrive At Local Zoo",
                    "slugline": "Donkeys Zebras",
                    "fields": [
                        {"field": "my_name", "value": "Elephants singing"},
                        {"field": "my_description", "value": "Can paint cats singing"}
                    ]
                },
                "assigned_to": {
                    "desk": "50ca3437a4f1ec225c378f42",
                    "user": "60ca3437a4f1ec225c378f41",
                    "priority": 3
                },
                "workflow_status": "active",
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"}
            }, {
                "planning": {
                    "scheduled": "#DATE+1#",
                    "g2_content_type": "video",
                    "priority": 3
                },
                "assigned_to": {
                    "desk": "50ca3437a4f1ec225c378f42",
                    "user": "60ca3437a4f1ec225c378f41",
                    "priority": 3
                },
                "workflow_status": "active",
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"}
            }, {
                "planning": {
                    "scheduled": "#DATE+2#",
                    "g2_content_type": "text",
                    "multiple_content": true,
                    "priority": 3,
                    "genre": [{"name": "Backgrounder", "qcode": "Backgrounder"}],
                    "language": "en"
                },
                "assigned_to": {
                    "desk": "50ca3437a4f1ec225c378f42",
                    "user": "60ca3437a4f1ec225c378f42",
                    "priority": 2
                },
                "workflow_status": "active",
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"}
            }]
        }]
        """
        Then we get OK response
        And we store coverage id in "COVERAGE_1_ID" from coverage 0
        And we store coverage id in "COVERAGE_2_ID" from coverage 1
        And we store coverage id in "COVERAGE_3_ID" from coverage 2
        And we store coverage id in "COVERAGE_4_ID" from coverage 3
        And we store assignment id in "ASSIGNMENT_1_ID" from coverage 0
        And we store assignment id in "ASSIGNMENT_2_ID" from coverage 1
        And we store assignment id in "ASSIGNMENT_3_ID" from coverage 2
        And we store assignment id in "ASSIGNMENT_4_ID" from coverage 3

    @auth
    Scenario: Retrieve assignments when using repo=assignments
        When we get "/events_planning_search?repo=assignments"
        Then we get list with 4 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_1_ID#"},
            {"_id": "#ASSIGNMENT_2_ID#"},
            {"_id": "#ASSIGNMENT_3_ID#"},
            {"_id": "#ASSIGNMENT_4_ID#"}
        ]}
        """

    @auth
    Scenario: Search Assignments by assignee details
        # Search by Desks
        When we get "/events_planning_search?repo=assignments&desk_ids=50ca3437a4f1ec225c378f41"
        Then we get list with 1 items
        """
        {"_items": [{"_id": "#ASSIGNMENT_1_ID#"}]}
        """
        When we get "/events_planning_search?repo=assignments&desk_ids=50ca3437a4f1ec225c378f42"
        Then we get list with 3 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_2_ID#"},
            {"_id": "#ASSIGNMENT_3_ID#"},
            {"_id": "#ASSIGNMENT_4_ID#"}
        ]}
        """

        When we get "/events_planning_search?repo=assignments&desk_ids=50ca3437a4f1ec225c378f41,50ca3437a4f1ec225c378f42"
        Then we get list with 4 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_1_ID#"},
            {"_id": "#ASSIGNMENT_2_ID#"},
            {"_id": "#ASSIGNMENT_3_ID#"},
            {"_id": "#ASSIGNMENT_4_ID#"}
        ]}
        """

        # Search by users
        When we get "/events_planning_search?repo=assignments&user_ids=60ca3437a4f1ec225c378f41"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_2_ID#"},
            {"_id": "#ASSIGNMENT_3_ID#"}
        ]}
        """
        When we get "/events_planning_search?repo=assignments&user_ids=60ca3437a4f1ec225c378f42"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_4_ID#"}
        ]}
        """
        When we get "/events_planning_search?repo=assignments&user_ids=60ca3437a4f1ec225c378f41,60ca3437a4f1ec225c378f42"
        Then we get list with 3 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_2_ID#"},
            {"_id": "#ASSIGNMENT_3_ID#"},
            {"_id": "#ASSIGNMENT_4_ID#"}
        ]}
        """

        # Search by content type
        When we get "/events_planning_search?repo=assignments&g2_content_type=text"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_1_ID#"},
            {"_id": "#ASSIGNMENT_4_ID#"}
        ]}
        """
        When we get "/events_planning_search?repo=assignments&g2_content_type=photo"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_2_ID#"}
        ]}
        """
        When we get "/events_planning_search?repo=assignments&g2_content_type=photo,video"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_2_ID#"},
            {"_id": "#ASSIGNMENT_3_ID#"}
        ]}
        """

        # Search by Assignment Priority
        When we get "/events_planning_search?repo=assignments&assignment_priority=1"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_1_ID#"}
        ]}
        """
        When we get "/events_planning_search?repo=assignments&assignment_priority=2,3"
        Then we get list with 3 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_2_ID#"},
            {"_id": "#ASSIGNMENT_3_ID#"},
            {"_id": "#ASSIGNMENT_4_ID#"}
        ]}
        """

        # Search by Multiple Content
        When we get "/events_planning_search?repo=assignments&multiple_content=true"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_4_ID#"}
        ]}
        """
        When we get "/events_planning_search?repo=assignments&multiple_content=false"
        Then we get list with 3 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_1_ID#"},
            {"_id": "#ASSIGNMENT_2_ID#"},
            {"_id": "#ASSIGNMENT_3_ID#"}
        ]}
        """

    @auth
    Scenario: Search Assignments by state
        # Assigned
        When we get "/events_planning_search?repo=assignments&states=assigned"
        Then we get list with 4 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_1_ID#"},
            {"_id": "#ASSIGNMENT_2_ID#"},
            {"_id": "#ASSIGNMENT_3_ID#"},
            {"_id": "#ASSIGNMENT_4_ID#"}
        ]}
        """

        # In Progress
        When we post to "/assignments/content"
        """
        [{"assignment_id": "#ASSIGNMENT_1_ID#"}]
        """
        Then we get OK response
        When we post to "/assignments/content"
        """
        [{"assignment_id": "#ASSIGNMENT_4_ID#"}]
        """
        Then we get OK response
        When we get "/events_planning_search?repo=assignments&states=in_progress"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_1_ID#"},
            {"_id": "#ASSIGNMENT_4_ID#"}
        ]}
        """

        # Completed
        When we perform complete on assignments "#ASSIGNMENT_1_ID#"
        """
        {}
        """
        Then we get OK response
        When we get "/events_planning_search?repo=assignments&states=completed"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_1_ID#"}
        ]}
        """

        # Multiple States
        When we get "/events_planning_search?repo=assignments&states=assigned,in_progress"
        Then we get list with 3 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_2_ID#"},
            {"_id": "#ASSIGNMENT_3_ID#"},
            {"_id": "#ASSIGNMENT_4_ID#"}
        ]}
        """

    @auth
    Scenario: Search Assignments ignoring scheduled updates
        When we post to "planning"
        """
        [{
            "guid": "planning_2",
            "name": "slug456",
            "planning_date": "2042-06-30T12:00:00+0000",
            "coverages": [{
                "workflow_status": "active",
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                "planning": {
                    "g2_content_type": "text"
                },
                "assigned_to": {
                    "desk": "50ca3437a4f1ec225c378f41",
                    "priority": 1
                },
                "scheduled_updates": [{
                    "workflow_status": "active",
                    "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                    "assigned_to": {
                        "desk": "50ca3437a4f1ec225c378f41",
                        "priority": 1
                    }
                }]
            }]
        }]
        """
        Then we get OK response
        And we store coverage id in "COVERAGE_5_1_ID" from coverage 0
        And we store assignment id in "ASSIGNMENT_5_1_ID" from coverage 0
        And we store scheduled_update id in "COVERAGE_5_2_ID" from scheduled_update 0 of coverage 0
        And we store assignment id in "ASSIGNMENT_5_2_ID" from scheduled_update 0 of coverage 0
        When we get "/events_planning_search?repo=assignments"
        Then we get list with 6 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_1_ID#"},
            {"_id": "#ASSIGNMENT_2_ID#"},
            {"_id": "#ASSIGNMENT_3_ID#"},
            {"_id": "#ASSIGNMENT_4_ID#"},
            {"_id": "#ASSIGNMENT_5_1_ID#"},
            {"_id": "#ASSIGNMENT_5_2_ID#"}
        ]}
        """
        When we get "/events_planning_search?repo=assignments&ignore_scheduled_updates=true"
        Then we get list with 5 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_1_ID#"},
            {"_id": "#ASSIGNMENT_2_ID#"},
            {"_id": "#ASSIGNMENT_3_ID#"},
            {"_id": "#ASSIGNMENT_4_ID#"},
            {"_id": "#ASSIGNMENT_5_1_ID#"}
        ]}
        """
        When we get "/events_planning_search?repo=assignments&ignore_scheduled_updates=false"
        Then we get list with 6 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_1_ID#"},
            {"_id": "#ASSIGNMENT_2_ID#"},
            {"_id": "#ASSIGNMENT_3_ID#"},
            {"_id": "#ASSIGNMENT_4_ID#"},
            {"_id": "#ASSIGNMENT_5_1_ID#"},
            {"_id": "#ASSIGNMENT_5_2_ID#"}
        ]}
        """

    @auth
    Scenario: Search Assignments by metadata
        # Priority
        When we get "/events_planning_search?repo=assignments&priority=5"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_1_ID#"}
        ]}
        """
        When we get "/events_planning_search?repo=assignments&priority=4,3"
        Then we get list with 3 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_2_ID#"},
            {"_id": "#ASSIGNMENT_3_ID#"},
            {"_id": "#ASSIGNMENT_4_ID#"}
        ]}
        """

        # Slugline
        When we get "/events_planning_search?repo=assignments&slugline=donkeys"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_1_ID#"},
            {"_id": "#ASSIGNMENT_2_ID#"}
        ]}
        """
        When we get "/events_planning_search?repo=assignments&slugline=donkeys zebras"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_1_ID#"},
            {"_id": "#ASSIGNMENT_2_ID#"}
        ]}
        """
        # Exact slugline match
        When we get "/events_planning_search?repo=assignments&slugline="donkeys zebras""
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_2_ID#"}
        ]}
        """

        # Genre
        When we get "/events_planning_search?repo=assignments&genre=Article"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_1_ID#"}
        ]}
        """
        When we get "/events_planning_search?repo=assignments&genre=Article,Backgrounder"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_1_ID#"},
            {"_id": "#ASSIGNMENT_4_ID#"}
        ]}
        """

        # ANPA Category
        When we get "/events_planning_search?repo=assignments&anpa_category=sports"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_1_ID#"}
        ]}
        """

        # Language
        When we get "/events_planning_search?repo=assignments&language=en"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_4_ID#"}
        ]}
        """
        When we get "/events_planning_search?repo=assignments&language=en,fi"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_1_ID#"},
            {"_id": "#ASSIGNMENT_4_ID#"}
        ]}
        """

        # Subjects
        When we get "/events_planning_search?repo=assignments&subject=soccer"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_1_ID#"}
        ]}
        """
        # Custom Subjects
        When we get "/events_planning_search?repo=assignments&subject=soccer,locality:international"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_1_ID#"}
        ]}
        """

        # Custom Texts
        When we get "/events_planning_search?repo=assignments&custom_text=my_name:Elephants"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_1_ID#"},
            {"_id": "#ASSIGNMENT_2_ID#"}
        ]}
        """
        When we get "/events_planning_search?repo=assignments&custom_text=my_name:Elephants creative"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_1_ID#"}
        ]}
        """
        When we get "/events_planning_search?repo=assignments&custom_text=my_name:Elephants,my_description:paint"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_1_ID#"},
            {"_id": "#ASSIGNMENT_2_ID#"}
        ]}
        """
        When we get "/events_planning_search?repo=assignments&custom_text=my_name:Elephants creative,my_description:paint dancing"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_1_ID#"}
        ]}
        """
        When we get "/events_planning_search?repo=assignments&custom_text=my_name:Elephants,my_description:paint cats NOT dancing"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_2_ID#"}
        ]}
        """

    @auth
    Scenario: Search Assignments using query_string
        When we get "/events_planning_search?repo=assignments&search_query=Zoo"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_1_ID#"},
            {"_id": "#ASSIGNMENT_2_ID#"}
        ]}
        """

        When we get "/events_planning_search?repo=assignments&search_query=zoo AND (escape OR arrive)"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_1_ID#"},
            {"_id": "#ASSIGNMENT_2_ID#"}
        ]}
        """

        When we get "/events_planning_search?repo=assignments&search_query=Don*"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_1_ID#"},
            {"_id": "#ASSIGNMENT_2_ID#"}
        ]}
        """

        # Location details
        When we get "/events_planning_search?repo=assignments&search_query=Czechia"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_1_ID#"}
        ]}
        """

    @auth
    Scenario: Filter Assignments by scheduled date
        When we get "/events_planning_search?repo=assignments&date_filter=today"
        Then we get list with 1 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_2_ID#"}
        ]}
        """

        When we get "/events_planning_search?repo=assignments&date_filter=current"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_1_ID#"},
            {"_id": "#ASSIGNMENT_2_ID#"}
        ]}
        """
        When we get "/events_planning_search?repo=assignments&date_filter=future"
        Then we get list with 2 items
        """
        {"_items": [
            {"_id": "#ASSIGNMENT_3_ID#"},
            {"_id": "#ASSIGNMENT_4_ID#"}
        ]}
        """

    @auth
    Scenario: Search Assignments with pagination
        # Max Results & Page
        When we get "/events_planning_search?repo=assignments&max_results=2&page=1"
        Then we get existing resource
        """
        {
            "_items": [{"_id": "#ASSIGNMENT_1_ID#"}, {"_id": "#ASSIGNMENT_2_ID#"}],
            "_meta": {"max_results": 2, "page": 1, "total": 4}
        }
        """
        When we get "/events_planning_search?repo=assignments&max_results=2&page=2"
        Then we get existing resource
        """
        {
            "_items": [{"_id": "#ASSIGNMENT_3_ID#"}, {"_id": "#ASSIGNMENT_4_ID#"}],
            "_meta": {"max_results": 2, "page": 2, "total": 4}
        }
        """

        # Sort Field & Order
        When we get "/events_planning_search?repo=assignments&sort_order=asc&sort_field=schedule"
        Then we get the following order
        """
        ["#ASSIGNMENT_1_ID#", "#ASSIGNMENT_2_ID#", "#ASSIGNMENT_3_ID#", "#ASSIGNMENT_4_ID#"]
        """
        When we get "/events_planning_search?repo=assignments&sort_order=desc&sort_field=schedule"
        Then we get the following order
        """
        ["#ASSIGNMENT_4_ID#", "#ASSIGNMENT_3_ID#", "#ASSIGNMENT_2_ID#", "#ASSIGNMENT_1_ID#"]
        """
        When we get "/events_planning_search?repo=assignments&sort_order=asc&sort_field=priority"
        Then we get the following order
        """
        ["#ASSIGNMENT_1_ID#", "#ASSIGNMENT_4_ID#", "#ASSIGNMENT_2_ID#", "#ASSIGNMENT_3_ID#"]
        """
        When we get "/events_planning_search?repo=assignments&sort_order=desc&sort_field=priority"
        Then we get the following order
        """
        ["#ASSIGNMENT_2_ID#", "#ASSIGNMENT_3_ID#", "#ASSIGNMENT_4_ID#", "#ASSIGNMENT_1_ID#"]
        """

        # Projection
        When we get "/events_planning_search?repo=assignments&max_results=1&projections=["assigned_to"]"
        Then we get existing resource
        """
        {"_items": [{
            "_id": "#ASSIGNMENT_1_ID#",
            "assigned_to": {"desk": "50ca3437a4f1ec225c378f41", "state": "assigned"},
            "planning": "__no_value__"
        }]}
        """
