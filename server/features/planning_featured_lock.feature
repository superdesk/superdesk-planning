# Created by superdesk at 7/4/18
Feature: Planning Featured Lock

  @auth
  @notification
  Scenario: Can obtain lock
    Given empty "planning_featured_lock"
    When we post to "planning_featured_lock"
    """
    [{}]
    """
    Then we get new resource
    """
    {"lock_user": "#CONTEXT_USER_ID#"}
    """
    And we get notifications
    """
    [{
        "event": "planning_featured_lock:lock",
        "extra": {"user": "#CONTEXT_USER_ID#"}
    }]
    """

  @auth
  Scenario: Obtaining lock fails when another user holds the lock
    Given empty "planning_featured_lock"
    When we post to "planning_featured_lock"
    """
    [{}]
    """
    Then we get new resource
    """
    {"lock_user": "#CONTEXT_USER_ID#"}
    """
    When we get "/planning_featured_lock"
    Then we get list with 1 items
    """
    {"_items": [{"lock_user": "#CONTEXT_USER_ID#"}]}
    """
    When we switch user
    When we post to "planning_featured_lock"
    """
    [{}]
    """
    Then we get error 403
    """
    {"_message": "Featured stories already being managed by another user."}
    """

    @auth
    @notification
    Scenario: Can unlock
      Given empty "planning_featured_lock"
      When we post to "planning_featured_lock"
      """
      [{ }]
      """
      Then we get new resource
      """
      {"lock_user": "#CONTEXT_USER_ID#"}
      """
      When we get "/planning_featured_lock"
      Then we get list with 1 items
      """
      {"_items": [{"lock_user": "#CONTEXT_USER_ID#"}]}
      """
      When we post to "planning_featured_unlock"
      """
      [{}]
      """
      Then we get OK response
      And we get notifications
      """
      [{
        "event": "planning_featured_lock:unlock",
         "extra": {"user": "#CONTEXT_USER_ID#"}
      }]
      """
      When we get "/planning_featured_lock"
      Then we get list with 0 items