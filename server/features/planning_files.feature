Feature: Planning Files

    @auth
    Scenario: Delete fails if a file is used by planning item
        When we upload a file "bike.jpg" to "/planning_files"
        Then we get an event file reference
        When we get "planning_files/"
        Then we get list with 1 items
        """
        {"_items": [{ "_id": "#planning_files._id#" }]}
        """
        When we post to "planning"
        """
        {
            "slugline": "file test",
            "planning_date": "2016-01-02",
            "type": "planning",
            "files": ["#planning_files._id#"]
        }
        """
        Then we get OK response
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "slugline": "file test",
            "type": "planning",
            "files": ["#planning_files._id#"]
        }
        """
        When we delete "planning_files/#planning_files._id#"
        Then we get error 403

    @auth
    Scenario: Delete fails if a file is used by a coverage
        When we upload a file "bike.jpg" to "/planning_files"
        Then we get an event file reference
        When we get "planning_files/"
        Then we get list with 1 items
        """
        {"_items": [{ "_id": "#planning_files._id#" }]}
        """
        When we post to "planning"
        """
        {
            "slugline": "file test",
            "planning_date": "2016-01-02",
            "type": "planning",
            "files": ["#planning_files._id#"],
            "coverages": [
                {
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "files": ["#planning_files._id#"]
                    }
                }
            ]
        }
        """
        Then we get OK response
        When we get "/planning/#planning._id#"
        Then we get existing resource
        """
        {
            "_id": "#planning._id#",
            "slugline": "file test",
            "type": "planning",
            "files": ["#planning_files._id#"],
            "coverages": [
                {
                    "workflow_status": "draft",
                    "news_coverage_status": {
                      "qcode": "ncostat:int"
                    },
                    "planning": {
                        "ednote": "test coverage, I want 250 words",
                        "headline": "test headline",
                        "slugline": "test slugline",
                        "files": ["#planning_files._id#"]
                    }
                }
            ]

        }
        """
        When we delete "planning_files/#planning_files._id#"
        Then we get error 403

