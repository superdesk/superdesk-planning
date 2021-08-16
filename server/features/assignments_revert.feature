Feature: Assignment Revert

  @auth
  @notification
  Scenario: Assignment State goes back to revert_state
    Given "desks"
    """
    [{"_id": "desk123", "name": "Politic Desk"}]
    """
    Given "assignments"
    """
    [{
        "_id": "aaaaaaaaaaaaaaaaaaaaaaaa",
        "planning": {
            "ednote": "test coverage, I want 250 words",
            "headline": "test headline",
            "slugline": "test slugline",
            "g2_content_type": "live_video",
            "scheduled": "2016-01-02T14:00:00+0000"
        },
        "assigned_to": {
            "desk": "desk123",
            "user": "#CONTEXT_USER_ID#",
            "state": "completed",
            "revert_state": "assigned"
        }
    }]
    """
    When we post to "/assignments/#assignments._id#/lock"
    """
    {"lock_action": "revert"}
    """
    Then we get OK response
    When we perform revert on assignments "#assignments._id#"
    """
    { }
    """
    Then we get OK response
    When we get "/assignments/#assignments._id#"
    Then we get OK response
    Then we get existing resource
    """
    {
        "_id": "aaaaaaaaaaaaaaaaaaaaaaaa",
        "planning": {
            "ednote": "test coverage, I want 250 words",
            "headline": "test headline",
            "slugline": "test slugline",
            "g2_content_type": "live_video",
            "scheduled": "2016-01-02T14:00:00+0000"
        },
        "assigned_to": {
            "desk": "desk123",
            "user": "#CONTEXT_USER_ID#",
            "state": "assigned"
        }
    }
    """
    
  @auth
  @notification
  @vocabularies
  Scenario: Text Assignments cannot be reverted
    Given "vocabularies"
    """
        [{
          "_id": "g2_content_type",
          "display_name": "Coverage content types",
          "type": "manageable",
          "unique_field": "qcode",
          "selection_type": "do not show",
          "items": [
              {"is_active": true, "name": "Text", "qcode": "text", "content item type": "text"}
          ]
        }]
    """
    Given "assignments"
    """
    [{
        "_id": "aaaaaaaaaaaaaaaaaaaaaaaa",
        "planning": {
            "ednote": "test coverage, I want 250 words",
            "headline": "test headline",
            "slugline": "test slugline",
            "g2_content_type": "text",
            "scheduled": "2016-01-02T14:00:00+0000"
        },
        "assigned_to": {
            "desk": "desk123",
            "user": "#CONTEXT_USER_ID#",
            "state": "completed",
            "revert_state": "assigned"
        }
    }]
    """
    When we post to "/assignments/#assignments._id#/lock"
    """
    {"lock_action": "revert"}
    """
    Then we get OK response
    When we perform revert on assignments "#assignments._id#"
    """
    { }
    """
    Then we get error 400
    """
    {"_issues": {"validator exception": "403: Cannot revert text assignments."}}
    """

  @auth
  @notification
  Scenario: Non-Text Assignments should be in completed status for revert action
    Given "assignments"
    """
    [{
        "_id": "aaaaaaaaaaaaaaaaaaaaaaaa",
        "planning": {
            "ednote": "test coverage, I want 250 words",
            "headline": "test headline",
            "slugline": "test slugline",
            "g2_content_type": "live_video",
            "scheduled": "2016-01-02T14:00:00+0000"
        },
        "assigned_to": {
            "desk": "desk123",
            "user": "#CONTEXT_USER_ID#",
            "state": "assigned"
        }
    }]
    """
    When we post to "/assignments/#assignments._id#/lock"
    """
    {"lock_action": "revert"}
    """
    Then we get OK response
    When we perform revert on assignments "#assignments._id#"
    """
    { }
    """
    Then we get error 400
    """
    {"_issues": {"validator exception": "403: Cannot revert an assignment which is not yet confirmed."}}
    """