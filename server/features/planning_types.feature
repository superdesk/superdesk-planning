Feature: Planning Types

    @auth
    Scenario: Get Default Planning Types
      Given empty "planning_types"
      When we get "/planning_types"
      Then we get existing resource
      """
      { "_items": [{ "name": "events", "editor": {
          "slugline": {"enabled": true}},"schema": {
          "slugline": {"minlength": null, "required": false, "type": "string", "maxlength": null}}
      }
      ,{ "name": "planning", "editor": {
          "slugline": {"enabled": true}}
       }]}
      """

    @auth
    Scenario: Get Overridden Planning Types
      Given "planning_types"
      """
      [{"_id": 1, "name": "planning", "editor": {"slugline": {"enabled": false}}}]
      """
      When we get "/planning_types"
      Then we get existing resource
      """
      { "_items": [{ "name": "events", "editor": {
          "slugline": {"enabled": true}}
       },{ "name": "planning", "editor": {
          "slugline": {"enabled": false}}
       }]}
      """
