Feature: Events Template

    @auth
    Scenario: Empty events template list
        Given empty "events_template"
        When we get "/events_template"
        Then we get list with 0 items

    @auth
    Scenario: Create new event template fails with wrong based_on_event value
        When we post to "/events_template"
        """
        [
            {
                "template_name": "Formula one finals"
            }
        ]
        """
        Then we get error 400
        """
        {
            "_error": {
                "code": 400, "message": "Insertion failure: 1 document(s) contain(s) error(s)"
            },
            "_issues": {
                "based_on_event": {"required": 1}
            },
            "_status": "ERR"
        }
        """
        When we post to "/events_template"
        """
        [
            {
                "based_on_event": "urn:newsml:localhost:5000:2019-06-04T11:55:43.319428:4e1d8468-8330-463f-9d8a-20fc02869752",
                "template_name": "Formula one finals"
            }
        ]
        """
        Then we get error 400
        """
        {
            "_error": {
                "code": 400, "message": "Insertion failure: 1 document(s) contain(s) error(s)"
            },
            "_issues": {
                "based_on_event": "value 'urn:newsml:localhost:5000:2019-06-04T11:55:43.319428:4e1d8468-8330-463f-9d8a-20fc02869752' must exist in resource 'events', field '_id'."
            },
            "_status": "ERR"
        }
        """

    @auth
    Scenario: Create new event template fails with read only fields
        Given "contacts"
        """
        [{"first_name": "Albert", "last_name": "Foo"}]
        """
        When we upload a file "bike.jpg" to "/events_files"
        Then we get an event file reference
        When we post to "/events_template"
        """
        [
            {
                "based_on_event": "5cefd99cfe985e0a311bb677",
                "template_name": "Formula one",
                "data": {
                    "calendars": [
                        {
                            "is_active": true,
                            "name": "Entertainment",
                            "qcode": "entertainment"
                        },
                        {
                            "is_active": true,
                            "name": "Finance",
                            "qcode": "finance"
                        }
                    ],
                    "definition_long": "THIS IS LONG DESC",
                    "definition_short": "Grand prix formula 1 Prague",
                    "ednote": "THIS IS ED NOTE",
                    "event_contact_info": [
                        "#contacts._id#"
                    ],
                    "files": [
                        "#events_files._id#"
                    ],
                    "internal_note": "THIS IS INT NOTE",
                    "links": [
                        "http://example.com",
                        "http://somedomain.cz"
                    ],
                    "location": [
                        {
                            "address": {
                                "boundingbox": [
                                    "49.9419006",
                                    "50.1774301",
                                    "14.2244355",
                                    "14.7067869"
                                ],
                                "country": "Czechia",
                                "line": [
                                    ""
                                ],
                                "locality": "Prague",
                                "title": null,
                                "type": "city"
                            },
                            "formatted_address": "Prague Czechia",
                            "location": {
                                "lat": 50.0874654,
                                "lon": 14.4212535
                            },
                            "name": "Praha",
                            "qcode": "urn:newsml:localhost:5000:2019-06-04T11:55:43.146372:16d4043c-826e-4c25-a743-5f747baedde7"
                        }
                    ],
                    "name": "Grand prix F1",
                    "occur_status": {
                        "label": "Planned, occurence planned only",
                        "name": "Planned, occurence planned only",
                        "qcode": "eocstat:eos1"
                    },
                    "slugline": "Grand prix",
                    "subject": [
                        {
                            "name": "Innenriks",
                            "qcode": "Innenriks",
                            "scheme": "category",
                            "service": {
                                "e": 1,
                                "i": 1,
                                "j": 1,
                                "m": 1,
                                "n": 1,
                                "s": 1,
                                "t": 1
                            }
                        },
                        {
                            "name": "Kultur og underholdning",
                            "parent": null,
                            "qcode": "01000000",
                            "scheme": "subject_custom"
                        },
                        {
                            "name": "Kriminalitet og rettsvesen",
                            "parent": null,
                            "qcode": "02000000",
                            "scheme": "subject_custom"
                        }
                    ]
                }
            }
        ]
        """
        Then we get error 400
        """
        {
            "_error": {
                "code": 400,
                "message": "Insertion failure: 1 document(s) contain(s) error(s)"
            },
            "_issues": {
                "based_on_event": "value '5cefd99cfe985e0a311bb677' must exist in resource 'events', field '_id'.",
                "data": {
                    "calendars": "field is read-only",
                    "definition_long": "field is read-only",
                    "definition_short": "field is read-only",
                    "ednote": "field is read-only",
                    "event_contact_info": "field is read-only",
                    "files": "field is read-only",
                    "internal_note": "field is read-only",
                    "links": "field is read-only",
                    "location": "field is read-only",
                    "name": "field is read-only",
                    "occur_status": "field is read-only",
                    "slugline": "field is read-only",
                    "subject": "field is read-only"
                }
            },
            "_status": "ERR"
        }
        """

    @auth
    Scenario: Create new event template success
        Given "contacts"
        """
        [
            {
                "_id": "5cefd99cfe985e0a311bb688",
                "honorific" : "Mr.",
                "first_name" : "John",
                "last_name" : "Smith",
                "organisation" : "Apple",
                "job_title" : "devops",
                "contact_email" : [
                    "johnsmith@example.com"
                ],
                "facebook" : "https://www.facebook.com/j.smith",
                "instagram" : "https://www.instagram.com/j.smith"
            }
        ]
        """
        Given "events_files"
        """
        [
            {
                "_id" : "5cefd99cfe985e0a311bb677",
                "media" : "5cefd99cfe985e0a311bb675",
                "filemeta" : {
                    "media_id" : "5cefd99cfe985e0a311bb675"
                }
            }
        ]
        """
        Given "locations"
        """
        [
            {
                "_id" : "5cf6401ffe985e2a9d8529d8",
                "unique_name" : "Prague, Прага, Столица Прага, Prague, Czechia",
                "name" : "Praha",
                "address" : {
                    "title" : null,
                    "line" : [
                        ""
                    ],
                    "locality" : "Prague",
                    "country" : "Czechia",
                    "external" : {
                        "nominatim" : {
                            "place_id" : 198147436,
                            "licence" : "Data © OpenStreetMap contributors, ODbL 1.0. https://osm.org/copyright",
                            "osm_type" : "relation",
                            "osm_id" : 439840,
                            "boundingbox" : [
                                "49.9419006",
                                "50.1774301",
                                "14.2244355",
                                "14.7067869"
                            ],
                            "lat" : "50.0874654",
                            "lon" : "14.4212535",
                            "display_name" : "Prague, Прага, Столица Прага, Prague, Czechia",
                            "class" : "place",
                            "type" : "city",
                            "importance" : 0.873394835100681,
                            "icon" : "https://nominatim.openstreetmap.org/images/mapicons/poi_place_city.p.20.png",
                            "address" : {
                                "city" : "Prague",
                                "county" : "Прага",
                                "state" : "Prague",
                                "country" : "Czechia",
                                "country_code" : "cz"
                            },
                            "extratags" : {
                                "place" : "city",
                                "capital" : "yes",
                                "website" : "http://www.praha.eu/",
                                "wikidata" : "Q1085",
                                "wikipedia" : "cs:Praha",
                                "population" : "1251933",
                                "name:prefix" : "hlavní město"
                            },
                            "namedetails" : {
                                "ref" : "CZ0100554782",
                                "name" : "Praha",
                                "name:en" : "Prague"
                            }
                        }
                    },
                    "type" : "city",
                    "boundingbox" : [
                        "49.9419006",
                        "50.1774301",
                        "14.2244355",
                        "14.7067869"
                    ]
                },
                "position" : {
                    "latitude" : 50.0874654,
                    "longitude" : 14.4212535
                },
                "type" : "Unclassified",
                "is_active" : true
            }
        ]
        """
        Given "vocabularies"
        """
        [
            {
                "_id": "eventoccurstatus",
                        "display_name": "Event Occurence Status",
                        "type": "manageable",
                        "unique_field": "qcode",
                        "items": [
                            {"is_active": true, "qcode": "eocstat:eos0", "name": "Unplanned event"},
                            {"is_active": true, "qcode": "eocstat:eos1", "name": "Planned, occurence planned only"},
                            {"is_active": true, "qcode": "eocstat:eos2", "name": "Planned, occurence highly uncertain"},
                            {"is_active": true, "qcode": "eocstat:eos3", "name": "Planned, May occur"},
                            {"is_active": true, "qcode": "eocstat:eos4", "name": "Planned, occurence highly likely"},
                            {"is_active": true, "qcode": "eocstat:eos5", "name": "Planned, occurs certainly"},
                            {"is_active": true, "qcode": "eocstat:eos6", "name": "Planned, then cancelled"}
                        ]
            },
            {
                "_id" : "event_calendars",
                "display_name" : "Event Calendars",
                "type" : "manageable",
                "selection_type" : "do not show",
                "unique_field" : "qcode",
                "items" : [
                    {
                        "is_active" : true,
                        "name" : "Sport",
                        "qcode" : "sport"
                    },
                    {
                        "is_active" : true,
                        "name" : "Finance",
                        "qcode" : "finance"
                    },
                    {
                        "is_active" : true,
                        "name" : "Entertainment",
                        "qcode" : "entertainment"
                    }
                ],
                "schema" : {
                    "name" : {},
                    "qcode" : {}
                },
                "service" : {},
                "init_version" : 3
            },
            {
                "_id" : "category",
                "display_name" : "Category",
                "type" : "manageable",
                "service" : {
                    "all" : 1
                },
                "selection_type" : "single selection",
                "dependent" : 1,
                "items" : [
                    {
                        "is_active" : true,
                        "name" : "Innenriks",
                        "qcode" : "Innenriks",
                        "service" : {
                            "n" : 1,
                            "s" : 1,
                            "e" : 1,
                            "t" : 1,
                            "m" : 1,
                            "j" : 1,
                            "i" : 1
                        }
                    },
                    {
                        "is_active" : true,
                        "name" : "Utenriks",
                        "qcode" : "Utenriks",
                        "service" : {
                            "n" : 1,
                            "s" : 1,
                            "e" : 1,
                            "t" : 1,
                            "m" : 1,
                            "i" : 1
                        }
                    },
                    {
                        "is_active" : true,
                        "name" : "Sport",
                        "qcode" : "Sport",
                        "service" : {
                            "n" : 1,
                            "s" : 1,
                            "e" : 1,
                            "t" : 1,
                            "m" : 1,
                            "i" : 1
                        }
                    }
                ],
                "schema" : {
                    "name" : {},
                    "qcode" : {},
                    "service" : {
                        "type" : "object"
                    }
                },
                "init_version" : 3,
                "unique_field" : "qcode"
            },
            {
                "_id" : "subject_custom",
                "display_name" : "Subject",
                "type" : "manageable",
                "selection_type" : "multi selection",
                "service" : {
                    "all" : 1
                },
                "schema_field" : "subject",
                "dependent" : 0,
                "items" : [
                    {
                        "is_active" : true,
                        "name" : "Kultur og underholdning",
                        "qcode" : "01000000",
                        "parent" : null
                    },
                    {
                        "is_active" : true,
                        "name" : "Kriminalitet og rettsvesen",
                        "qcode" : "02000000",
                        "parent" : null
                    },
                    {
                        "is_active" : true,
                        "name" : "Ulykker og naturkatastrofer",
                        "qcode" : "03000000",
                        "parent" : null
                    }
                ]
            }
        ]
        """
        When we post to "/events"
        """
        [
            {
                "occur_status": {
                    "qcode": "eocstat:eos1",
                    "name": "Planned, occurence planned only",
                    "label": "Planned, occurence planned only"
                },
                "dates": {
                    "start": "2019-06-11T09:00:00+0000",
                    "end": "2019-06-30T21:00:00+0000",
                    "tz": "Africa/Accra"
                },
                "calendars": [
                    {
                        "is_active": true,
                        "name": "Entertainment",
                        "qcode": "entertainment"
                    },
                    {
                        "is_active": true,
                        "name": "Finance",
                        "qcode": "finance"
                    }
                ],
                "state": "draft",
                "place": [],
                "slugline": "Grand prix",
                "name": "Grand prix F1",
                "definition_short": "Grand prix formula 1 Prague",
                "location": [
                    {
                        "name": "Praha",
                        "qcode": "urn:newsml:localhost:5000:2019-06-04T11:55:43.146372:16d4043c-826e-4c25-a743-5f747baedde7",
                        "location": {
                            "lat": 50.0874654,
                            "lon": 14.4212535
                        },
                        "address": {
                            "title": null,
                            "line": [
                                ""
                            ],
                            "locality": "Prague",
                            "country": "Czechia",
                            "type": "city",
                            "boundingbox": [
                                "49.9419006",
                                "50.1774301",
                                "14.2244355",
                                "14.7067869"
                            ]
                        },
                        "formatted_address": "Prague Czechia"
                    }
                ],
                "event_contact_info": [
                    "5cefd99cfe985e0a311bb688"
                ],
                "definition_long": "THIS IS LONG DESC",
                "internal_note": "THIS IS INT NOTE",
                "ednote": "THIS IS ED NOTE",
                "files": [
                    "5cefd99cfe985e0a311bb677"
                ],
                "links": [
                    "http://example.com",
                    "http://somedomain.cz"
                ],
                "subject" : [
                    {
                        "scheme" : "category",
                        "name" : "Innenriks",
                        "qcode" : "Innenriks",
                        "service" : {
                            "n" : 1,
                            "s" : 1,
                            "e" : 1,
                            "t" : 1,
                            "m" : 1,
                            "j" : 1,
                            "i" : 1
                        }
                    },
                    {
                        "scheme" : "subject_custom",
                        "name" : "Kultur og underholdning",
                        "qcode" : "01000000",
                        "parent" : null
                    },
                    {
                        "scheme" : "subject_custom",
                        "name" : "Kriminalitet og rettsvesen",
                        "qcode" : "02000000",
                        "parent" : null
                    }
                ]
            }
        ]
        """
        Then we get OK response
        When we post to "/events_template"
        """
        [
            {
                "based_on_event": "#events._id#",
                "template_name": "Formula one"
            }
        ]
        """
        Then we get response code 201
        And we get new resource
        """
        {
            "based_on_event": "#events._id#",
            "template_name": "Formula one",
            "data": {
                "calendars": [
                    {
                        "is_active": true,
                        "name": "Entertainment",
                        "qcode": "entertainment"
                    },
                    {
                        "is_active": true,
                        "name": "Finance",
                        "qcode": "finance"
                    }
                ],
                "definition_long": "THIS IS LONG DESC",
                "definition_short": "Grand prix formula 1 Prague",
                "ednote": "THIS IS ED NOTE",
                "event_contact_info": [
                    "5cefd99cfe985e0a311bb688"
                ],
                "files": [
                    "5cefd99cfe985e0a311bb677"
                ],
                "internal_note": "THIS IS INT NOTE",
                "links": [
                    "http://example.com",
                    "http://somedomain.cz"
                ],
                "location": [
                    {
                        "address": {
                            "boundingbox": [
                                "49.9419006",
                                "50.1774301",
                                "14.2244355",
                                "14.7067869"
                            ],
                            "country": "Czechia",
                            "line": [
                                ""
                            ],
                            "locality": "Prague",
                            "title": null,
                            "type": "city"
                        },
                        "formatted_address": "Prague Czechia",
                        "location": {
                            "lat": 50.0874654,
                            "lon": 14.4212535
                        },
                        "name": "Praha",
                        "qcode": "urn:newsml:localhost:5000:2019-06-04T11:55:43.146372:16d4043c-826e-4c25-a743-5f747baedde7"
                    }
                ],
                "name": "Grand prix F1",
                "occur_status": {
                    "label": "Planned, occurence planned only",
                    "name": "Planned, occurence planned only",
                    "qcode": "eocstat:eos1"
                },
                "slugline": "Grand prix",
                "subject": [
                    {
                        "name": "Innenriks",
                        "qcode": "Innenriks",
                        "scheme": "category",
                        "service": {
                            "e": 1,
                            "i": 1,
                            "j": 1,
                            "m": 1,
                            "n": 1,
                            "s": 1,
                            "t": 1
                        }
                    },
                    {
                        "name": "Kultur og underholdning",
                        "parent": null,
                        "qcode": "01000000",
                        "scheme": "subject_custom"
                    },
                    {
                        "name": "Kriminalitet og rettsvesen",
                        "parent": null,
                        "qcode": "02000000",
                        "scheme": "subject_custom"
                    }
                ]
            }
        }
        """

    @auth
    Scenario: Update event template fails
        Given "events"
        """
        [
            {
                "_id": "5cefd99cfe985e0a311bb777",
                "guid": "5cefd99cfe985e0a311bb777",
                "slugline": "Go kart",
                "name": "Go kart",
                "definition_short": "Go kart Prague",
                "definition_long": "THIS IS LONG DESC",
                "internal_note": "THIS IS INT NOTE",
                "ednote": "THIS IS ED NOTE",
                "links": [
                    "http://example.com",
                    "http://somedomain.cz"
                ],
                "dates": {
                    "start": "2019-06-11T09:00:00+0000",
                    "end": "2019-06-30T21:00:00+0000",
                    "tz": "Africa/Accra"
                }
            },
            {
                "_id": "5cefd99cfe985e0a311cc777",
                "guid": "5cefd99cfe985e0a311cc777",
                "slugline": "Go kart 1",
                "name": "Go kar 1t",
                "definition_short": "Go kart 1 Prague",
                "definition_long": "THIS IS LONG DESC",
                "internal_note": "THIS IS INT NOTE",
                "ednote": "THIS IS ED NOTE",
                "links": [
                    "http://example.com",
                    "http://somedomain.cz"
                ],
                "dates": {
                    "start": "2019-06-11T09:00:00+0000",
                    "end": "2019-06-30T21:00:00+0000",
                    "tz": "Africa/Accra"
                }
            }
        ]
        """
        When we post to "/events_template"
        """
        [
            {
                "based_on_event": "5cefd99cfe985e0a311bb777",
                "template_name": "Go kart one"
            }
        ]
        """
        Then we get OK response
        When we patch "/events_template/#events_template._id#"
        """
        {
            "based_on_event": "5cefd99cfe985e0a311cc777",
            "template_name": "Formula TWO"
        }
        """
        Then we get error 400
        """
        {
            "_issues": {
                "validator exception": "400: Request is not valid"
            },
            "_status": "ERR"
        }
        """
        When we patch "/events_template/#events_template._id#"
        """
        {
            "data": {
                "name": "Rally",
                "slugline": "Go kart new",
                "definition_short": "Go kart Prague new",
                "definition_long": "THIS IS LONG DESC new",
                "internal_note": "THIS IS INT NOTE new",
                "ednote": "THIS IS ED NOTE new",
                "links": [
                    "http://example.cz",
                    "http://somedomain.com"
                ]
            }
        }
        """
        Then we get error 400
        """
        {
            "_issues": {
                "data": {
                    "name": "field is read-only",
                    "slugline": "field is read-only",
                    "definition_short": "field is read-only",
                    "definition_long": "field is read-only",
                    "internal_note": "field is read-only",
                    "links": "field is read-only",
                    "ednote": "field is read-only"
                }
            },
            "_status": "ERR"
        }
        """

    @auth
    Scenario: Update event template success
        Given "events"
        """
        [
            {
                "_id": "5cefd99cfe985e0a311bb777",
                "guid": "5cefd99cfe985e0a311bb777",
                "slugline": "Go kart",
                "name": "Go kart",
                "definition_short": "Go kart Prague",
                "definition_long": "THIS IS LONG DESC",
                "internal_note": "THIS IS INT NOTE",
                "ednote": "THIS IS ED NOTE",
                "links": [
                    "http://example.com",
                    "http://somedomain.cz"
                ],
                "dates": {
                    "start": "2019-06-11T09:00:00+0000",
                    "end": "2019-06-30T21:00:00+0000",
                    "tz": "Africa/Accra"
                }
            }
        ]
        """
        When we post to "/events_template"
        """
        [
            {
                "based_on_event": "5cefd99cfe985e0a311bb777",
                "template_name": "Formula one"
            }
        ]
        """
        Then we get response code 201
        When we patch "/events_template/#events_template._id#"
        """
        {
            "based_on_event": "5cefd99cfe985e0a311bb777",
            "template_name": "Formula TWO",
            "data": {
                "slugline": "Go kart",
                "name": "Go kart",
                "definition_short": "Go kart Prague",
                "definition_long": "THIS IS LONG DESC",
                "internal_note": "THIS IS INT NOTE",
                "ednote": "THIS IS ED NOTE",
                "links": [
                    "http://example.com",
                    "http://somedomain.cz"
                ]
            }
        }
        """
        Then we get error 400
        """
        {
            "_issues": {
                "data": {
                    "definition_long": "field is read-only",
                    "definition_short": "field is read-only",
                    "ednote": "field is read-only",
                    "internal_note": "field is read-only",
                    "links": "field is read-only",
                    "name": "field is read-only",
                    "slugline": "field is read-only"
                }
            },
            "_status": "ERR"
        }
        """
        When we patch "/events_template/#events_template._id#"
        """
        {
            "template_name": "Formula 22"
        }
        """
        Then we get response code 200
        And we get new resource
        """
        {
            "template_name": "Formula 22"
        }
        """

    @auth
    Scenario: Delete event template success
        Given "events"
        """
        [
            {
                "_id": "5cefd99cfe985e0a311bb777",
                "guid": "5cefd99cfe985e0a311bb777",
                "slugline": "Go kart",
                "name": "Go kart",
                "definition_short": "Go kart Prague",
                "definition_long": "THIS IS LONG DESC",
                "internal_note": "THIS IS INT NOTE",
                "ednote": "THIS IS ED NOTE",
                "links": [
                    "http://example.com",
                    "http://somedomain.cz"
                ],
                "dates": {
                    "start": "2019-06-11T09:00:00+0000",
                    "end": "2019-06-30T21:00:00+0000",
                    "tz": "Africa/Accra"
                }
            }
        ]
        """
        When we post to "/events_template"
        """
        [
            {
                "based_on_event": "5cefd99cfe985e0a311bb777",
                "template_name": "Formula one"
            }
        ]
        """
        Then we get response code 201
        When we delete "/events_template/#events_template._id#"
        Then we get response code 204

    @auth
    Scenario: Create new event based on event template
        Given "events"
        """
        [
            {
                "_id": "5cefd99cfe985e0a311bb777",
                "guid": "5cefd99cfe985e0a311bb777",
                "slugline": "Go kart",
                "name": "Go kart",
                "definition_short": "Go kart Prague",
                "definition_long": "THIS IS LONG DESC",
                "internal_note": "THIS IS INT NOTE",
                "ednote": "THIS IS ED NOTE",
                "links": [
                    "http://example.com",
                    "http://somedomain.cz"
                ],
                "dates": {
                    "start": "2019-06-11T09:00:00+0000",
                    "end": "2019-06-30T21:00:00+0000",
                    "tz": "Africa/Accra"
                }
            }
        ]
        """
        When we post to "/events_template"
        """
        [
            {
                "based_on_event": "5cefd99cfe985e0a311bb777",
                "template_name": "Formula one"
            }
        ]
        """
        Then we get response code 201
        When we post to "/events"
        """
        [
            {
                "dates": {
                    "start": "2019-06-11T09:00:00+0000",
                    "end": "2019-06-30T21:00:00+0000",
                    "tz": "Africa/Accra"
                },
                "slugline": "Grand prix",
                "name": "Grand prix F1",
                "definition_short": "Grand prix formula 1 Prague",
                "definition_long": "THIS IS LONG DESC",
                "internal_note": "THIS IS INT NOTE",
                "ednote": "THIS IS ED NOTE",
                "links": [
                    "http://example.com",
                    "http://somedomain.cz"
                ],
                "template": "#events_template._id#"
            }
        ]
        """
        Then we get OK response
        And we get new resource
        """
        {
            "dates": {
                "start": "2019-06-11T09:00:00+0000",
                "end": "2019-06-30T21:00:00+0000",
                "tz": "Africa/Accra"
            },
            "slugline": "Grand prix",
            "name": "Grand prix F1",
            "definition_short": "Grand prix formula 1 Prague",
            "definition_long": "THIS IS LONG DESC",
            "internal_note": "THIS IS INT NOTE",
            "ednote": "THIS IS ED NOTE",
            "links": [
                "http://example.com",
                "http://somedomain.cz"
            ],
            "template": "#events_template._id#"
        }
        """

    @auth
    Scenario: Ensures that template can't be changed for event
        Given "events"
        """
        [
            {
                "_id": "5cefd99cfe985e0a311bb777",
                "guid": "5cefd99cfe985e0a311bb777",
                "slugline": "Go kart",
                "name": "Go kart",
                "definition_short": "Go kart Prague",
                "definition_long": "THIS IS LONG DESC",
                "internal_note": "THIS IS INT NOTE",
                "ednote": "THIS IS ED NOTE",
                "links": [
                    "http://example.com",
                    "http://somedomain.cz"
                ],
                "dates": {
                    "start": "2019-06-11T09:00:00+0000",
                    "end": "2019-06-30T21:00:00+0000",
                    "tz": "Africa/Accra"
                }
            },
            {
                "_id": "5cefd99cfe985e0a311bb666",
                "guid": "5cefd99cfe985e0a311bb666",
                "slugline": "Go kart",
                "name": "Go kart",
                "definition_short": "Go kart Brno",
                "definition_long": "THIS IS LONG DESC",
                "internal_note": "THIS IS INT NOTE",
                "ednote": "THIS IS ED NOTE",
                "links": [
                    "http://example.com",
                    "http://somedomain.cz"
                ],
                "dates": {
                    "start": "2019-06-11T09:00:00+0000",
                    "end": "2019-06-30T21:00:00+0000",
                    "tz": "Africa/Accra"
                }
            }
        ]
        """
        Given "events_template"
        """
        [
            {
                "_id": "5cefd99cfe985e0a311bb888",
                "slugline": "Go kart",
                "name": "Go kart",
                "definition_short": "Go kart Prague",
                "definition_long": "THIS IS LONG DESC",
                "internal_note": "THIS IS INT NOTE",
                "ednote": "THIS IS ED NOTE",
                "links": [
                    "http://example.com",
                    "http://somedomain.cz"
                ],
                 "based_on_event": "5cefd99cfe985e0a311bb666"
            }
        ]
        """
        When we post to "/events_template"
        """
        [
            {
                "based_on_event": "5cefd99cfe985e0a311bb777",
                "template_name": "Formula one"
            }
        ]
        """
        Then we get response code 201
        When we post to "/events"
        """
        [
            {
                "dates": {
                    "start": "2019-06-11T09:00:00+0000",
                    "end": "2019-06-30T21:00:00+0000",
                    "tz": "Africa/Accra"
                },
                "slugline": "Grand prix",
                "name": "Grand prix F1",
                "definition_short": "Grand prix formula 1 Prague",
                "definition_long": "THIS IS LONG DESC",
                "internal_note": "THIS IS INT NOTE",
                "ednote": "THIS IS ED NOTE",
                "links": [
                    "http://example.com",
                    "http://somedomain.cz"
                ],
                "template": "#events_template._id#"
            }
        ]
        """
        Then we get OK response
        When we patch "/events/#events._id#"
        """
        {
            "template": "5cefd99cfe985e0a311bb888"
        }
        """
        Then we get error 400
        """
        {
            "_issues": {
                "validator exception": "400: Request is not valid"
            },
            "_status": "ERR"
        }
        """