Feature: Planning Versions

  @auth
  Scenario: Retrive Planning Version
    Given "published_planning"
      """
            [{
          "published_item": {
              "_planning_schedule": [
                  {
                      "scheduled": "2018-06-25T03:00:00+0000"
                  }
              ],
              "name": "Monday sushi day",
              "original_creator": "57bcfc5d1d41c82e8401dcc0",
              "item_id": "urn:newsml:localhost:2018-06-25T11:43:44.511050:f292ab66-9df4-47db-80b1-0f58fd37bf9c",
              "lock_action": "edit",
              "_etag": "262d53f868f88ede2ea9a0b4e40621d9012095d1",
              "calendars": [
                  {
                      "name": "Holidays",
                      "is_active": true,
                      "qcode": "holidays"
                  }
              ],
              "dates": {
                  "end": "2018-06-25T04:00:00+0000",
                  "tz": "Australia/Sydney",
                  "start": "2018-06-25T03:00:00+0000"
              },
              "state": "scheduled",
              "type": "event",
              "_id": "urn:newsml:localhost:2018-06-25T11:43:44.511050:f292ab66-9df4-47db-80b1-0f58fd37bf9c",
              "slugline": "LUNCH",
              "files": [],
              "_type": "events",
              "_current_version": 6366549127730893,
              "pubstatus": "usable",
              "lock_session": "5b2719c61d41c8a702425889",
              "lock_user": "57bcfc5d1d41c82e8401dcc0",
              "guid": "urn:newsml:localhost:2018-06-25T11:43:44.511050:f292ab66-9df4-47db-80b1-0f58fd37bf9c",
              "occur_status": {
                  "name": "Planned, occurs certainly",
                  "qcode": "eocstat:eos5",
                  "label": "Confirmed"
              }
          },
          "item_id": "urn:newsml:localhost:2018-06-25T11:43:44.511050:f292ab66-9df4-47db-80b1-0f58fd37bf9c",
          "version": 6366549127730893,
          "type": "event"
      },
      {
          "item_id": "urn:aapsportsfixtures:3:int-476:int-603355",
          "published_item": {
              "definition_short": "Test Series match 1 Sri Lanka V South Africa",
              "lock_action": "edit",
              "_current_version": 6366566284435790,
              "source": "AAP SPORTRES",
              "_id": "urn:aapsportsfixtures:3:int-476:int-603355",
              "name": "CRIK: SRI V RSA",
              "location": [
                  {
                      "name": "Galle International Cricket Stadium",
                      "qcode": "urn:newsml:localhost:2018-05-25T11:05:34.004752:280b5c0e-814b-4620-b4a7-6578e0ca0da3",
                      "address": {
                          "locality": "Galle",
                          "postal_code": "80600",
                          "line": [
                              "Esplanade Road"
                          ],
                          "area": "Kaluwella",
                          "country": "Sri Lanka"
                      }
                  }
              ],
              "pubstatus": "usable",
              "subject": [
                  {
                      "name": "cricket",
                      "qcode": "15017000"
                  },
                  {
                      "name": "sport",
                      "qcode": "15000000"
                  }
              ],
              "type": "event",
              "item_id": "urn:aapsportsfixtures:3:int-476:int-603355",
              "_etag": "3aadc7c001309040a9f1fb81c6d81618efd81d83",
              "anpa_category": [
                  {
                      "name": "Overseas Sport",
                      "qcode": "s"
                  }
              ],
              "ingest_provider": "5923b82f1d41c858e1a5b0ce",
              "occur_status": {
                  "label": "Confirmed",
                  "name": "Planned, occurs certainly",
                  "qcode": "eocstat:eos5"
              },
              "state": "scheduled",
              "slugline": "CRIK: SRI",
              "ingest_provider_sequence": "7650",
              "calendars": [
                  {
                      "name": "Sport",
                      "is_active": true,
                      "qcode": "sport"
                  }
              ],
              "original_creator": "",
              "guid": "urn:aapsportsfixtures:3:int-476:int-603355"
          },
          "version": 6366566284435790,
          "type": "event"
      },
      {
          "item_id": "urn:aapsportsfixtures:3:int-476:int-603355",
          "published_item": {
              "definition_short": "Test Series match 1 Sri Lanka V South Africa",
              "lock_action": "edit",
              "_current_version": 6366566298831032,
              "source": "AAP SPORTRES",
              "_id": "urn:aapsportsfixtures:3:int-476:int-603355",
              "name": "CRIK: SRI V RSA",
              "location": [
                  {
                      "name": "Galle International Cricket Stadium",
                      "qcode": "urn:newsml:localhost:2018-05-25T11:05:34.004752:280b5c0e-814b-4620-b4a7-6578e0ca0da3",
                      "address": {
                          "locality": "Galle",
                          "postal_code": "80600",
                          "line": [
                              "Esplanade Road"
                          ],
                          "area": "Kaluwella",
                          "country": "Sri Lanka"
                      }
                  }
              ],
              "pubstatus": "usable",
              "subject": [
                  {
                      "name": "cricket",
                      "qcode": "15017000"
                  },
                  {
                      "name": "sport",
                      "qcode": "15000000"
                  },
                  {
                      "name": "Agencies",
                      "scheme": "coverage_providers",
                      "qcode": "agencies"
                  },
                  {
                      "name": "Middleish",
                      "scheme": "assignment_priority",
                      "qcode": 2
                  }
              ],
              "type": "event",
              "item_id": "urn:aapsportsfixtures:3:int-476:int-603355",
              "anpa_category": [
                  {
                      "name": "Overseas Sport",
                      "qcode": "s"
                  }
              ],
              "place": [
                  {
                      "group": "Rest Of World",
                      "name": "ASIA",
                      "state": "",
                      "qcode": "ASIA",
                      "world_region": "Asia",
                      "country": ""
                  }
              ],
              "files": [],
              "ingest_provider": "5923b82f1d41c858e1a5b0ce",
              "occur_status": {
                  "label": "Confirmed",
                  "name": "Planned, occurs certainly",
                  "qcode": "eocstat:eos5"
              },
              "state": "scheduled",
              "internal_note": "Cover the pitch",
              "slugline": "CRIK: SRI",
              "ingest_provider_sequence": "7650",
              "calendars": [
                  {
                      "name": "Sport",
                      "is_active": true,
                      "qcode": "sport"
                  }
              ],
              "original_creator": "",
              "guid": "urn:aapsportsfixtures:3:int-476:int-603355"
          },
          "version": 6366566298831032,
          "type": "event"
      }]
      """
    When we get "/published_planning?where={\"item_id\": \"urn:aapsportsfixtures:3:int-476:int-603355\", \"version\": 6366566284435790}"
    Then we get a list with 1 items
    """
        {"_items": [{"item_id" : "urn:aapsportsfixtures:3:int-476:int-603355", "version": 6366566284435790}]}
    """