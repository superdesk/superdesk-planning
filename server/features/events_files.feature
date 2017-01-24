Feature: Events Files

    @auth
    Scenario: Empty events_files list
        Given empty "events_files"
        When we get "/events_files"
        Then we get list with 0 items

    @auth
    Scenario: Upload a file
        When we upload a file "bike.jpg" to "/events_files"
        Then we get an event file reference
        And we can delete that event file
