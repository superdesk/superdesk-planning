# Feature: Planning Search with Spike State and Include Killed Filters
#     Background: Initial setup
#         Given "planning"
#         """
#         [
#             {
#                 "guid": "planning_draft",
#                 "headline": "Draft Planning Item",
#                 "slugline": "draft_slug",
#                 "name": "draft_item",
#                 "planning_date": "2026-01-27T12:00:00+0000",
#                 "state": "draft"
#             },
#             {
#                 "guid": "planning_spiked",
#                 "headline": "Spiked Planning Item",
#                 "slugline": "spiked_slug",
#                 "name": "spiked_item",
#                 "planning_date": "2026-01-27T12:00:00+0000",
#                 "state": "spiked"
#             },
#             {
#                 "guid": "planning_killed",
#                 "headline": "Killed Planning Item",
#                 "slugline": "killed_slug",
#                 "name": "killed_item",
#                 "planning_date": "2026-01-27T12:00:00+0000",
#                 "state": "killed"
#             }
#         ]
#         """
#
#     @auth
#     Scenario: Saved filter with spike_state=both and include_killed=true returns spiked and killed items
#         When we post to "events_planning_filters"
#         """
#         [{
#             "name": "Killed and Spiked Filter",
#             "item_type": "planning",
#             "params": {
#                 "spike_state": "both",
#                 "include_killed": true
#             }
#         }]
#         """
#         Then we get OK response
#         When we get "/events_planning_search?repo=planning&only_future=false&filter_id=#events_planning_filters._id#"
#         Then we get list with 3 items
#         """
#         {"_items": [
#             {"_id": "planning_draft"},
#             {"_id": "planning_spiked"},
#             {"_id": "planning_killed"}
#         ]}
#         """
#
#     @auth
#     Scenario: Saved filter with only include_killed=true excludes spiked items
#         When we post to "events_planning_filters"
#         """
#         [{
#             "name": "Killed Only Filter",
#             "item_type": "planning",
#             "params": {
#                 "include_killed": true
#             }
#         }]
#         """
#         Then we get OK response
#         When we get "/events_planning_search?repo=planning&only_future=false&filter_id=#events_planning_filters._id#"
#         Then we get list with 2 items
#         """
#         {"_items": [
#             {"_id": "planning_draft"},
#             {"_id": "planning_killed"}
#         ]}
#         """
#
#     @auth
#     Scenario: Saved filter with only spike_state=both excludes killed items
#         When we post to "events_planning_filters"
#         """
#         [{
#             "name": "Spiked Only Filter",
#             "item_type": "planning",
#             "params": {
#                 "spike_state": "both"
#             }
#         }]
#         """
#         Then we get OK response
#         When we get "/events_planning_search?repo=planning&only_future=false&filter_id=#events_planning_filters._id#"
#         Then we get list with 2 items
#         """
#         {"_items": [
#             {"_id": "planning_draft"},
#             {"_id": "planning_spiked"}
#         ]}
#         """
