Feature: Locations

    @auth
    Scenario: Empty locations list
        Given empty "locations"
        When we get "/locations"
        Then we get list with 0 items
