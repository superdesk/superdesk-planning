Feature: Planning Item Locking

    @auth
    Scenario: Lock item and edit
        Given "planning"
        """
        [{
            "slugline": "TestPlan"
        }]
        """
        When we post to "/planning/#planning._id#/lock"
        """
        {"lock_action": "edit"}
        """
        Then we get new resource
        """
        {
          "_id": "#planning._id#", "slugline": "TestPlan", "lock_user": "#CONTEXT_USER_ID#"
        }
        """
        When we patch "/planning/#planning._id#/"
        """
        {"slugline": "TestPlan-2"}
        """
        Then we get OK response

    @auth
    Scenario: Fail edit on locked item
        Given "planning"
        """
        [{
            "slugline": "TestPlan"
        }]
        """
        When we post to "/planning/#planning._id#/lock"
        """
        {"lock_action": "edit"}
        """
        Then we get new resource
        """
        {
          "_id": "#planning._id#", "slugline": "TestPlan", "lock_user": "#CONTEXT_USER_ID#"
        }
        """
        When we switch user
        When we patch "/planning/#planning._id#/"
        """
        {"slugline": "TestPlan-2"}
        """
        Then we get error 400

    @auth
    Scenario: Fail lock if item is locked in another session
        Given "planning"
        """
        [{
            "slugline": "TestPlan"
        }]
        """
        When we post to "/planning/#planning._id#/lock"
        """
        {"lock_action": "edit"}
        """
        Then we get new resource
        """
        {
          "_id": "#planning._id#", "slugline": "TestPlan", "lock_user": "#CONTEXT_USER_ID#"
        }
        """
        When we setup test user
        When we post to "/planning/#planning._id#/lock"
        """
        {"lock_action": "edit"}
        """
        Then we get error 403

    @auth
    Scenario: Fail to unlock a planning item without privilege
    Given "planning"
      """
      [{
          "slugline": "TestPlan"
      }]
      """
      When we post to "/planning/#planning._id#/lock"
      """
      {"lock_action": "edit"}
      """
      Then we get new resource
      """
      {
        "_id": "#planning._id#", "slugline": "TestPlan", "lock_user": "#CONTEXT_USER_ID#"
      }
      """
      When we switch user
      When we patch "/users/#USERS_ID#"
      """
      {"user_type": "user", "privileges": {"planning_unlock":0}}
      """
      Then we get OK response
      When we post to "/planning/#planning._id#/unlock"
      """
      {}
      """
      Then we get error 403

    @auth
    Scenario: Can unlock a planning item and edit it
      Given "planning"
        """
        [{
            "slugline": "TestPlan"
        }]
        """
        When we post to "/planning/#planning._id#/lock"
        """
        {"lock_action": "edit"}
        """
        Then we get new resource
        """
        {
          "_id": "#planning._id#", "slugline": "TestPlan", "lock_user": "#CONTEXT_USER_ID#"
        }
        """
        When we switch user
        When we post to "/planning/#planning._id#/unlock"
        """
        {}
        """
        Then we get OK response
        When we post to "/planning/#planning._id#/lock"
        """
        {"lock_action": "edit"}
        """
        When we patch "/planning/#planning._id#/"
        """
        {"slugline": "TestPlan-2"}
        """
        Then we get OK response
