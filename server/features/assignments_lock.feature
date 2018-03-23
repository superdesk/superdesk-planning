Feature: Assignments Locking

    @auth
    Scenario: Lock assignment fails if workflow state has conflict
        Given "assignments"
        """
        [{
            "_id": "a123",
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "Politic Desk",
                "user": "507f191e810c19729de870eb",
                "state": "cancelled"
            }
        }]
        """
        When we post to "/assignments/a123/lock"
        """
        {"lock_action": "edit"}
        """
        Then we get error 400
        """
        {"_message": "Assignment workflow state error."}
        """

    @auth
    Scenario: Can lock assignment
        Given "assignments"
        """
        [{
            "_id": "a123",
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "Politic Desk",
                "user": "507f191e810c19729de870eb",
                "state": "assigned"
            }
        }]
        """
        When we post to "/assignments/a123/lock"
        """
        {"lock_action": "edit"}
        """
        Then we get existing resource
        """
        {
            "_id": "a123",
            "lock_user": "#CONTEXT_USER_ID#",
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "Politic Desk",
                "user": "507f191e810c19729de870eb",
                "state": "assigned"
            }
        }
        """

    @auth
    Scenario: Lock fails if associated content item is locked by another user
        Given "desks"
        """
        [{"name": "Sports", "content_expiry": 60, "members": [{"user": "#CONTEXT_USER_ID#"}]}]
        """
        When we post to "/archive"
        """
        [{
            "type": "text",
            "headline": "test headline",
            "slugline": "test slugline",
            "task": {
                "desk": "#desks._id#",
                "stage": "#desks.incoming_stage#"
            }
        }]
        """
        Then we get OK response
        When we post to "/planning"
        """
        [{
            "item_class": "item class value",
            "slugline": "test slugline"
        }]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#"
                }
            }]
        }
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#"
        }]
        """
        Then we get OK response
        When we post to "/archive/#archive._id#/lock"
        """
        { "lock_action": "edit" }
        """
        Then we get OK response
        When we switch user
        When we post to "/assignments/#firstassignment#/lock"
        """
        {"lock_action": "edit"}
        """
        Then we get error 400
        """
        {"_message": "Archive item is locked by another user."}
        """

    @auth
    Scenario: Unlocking assignment releases lock
        Given "assignments"
        """
        [{
            "_id": "a123",
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "Politic Desk",
                "user": "507f191e810c19729de870eb",
                "state": "assigned"
            }
        }]
        """
        When we post to "/assignments/a123/lock"
        """
        {"lock_action": "edit"}
        """
        Then we get existing resource
        """
        {
            "_id": "a123",
            "lock_user": "#CONTEXT_USER_ID#",
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "Politic Desk",
                "user": "507f191e810c19729de870eb",
                "state": "assigned"
            }
        }
        """
        When we post to "/assignments/a123/unlock"
        """
        {}
        """
        Then we get existing resource
        """
        {
            "_id": "a123",
            "lock_user": null,
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "headline": "test headline",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "Politic Desk",
                "user": "507f191e810c19729de870eb",
                "state": "assigned"
            }
        }
        """

    @auth
    Scenario: Unlocking assignment has no effect is linked content is still locked
        Given "desks"
        """
        [{"name": "Sports", "content_expiry": 60, "members": [{"user": "#CONTEXT_USER_ID#"}]}]
        """
        When we post to "/archive"
        """
        [{
            "type": "text",
            "headline": "test headline",
            "slugline": "test slugline",
            "task": {
                "desk": "#desks._id#",
                "stage": "#desks.incoming_stage#"
            }
        }]
        """
        Then we get OK response
        When we post to "/planning"
        """
        [{
            "item_class": "item class value",
            "slugline": "test slugline"
        }]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#"
                }
            }]
        }
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#"
        }]
        """
        Then we get OK response
        When we post to "/archive/#archive._id#/lock"
        """
        { "lock_action": "edit" }
        """
        Then we get OK response
        When we post to "/assignments/#firstassignment#/unlock"
        """
        {}
        """
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
            "lock_user": "#CONTEXT_USER_ID#",
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }
        """

    @auth
    Scenario: Locking archive item locks the assignment
        Given "desks"
        """
        [{"name": "Sports", "content_expiry": 60, "members": [{"user": "#CONTEXT_USER_ID#"}]}]
        """
        When we post to "/archive"
        """
        [{
            "type": "text",
            "headline": "test headline",
            "slugline": "test slugline",
            "task": {
                "desk": "#desks._id#",
                "stage": "#desks.incoming_stage#"
            }
        }]
        """
        Then we get OK response
        When we post to "/planning"
        """
        [{
            "item_class": "item class value",
            "slugline": "test slugline"
        }]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#"
                }
            }]
        }
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#"
        }]
        """
        Then we get OK response
        When we post to "/archive/#archive._id#/lock"
        """
        { "lock_action": "edit" }
        """
        Then we get OK response
        When we get "/assignments/#firstassignment#"
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
            "lock_user": "#CONTEXT_USER_ID#",
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }
        """

    @auth
    Scenario: Locking archive item fails if assignment is already locked
        Given "desks"
        """
        [{"name": "Sports", "content_expiry": 60, "members": [{"user": "#CONTEXT_USER_ID#"}]}]
        """
        When we post to "/archive"
        """
        [{
            "type": "text",
            "headline": "test headline",
            "slugline": "test slugline",
            "task": {
                "desk": "#desks._id#",
                "stage": "#desks.incoming_stage#"
            }
        }]
        """
        Then we get OK response
        When we post to "/planning"
        """
        [{
            "item_class": "item class value",
            "slugline": "test slugline"
        }]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#"
                }
            }]
        }
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#"
        }]
        """
        Then we get OK response
        When we post to "/assignments/#firstassignment#/lock"
        """
        {"lock_action": "edit"}
        """
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
            "lock_user": "#CONTEXT_USER_ID#",
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }
        """
        When we switch user
        When we patch "/desks/#desks._id#"
        """
        {"members":[{"user":"#USERS_ID#"},{"user":"#CONTEXT_USER_ID#"}]}
        """
        When we post to "/archive/#archive._id#/lock"
        """
        { "lock_action": "edit" }
        """
        Then we get error 400
        """
        {"_message": "Lock Failed: Related assignment is locked."}
        """

    @auth
    Scenario: Locking archive item locks the assignment
        Given "desks"
        """
        [{"name": "Sports", "content_expiry": 60, "members": [{"user": "#CONTEXT_USER_ID#"}]}]
        """
        When we post to "/archive"
        """
        [{
            "type": "text",
            "headline": "test headline",
            "slugline": "test slugline",
            "task": {
                "desk": "#desks._id#",
                "stage": "#desks.incoming_stage#"
            }
        }]
        """
        Then we get OK response
        When we post to "/planning"
        """
        [{
            "item_class": "item class value",
            "slugline": "test slugline"
        }]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#"
                }
            }]
        }
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#"
        }]
        """
        Then we get OK response
        When we post to "/archive/#archive._id#/lock"
        """
        { "lock_action": "edit" }
        """
        Then we get OK response
        When we get "/assignments/#firstassignment#"
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
            "lock_user": "#CONTEXT_USER_ID#",
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }
        """

    @auth
    Scenario: Unlocking archive item unlocks assignment
        Given "desks"
        """
        [{"name": "Sports", "content_expiry": 60, "members": [{"user": "#CONTEXT_USER_ID#"}]}]
        """
        When we post to "/archive"
        """
        [{
            "type": "text",
            "headline": "test headline",
            "slugline": "test slugline",
            "task": {
                "desk": "#desks._id#",
                "stage": "#desks.incoming_stage#"
            }
        }]
        """
        Then we get OK response
        When we post to "/planning"
        """
        [{
            "item_class": "item class value",
            "slugline": "test slugline"
        }]
        """
        Then we get OK response
        When we patch "/planning/#planning._id#"
        """
        {
            "coverages": [{
                "planning": {
                    "ednote": "test coverage, I want 250 words",
                    "slugline": "test slugline"
                },
                "assigned_to": {
                    "desk": "#desks._id#",
                    "user": "#CONTEXT_USER_ID#"
                }
            }]
        }
        """
        Then we get OK response
        Then we store assignment id in "firstassignment" from coverage 0
        When we post to "assignments/link"
        """
        [{
            "assignment_id": "#firstassignment#",
            "item_id": "#archive._id#"
        }]
        """
        Then we get OK response
        When we post to "/archive/#archive._id#/lock"
        """
        { "lock_action": "edit" }
        """
        Then we get OK response
        When we get "/assignments/#firstassignment#"
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
            "lock_user": "#CONTEXT_USER_ID#",
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }
        """
        When we post to "/archive/#archive._id#/unlock"
        """
        {}
        """
        When we get "/assignments/#firstassignment#"
        Then we get existing resource
        """
        {
            "_id": "#firstassignment#",
            "lock_user": null,
            "planning": {
                "ednote": "test coverage, I want 250 words",
                "slugline": "test slugline"
            },
            "assigned_to": {
                "desk": "#desks._id#",
                "user": "#CONTEXT_USER_ID#"
            }
        }
        """