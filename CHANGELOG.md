# Superdesk Planning Changelog

## * Release v2.3.0 - 2021-07-16

## [2.3.0-rc.4] 2021-07-02
### Fixes
- [SDESK-5906] fix(ingest): Unable to create event after ingestion (#1623)
- [SDCP-526] fix: Accessibility improvements for preview (#1629)
- [SDCP-536] fix(export): Show server error on failure (#1630)

## [2.3.0-rc.3] 2021-06-29
### Fixes
- [SDESK-6047] fix(search): Agenda filter not working from subnav (#1613)
- [SDESK-6022] fix: Embedded coverages disappear after posting Event (#1615)
- [SDCP-526] fix(translations): missing gettext definition (#1619)
- [SDCP-536] fix(exports): Use ObjectId when comparing Agenda IDs (#1620)
- [SDESK-6071] fix: Make sure embedded coverages have a date (#1621)
- fix file ingest when there is no parse_file method (#1624)
- [SDCP-526] Enable date field option showToBeConfirmed in events and coverages (#1625)
- [SDESK-6074] fix(locks): Unlock Assignment on Archive Publish actions (#1626)
- [SDESK-5833] fix: workqueue left padding remains when navigating from monitoring (#1622)

## [2.3.0-rc.2] 2021-06-18
### Improvements
- [SDCP-545] Improve accessibility in Planning page (#1598)
- [SDCP-548] Improve accessibility in Assignments page (#1609)

### Fixes
- fix(e2e): Due to changes in UI Framework Switch component (#1605)
- [SDESK-6018] fix: Clear button does not clear the advance search (#1601)
- chore(fireq): Use release/2.3 branch
- [SDESK-5833] fix: About link not accessible from planning section (#1611)
- [SDCP-549] fix(locations): Fallback to county if city isn't defined (#1610)
- [SDESK-6017] fix: Validate CoverageForm in Event Editor (#1606)

## [2.3.0-rc.1] 2021-06-16
### Features
- [SDNTB-673] Support filtering/sorting by created/updated (#1555)
- [SDESK-5906] ingest of json event format (#1566)
- [SDESK-5905] Editor Bookmarks and embedded coverage form (#1570)
- [SDNTB-674] Assignments widget in the toolbar (#1565)

### Improvements
- chore(typescript): Rename js(x) to ts(x) (#1564)
- [SDESK-5791] Location should not be created from within search form (#1573)
- [SDNTB-673] Improve Planning subnav on smaller screens (#1575)
- [SDCP-534] Pass Item or Profile language to OpenStreetMaps (#1579)
- Accessibility enhancements (#1580)
- [SDESK-5973] Improve Events embedded Location popup form (#1581)
- [SDCP-526] Improve translations (#1585)
- [SDCP-550] chore: update translations (#1604)

### Fixes
- [SDESK-5726] fix(post): Posting Planning item doesnt update etag (#1554)
- [SDESK-5831] fix(unit_tests): Update contact_state in tests (#1562)
- [SDESK-5821] Use debounce for Autosave (#1559)
- [SDCP-492] fix(actions): Incorrect state logic for Mark As Completed (#1563)
- fix(e2e): Calculate times to fix daylight savings changes (#1569)
- [SDCP-529] Fix various UI translations (#1571)
- fix(e2e): Fix loading extension (#1574)
- [SDESK-5896] fix(authoring-widget): Prevent Assignments view being cleared (#1578)
- [SDCP-528] fix: Select dropdowns failed to re-render on language change (#1582)
- fix(e2e): Use build-tools to compile front-end (#1586)
- [SDCP-528] fix(i18n): Pass language to Coverage popups/forms (#1587)
- [SDESK-5985] fix: Remove _status from POST/PATCH responses (#1588)
- [SDESK-6008] fix: Duplicate coverages from advanced mode (#1590)
- [SDESK-5987] fix: Set Editor to read-only before performing action (#1589)
- [SDESK-5982] fix: Force fetch Planning from API after POST (#1591)
- [SDESK-5977] Remove calendar/agenda from advanceSearch panel (#1592)
- [SDCP-528] fix(i18n): Use language in CoverageItem (#1593)
- [SDESK-6016] fix: Incorrect icon and tooltip in CoverageBookmarks (#1594)
- [SDESK-5985] fix: Unable to assign Coverage Status from Event form (#1595)
- [SDESK-5455] Allow patching Events with just dates.recurring_rules defined (#1596)

## [2.2.1] 2021-05-21
### Fixes
- [SDESK-5961] fix: While creating new location from event, save button is not activated (#1576)
- fix(data-update): Location update fails if CV items is empty (#1577)

## * Release v2.2.0 - 2021-05-13

## [2.2.0-rc.2] 2021-05-06
### Fixes
- [SDCP-519] fix: Default Event/Planning language from CV (#1572)
- [SDCP-499] fix mapping of Address from OpenStreetMaps to local DB (#1561)

## [2.2.0-rc.1] 2021-03-18
### Improvements
- [SDBELGA-448] As a newsroom manager I want some users to see only 'my assignments.' (#1543)
- [SDCP-464] Unify rendering of preview fields (#1549)

### Fixes
- [SDESK-5776] fix: Planning: Create action in the popup editor closes the popup unexpectedly. (#1548)
- [SDBELGA-448] fix: Only the my assignment button should display in the dropdown if user doesn't have the desk privilege. (#1550)
- [SDESK-5680] fix(react-redux): Replace deprecated withRef attribute with forwardRef (#1553)
- [SDESK-5750] use lazy_gettext for user preferences (#1521)

## [2.1.4] 2021-05-06
### Fixes
- [SDCP-518] fix(unpost): References all Events if recurrence_id==null (#1568)

## [2.1.3] 2021-03-10
### Fixes
- [SDCP-480] fix(search): Exceptions raised when search by urgency (#1556)
- [SDCP-484] fix(search): Convert string fields to datetime (#1557)
- [SDESK-5827] fix: Search panel params not persisting (#1558)
- [SDESK-5827] fix: Search param selector returning incorrect data (#1560)

## [2.1.2] 2021-02-23
### Fixes
- [SDCP-479] fix(filters): Filter schedule templates by desk (#1551)

## [2.1.1] 2021-02-17
### Fixes
- chore(fireq): Use planning-master branch (418c83c)
- [SDCP-467][SDESK-5792] fix(search): Location and lock_state not filtering results (#1544)
- [SDESK-5819] fix(schema): Allow translations for event & coverage status (#1545)
- [SDESK-5820] fix(search): Show historic associated Planning items in combined view (#1547)
- [SDCP-474] fix(export): Append text if placeholder not found in template (#1546)
- fix(nosetests): Update country in json event output test (30dece1)

## * Release v2.1.0 - 2021-02-11

## [2.1.0-rc.5] 2021-02-11
- [SDESK-5745] fix(search): Fails to search Planning by dates (#1534)
- [SDCP-443] Support search filters in all views (#1535)
- fix: Custom layout button was disabled (#1538)
- [SDESK-5510] fix: Planning items belonging to events disappear once event repetitions are updated. (#1537)
- [SDCP-450] Dynamically hide contradicting search param inputs (#1536)
- [SDCP-464] fix(translation): Use CV not item value to show names #(1539)
- [SDCP-468] fix(projections): Make sure type is always included (#1540)
- chore(translations): update canadian french translations (#1541)
- [SDCP-469] fix: Scheduled exports sent every hour regardless of schedule (#1542)

## [2.1.0-rc.4] 2021-02-03
### Fixes
- [SDCP-440] fix: Incorrect schema for state param in filters (#1528)
- [SDCP-449] fix(filter-schema): Allow unknown fields for dictionary attributes (#1532)
- [SDCP-439] fix: Search fields in Filters editor doesnt work (#1527)
- [SDCP-409] fix(search): Filters fail with Agenda ObjectId query (#1530)
- [SDCP-446] fix(filters): Set param value to null if value is empty (#1531)
- [SDCP-437] fix: Use appConfig timeformat for Schedules Hour values (#1529)
- [SDCP-449] fix(filters): Fix issues with schema (#1533)

## [2.1.0-rc.3] 2021-01-28
### Fixes
- [SDESK-5777] Data update script for events_planning_filters (#1522)
- [SDESK-5746] fix: Dont return historic planning items by default (#1525)

## [2.1.0-rc.2] 2021-01-27
### Fixes
- fix(flake8): Add newline at end of file ics_2_0
- fix(rebase): Merge master reverted changes to search and filters
- [SDESK-5745] fix: FeaturedPlanning modal excluding planning items on load (#1520)

## [2.1.0-rc.1] 2021-01-21
### Features
- [SDCP-408] [Server] Scheduled exports of event and planning filters (#1513)
- [SDCP-409] [Client] Scheduled exports of search filters (#1519)

### Improvements
- [SDCP-408] Move elastic queries to the server (#1506)
- [SDCP-404] [Server] Support new search params in planning types and filters (#1511)
- [SDCP-407] Unify search and filter panel components and search (#1512)
- Improve translations for CP (#1515)
- setup server translations on planning (#1516)

### Fixes
- [SDCP-391] fix: Remove 'Add to Planning' option for correction items (#1507)
- [SDESK-5708] fix: Cannot update event times. (#1508)
- [SDESK-5739] fix: Cannot Post recurring series of Events (#1514)
- [SDESK-5733] fix: When spiking a series of recurring events some were not affected (#1517)

## [2.0.2] 2021-01-29
### Fixes
- [SDESK-5780] fix(security): Require authentication for all API endpoints (#1526)

## [2.0.1] 2021-01-21
### Features
- [SDCP-387] Add language field to Events and Planning item (#1497)

### Improvements
- [SDCP-388] Use CV translations in form inputs (#1501)

### Fixes
- fix(init): Add init_version to planning_types
- [SDESK-5654] fix(ingest): ICS failure due to Eve changes (#1498)
- [SDAN-680] fix updating of events in newshub (#1499)
- [SDESK-5611] fix: Create from assignment fails to override template values (#1493)
- [SDCP-388] Add language attribute to ColouredValueInput component (#1503)
- [SDCP-387] fix(duplicate): Language not copying to new items (#1505)
- Remove type hints to support python 3.5
- [SDESK-5699] return unfrozen linked item (#1510)

## [2.0.0] 2020-10-28
### Features
- None

### Improvements
- [SDESK-5466] New allow list config PLANNING_ALLOWED_COVERAGE_LINK_TYPES for content linking (#1483)
- support elastic7 (#1472)
- [SDESK-5155] Config for assignments list fields (#1459)

### Fixes
- [SDCP-291] Use a function to get assignments when translations are needed (#1488)
- [SDESK-5457] Assign to agenda or to calendar from three dot menu does not work for events and for planning items. (1487)
- [SDESK-5456] FIX: Cannot add planning item to featured stories. (#1486)
- [SDESK-5494] fix: Undefined function in activity additionalCondition (#1485)
- [SDESK-5494] fix: Failure to get Planning actions in Monitoring (#1484)
- [SDESK-5414] fix: Planning search fails on elastic 7 (#1482)
- [SDESK-5204] fix errors after eve/flask upgrade (#1468)
- fix: import resolve_default_values from apps.archive.common (#1469)

## [1.33.2] 2020-12-03
### Features
- None

### Improvements
- [SDESK-5545] Add details to text_assignees for sport Outlook (#1490)

### Fixes
- fix(XMP update) Write the assignment into the XMP file on create assignment (#1495)
- Use icalendar>=4.0.3,<4.1 (#1502)

## [1.33.1] 2020-09-09
### Features
- None

### Improvements
- [SDESK-5005] Add optional internal reference field to events (#1480)
- [SDNTB-633] Ability to define export templates in settings.py (#1473)

### Fixes
- [SDANSA-426] Add planning specific date and time format config (#1476)
- [SDESK-5372] fix: Providing end date without start crashes the page (#1477)
- [SDESK-5389] fix: Locking Assignment assigns incorrect _links attribute (#1478)
- [SDESK-5345] Force update subscriber_types in initialize_data command (#1474)
- [SDESK-5189] Ignore Planning partialSave if editor is read-only (#1462)
- [SDESK-4512] fix: Double notification on spike (#1463)
- [SDESK-5116] Ignore Planning partialSave if editor is submitting (#1464)
- fix(slack) change deprecated slack API call (#1466)
- [SDESK-5245] fix: Planning item not unlocked after cancelling (#1467)
- [SDESK-5223] Replace React hooks with Class for ExpandableText component (#1465)
- [SDESK-4479] fix: Cannot create planning item from events after disabling agenda. (#1471)
- [SDESK-5223] fix: Load agendas before showing authoring widget (#1470)

## [1.33.0] 2020-04-28
### Features
- None

### Improvements
- [SDESK-5130] Support Superdesk v1.33 (#1452)
- [SDESK-4989] Add an [X] button to remove selected items from the Download/Export modal in Planning (#1442)
- [SDESK-4864] Add accepted flag (#1441)
- [SDESK-5006] Expandable textarea input for internal_note (#1443)
- [SDESK-5072] Derive coverage slugline from XMP for photo coverages (#1448)

### Fixes
- [SDESK-4861] Remove usage of functionPoints (#1411)
- [SDESK-5068] Sanitize Input data when saving event/planning (#1438)
- [SDESK-4941] Unposting planing item with assignment was removing planning editor lock (#1439)
- [SDESK-4988] Cannot save/update completed events (#1440)
- [SDESK-5071] Creating planing from killed events (#1445)
- [SDESK-4852] Limit calendar and agenda display in lists (#1444)
- [SDESK-5020] FIX: Issues with advance coverage mode (#1446)
- fix(behave): Add privilege error message in expected response (#1435)
- chore(travis): Upgrade to use multiple stages (#1449)
- [SDESK-5106] Cannot remove assignments (#1450)
- [SDESK-5111] Coverage assignment ok button should not be active if a desk is not selected (#1451)
- [SDESK-4849] Change event download to post id's rather than pass them on the URL (#1454)
- [SDESK-5121] (fix): Issue with setting the 'genre' field for coverage (#1455)
- fix(bottom-bar): Refactored bottom-bar structure (#1453)
- [SDESK-5171] fix: Search in manage events templates cashes the UI (#1457)
- [SDESK-5112] Update autosave when removing an assignment (#1456)
- [SDESK-5160] fix: Hide native input button for coverage files (#1458)
- [SDESK-5132] chore: Replace deployConfig with appConfig (#1460)
- [SDESK-5199] (fix) Force white background for forms and previews (#1461)

## [1.10.2] 2020-02-25
### Features
- None

### Improvements
- [SDESK-4863] Implement an Assignment Email layout that allows 'acceptance' of assignments (#1437)

### Fixes
- [SDESK-5010] Update allowed actions on pictures assignments in progress (#1429)

## [1.10.1] 2020-01-31
### Features
- [SDESK-4767] Feature to attach files to coverages (#1403)
- [SDESK-4775] Attach .xmp file to picture assignments (#1405)

### Improvements
- [SDESK-4797] Reduce vertical padding in PopupEditor on small screens (#1402)
- fix: Automatically show contact popup when search text is empty (#1416)
- [SDESK-4979] Add coverage provider and assigned user names to coverages on posting the planning item (#1424)
- [SDESK-5001] Coverage Icons for graphic, video_explainer and live_blog (#1428)
- [SDESK-4903] (1.10) Show FulfilAssignment challenge on archive send (#1425)
- [SDESK-5022] Remove whitespace from the beginning and end of the name and slugline when saving an Event or Planning item and Coverages (#1432)

### Fixes
- [SDESK-4889] Bug while removing an agenda (#1401)
- [SDESK-4929] Don't clear invalid date fields on autosave (#1406)
- [SDNTB-616] FIX: Update time is not working for ingested events. (#1404)
- [SDESK-4908] Paginate results in contacts selection in Event Form (#1407)
- [SDNTB-616] fix: update time not working for ingested events. (#1409)
- [sdesk-4776] Allow a user id to be passed to complete assignment (#1410)
- [SDESK-4509] Port e2e tests from Protractor to Cypress (#1408)
- [SDBELGA-262] (EVENT FILES) - Save additional file information. (#1412)
- fix(e2e): Failing to click on Contacts Close button (#1418)
- [SDESK-4888] Wrong history entry when creating a Planning item with a coverage (#1414)
- [SDESK-4890] Multiple errors when canceling a coverage (#1413)
- [SDESK-4976] Assignment notifications not having XMP file attachments (#1417)
- [SDESK-4796] Bug around assignment XMP mapping when XMP is attached during assignment creation (#1419)
- [SDNTB-622] (INGEST) NIFS event ingest parser error (#1415)
- [SDESK-4993] Planning item with an XMP file was not getting published (#1422)
- [SDESK-4977] Duplicating coverage or planning item should duplicate the XMP File too (#1423)
- [SDESK-4980] Create two locations with same name (#1420)
- [SDESK-4888] Wrong coverage history on creation (#1427)
- [SDESK-5004] Turning on the 'NOT FOR PUBLICATION' toggle enables the 'SAVE & POST' button in the Planning editor (#1426)
- [SDESK-5019] FIX: Add scrolling for coverage types list in add coverage advance mode. (#1430)
- [SDESK-5025] Related planning item(s) not published when event is cancelled (#1431)
- [SDESK-5030] Scheduled Update not in delivery record (#1433)
- fix(behave): Add privilege error message in expected response (#1435)
- [SDESK-5050] SendTo challenge should only appear if an Assignment is found (#1436)

## [1.10.0] 2019-12-12
### Features
- [SDESK-4766] Assign coverages to assignable media contacts (#1389)

### Improvements
- [SDESK-4734] Confirmation on completing event (#1382)
- [SDESK-4721] Save location directly from location popup (#1386)
- [SDBELGA-220] improvements for quick creation of coverages (#1388) 
- [SDESK-4722] Add no result indication in location manager and set sort order on empty search (#1390)
- [SDESK-4807] Event templates privilege (#1394)
- [SDESK-4846] Add notes to locations (#1398)

### Fixes
- [SDESK-4723] Improve stability when searching locations (#1384)
- [SDNTB-589] Use default timezone for rescheduling events if there is no timezone in event (#1385)
- [SDESK-4735] Infinite loading when unlocking an event thats being edited in popup (#1387)
- [SDESK-4389] Remove repeated 'by' in planning history tab (#1391)
- [SDESK-4772] Avoid planning lists' scroll position from jumping to start on item notifications (#1392)
- [SDESK-4806] Event templates were not saving 'category' field (#1393)
- [SDBELGA-220] validate coverage in add advanced modal (#1395)
- [SDESK-4766] Remove 'Start Working' for external coverages (#1397)
- [SDESK-4846] Styling changes to location details (#1399)
- [SDESK-4766] UX improvements for coverage provider contact (#1400)

## [1.9.0] 2019-11-06
### Features
- [SDESK-4560] Cherry-picking scheduled_updates feature to master (#1366)
  - [SDESK-4561] Coverage forward updates (#1293)
  - [SDESK-4647] Item actions for Scheduled Updates (#1316)
  - [SDESK-4562] Logically constrain the scheduling of planned updates to a coverage (#1324)
  - [SDESK-4563][SDESK-4564] Scheduled updates linking and unlinking features (#1332)
  - [SDESK-4727] Editor related bugs in Scheduled Updates creation (#1349)
  - [SDESK-4730] Changes to scheduled_updates feature and merging information to newsroom (#1353)
  - [SDESK-4758] Fixes to scheduled_updates feature (#1364)
  - [SDESK-4793] Removing assignment in a scheduled update chain should remove all assignments (#1376)

### Improvements
- feat(dropdown): Improved behaviour for dropdown, added groups (#1361)
- [SDNTB-604] Move NTB related feed parser and formatter from planning to NTB repo (#1363)
- [SDBELGA-148] implement add coverages advanced modal (#1370)

### Fixes
- [SDESK-4745] Correct the label for news value in planning preview (#1365)
- [SDESK-4771] Unable to change coverage schedule from 'To Be Confirmed' to default value (#1369)
- [SDESK-4774] Event links getting a null value when editing (#1368)
- [SDESK-4760] Planning Export dialog is showing all Agendas (#1372)
- [SDESK-4692] Posting a Planning item should post the entire series of Events (#1371)
- [SDBELGA-148] fix coverage duplication in advanced mode (#1374)
- [SDNTB-613] Fix buggy behaviour when trying to remove subjects from event and planning item (#1373)
- [SDESK-4714] Always open preview when clicking in-app Assignment notification (#1375)
- [SDESK-4692] (fix): Dont show PostEvent modal when saving Planning item (#1377)
- [SDESK-4741] Scroll issue in the Manage Events & Planning Filters window (#1378)
- [SDESK-4620] Display all affected Planning items when cancelling an Event (#1380)

## [1.8.0] 2019-10-17
### Features
- [SDBELGA-101][SDBELGA-102][SDBELGA-103] Event templates (#1328)
- [SDESK-4565] Independently sort Assignment lists (#1344)
- [SDESK-4472] 'To be confirmed' feature (#1341)

### Improvements
- [SDESK-4668] Introduce configuration for the main left hand side toolbar (#1336)
- [SDESK-4701] Align collapse box close button left and next to three-dot button (#1348)
- [SDBELGA-186] control via article template where generated content is inserted (#1354)
- [SDESK-4756] Provide browser time accesibility to events download templates (#1357)

### Fixes
- [SDESK-4514] reopen editor if required when item is added to featured stories (#1331)
- [SDNTB-599] When duplicated event is rescheduled and posted, SD sends file with NTBID of orginal event (#1340)
- [SDESK-4515] Close editor after cancelling event/planning-item (#1342)
- [SDESK-4516] Event editor is blank when reducing repetitions if that event no longer exists (#1343)
- [SDESK-4515] Cancelling planning item was keeping the item in editor still locked (#1347)
- [SDESK-4663] The editor in 'Add To Planning' modal should close if the same Planning item is unlocked in another session (#1346)
- [SDESK-4710] Error when assigning past date to coverage (#1350)
- (fix) Place superdesk-core in peerDependencies and update Typescript version (#1351)
- [SDNTB-589] (fix): Cannot perform reschedule or convert to recurring on events. (#1352)
- fix duplicate by on slack notification (#1339)
- [SDESK-4757] 'Abstract' from news item was missing when planning item was exported as article (#1358)
- [SDESK-4648] User asked for saving changes when an event is not edited (#1359)

## [1.7.0] 2019-09-20
### Features
- [SDESK-4427] New Event action 'Mark as Completed' (#1273)
- [SDNTB-584] feat(draggable): Added ability to make modals draggable (#1294)

### Improvements
- [SDESK-4599] Review planning workflow notifications (#1301)
- [SDESK-4598] Add Place to event and planning filter (#1302)
- [SDESK-4618] Remove the folder from the filename returned for attachments (#1307)
- [SDESK-4595] Move the attachment icon in lists (#1311)
- [SDESK-4651] Show all desks by default in Fulfil Assignment modal (#1305)
- [SDESK-4676] Hide 'all day' as an event form option (#1320)
- [SDESK-4705] modify the internal note message (#1334)

### Fixes
- [SDESK-4427] Mark for complete fix to cater for events that start on same day but ahead in time. (#1278)
- [SDESK-4592] Restrict some item actions on expired items (#1297)
- actioned_date was removed when posting an event (#1299)
- [SDESK-4224][SDESK-4510][SDESK-4513] (fix): Don't unmount the PopupEditor when action modal is shown (#1274)
- [SDESK-4572] Don't close dropdown on scroll bar click (#1303)
- [SDESK-4654] Handle the enter key in Selecting subject codes etc. (#1312)
- [SDESK-4669] Location was getting deleted when event was marked as complete or assigned to calendar (#1310)
- [SDESK-4661] (fix) Fulfil Assignment button visible if Assignment is locked (#1306)
- (fix-requirements) Add responses lib in dev-requirements.txt (#1315)
- [SDESK-4678] When marking an Event as completed Planning and Assignments need to be updated (#1317)
- fix(flake8): Resolve 'D413 Missing blank line after last section' (#1312)
- fix(import ui-framework): Add helpers and colors to scss imports (#1323)
- fix to use modal__backdrop class locally (#1326)
- [SDESK-4691] Planning was not published when event was completed (#1330)
- fix(assignment templates) handle missing bits of address, add slugline to subject (#1333)
- [SDESK-4704] Send Assignment notification when Event is updated (#1337)
- [SDNTB-599] 'duplicate_from' was missing when duplicating an Event. (#1335)

## [1.6.2] 2019-08-21
### Features
- [SDESK-4469] Introduce modal to prompt for a 'reason' to cancel individual coverages (#1260)

### Improvements
- [SDESK-3286] Close popup modals with ESC key (#1272)
- [SDESK-4428] Multiselect in the Event list and Planning list (#1268)
- [SDESK-4402] Improve location display in planning lists (#1266)
- [SDESK-4493] Create a history record for Planning items and events when an Event is created from planning item (#1264)
- [SDESK-4421] Add details to location dropdown (#1263)
- [SDBELGA-129] Include coverage without users on export templates (#1281)
- [SDESK-4286] Minor changes to event and planning list items in Export Modal (#1279)
- [SDESK-4566] Position 'start working' as the first item in the action menu for assignments (#1282)
- [SDESK-4573] Slack mentions in slack notifications (#1283)
- [SDESK-4529][SDESK-4534] Show current and future only assignments in the Fulfill modal (#1284)

### Fixes
- [SDESK-4286] List Item format for exporting and downloading events/planning (#1276)
- [SDESK-4478] Correctly display the number of events in Post/Unpost popup (#1275)
- [SDESK-4549] Coverages are inheriting published time and not scheduled time of a story (#1271)
- [SDESK-4328] Remove ability to clear the coverage type in the editor (1270)
- (fix): Update enzyme-adapter-react-16 (#1269)
- [SDESK-4571] Allow content unlinking when content has been archived (1280)
- [SDESK-4552] (fix): Assignment preview not showing from monitoring preview (#1285)
- [SDESK-4477] (fix): Cannot lower repetitions unless on the first event (#1286))
- [SDESK-4511] (fix): Scrollbar required for planning items in CancelEvent modal (#1287)
- [SDESK-4524] Make contact form read only when embedded in read only coverage form (#1289)
- [SDESK-4535] Fulfill assignment available for Reporters (#1288)
- [SDESK-4609] Filter soft deleted locations out from the browse view (#1290)
- [SDESK-4637] (fix) Select first assignment on fulfill on publish (#1296)
- [SDESK-4608] (fix) Advance Search Panel was collapsing if list item has a long text (#1298)

## [1.6.1] 2019-07-17
### Fixes
- [SDESK-4471] Reschedule and Postpone bugs when editor is open (#1259)
- [SDESK-4453] Round up time when adding coverage for a published/scheduled news item (#1257)
- [SDESK-4435] Cancel-All-Coverage and updating planning form was throwing an etag error
- [SDESK-4436] New-line missing in downloaded file (Windows)
- [SDESK-4318] Show name in workqueue in absence of slugline and headline
- [SDESK-4336] Allow updates to planning items with disabled agendas
- [SDESK-4413] Location Popup was closing when location text was selected and mouse click released


## [1.6] 2019-07-09
### Features
- [SDBELGA-108] Event templates API.
- [SDBELGA-111] As a user I want to select an article template when I do 'Export as article'
- [SDESK-4125] Download functionality for events
- [SDESK-4080] Adding configuration so that reason can be made mandatory.
- [SDESK-4094][SDESK-4125] Export templates for planning and events
- [SDESK-4075] Manage Locations
- [SDESK-4128] Check for an unfulfilled assignment on publish
- [SDESK-4027] Pre-built filters for events and planning view.
- [SDESK-4026] Extend the Coverage concept to include iterations/updates to the original text coverage item
- [SDESK-3833] Keyboard shortcut to access planning module
- [SDBELGA-70] add planning details authoring widget
- [SDESK-4022] Add 'Create and Open Planning Item' action to Event Editor

### Improvements
- [SDESK-4063] Add loader animation on file upload
- [SDESK-4329] Show coverage type in planning widget coverage details
- [SDESK-4307] Locations Management enhancements
- [SDESK-4375] Show 'genre' in assignments list view
- [SDESK-4377] Make ed-note editable in add-to-planning modal
- [SDBELGA-108] Add unused templates at the end of recent event templates list.
- [SDBELGA-108] Store event related data as subdict in event templates schema.
- [SDBELGA-120] Remove disabled agendas from export
- [SDESK-4311] Getting content from archive items for exporting planning based on templates
- [SDESK-4332] Apply the users byline on the item created when starting work
- [SDESK-4301] Reshuffle Timezone and Occurance Status fields in Event Form
- [SDESK-4241] Spacing between icons when viewing contacts in planning module
- [SDESK-4302] Support max-length for selecting meta terms
- [SDESK-4312] Add Place for event's download format
- [SDBELGA-110] Send an array of agendas to export templates
- [SDESK-4280] Minor changes to export templates
- [SDESK-4280] Changes to variables made available to exporting templates
- [SDESK-4122] Open an assignment on clicking an assignment related notification
- Add a system setting to control which desks to display the fulfil modal
- [SDESK-4128] Modify fulfil assignment modal title when publishing news item
- [SDESK-4128] Modify onpublish fulfil modal
- Implement checking of config option 'planning_check_for_assignment_on_publish', defaults to false
- [SDBELGA-104] add contacts info to export as article template
- [SDESK-4192] On planning duplicate use server timezone to duplicate planning item.
- [SDESK-4131] Show 'Ignore/Cancel/Save' dialog for 'UpdateRepetitions' action
- [SDESK-3921] Editor refactoring
- [SDESK-4130] Add desk label to Assignment list item
- [SDESK-4126] Provide desk dropdown in Assignments when in a custom workspace
- [SDESK-4119] Dont round up coverage time if derived from an Event
- [SDESK-4028] Keep initial focus on Event Date for non existing events when opened in Editor
- [SDESK-4081] Change to the behaviour of 'postponed', 'cancel' and 'reschedule' actions for multi-day events
- [SDESK-4082] Allow unpost action for cancelled events and plannings
- [SDESK-4057][SDESK-4058][SDESK-4059] Modified display of timezone in events and planning list/preview.
- [SDESK-4021] Improvement to the provision of default due date/time for new Coverages
- [SDESK-4084] Adding slugline to tooltip of coverages in planning.
- [SDESK-4083] Allow cancelled coverages to be removed
- [SDESK-4041] Assigned user tooltip in assignment list item
- [SDESK-4040] Add Contact field to coverages
- [SDESK-4042] Add coverage item action to planning list item
- [SDESK-4045] Treat 'content item type' of text equivalent to a text coverage

### Fixes
- [SDESK-4320] Duplicated Planning item does not get locked if the original is linked to an Event
- (fix) Limit pydocstyle < 4.0
- [SDESK-4453] Coverage schedule time for published or scheduled news item should be derived from the news item
- [SDESK-4451] sequence_no in delivery record was null instead of 0 by default
- [SDESK-4410] Location from an event was not getting deleted
- [SDESK-4410] Bug when setting time for  Coverage Schedule Date
- [SDESK-4414] Locking linked updated news story was locking the assignment
- [SDESK-4400] Time in Event exports are in UTC instead of server timezone
- [SDBELGA-108] List all recent event templates is 'limit' query param was not provided.
- [SDESK-4368] Publish time in delivery record is not taking content item's publish schedule into account
- [SDESK-4349] When LONG_EVENT_DURATION_THRESHOLD is configured and if the coverage time is not set, set dates and times separately
- [SDESK-4345] When coverage is added from add-to-planning modal, coverage time should always be rounded to nearest hour
- [SDESK-4346] Unposting cancelled planning item after an assignment was removed was causing an error
- [SDESK-4344] When adding content to planning map headline and abstract of story to headline and description of planning item and vice versa
- [SDESK-4341] Fulfil Assignment modal should only be thrown when publishing stories not already linked to Planning
- [SDESK-4321] Saving an Event fails after the user creates a Planning item
- [SDESK-4244] Re-request the event and event/planning lists on unpost/post
- [SDESK-4122] Assignment notification click was not opening the assignment when auto-add-to-workflow feature was turned ON
- [SDESK-4243] Update coverage status on editor when 'cancel all coverage' is executed
- [SDESK-4300] Update autosave item after post/unpost/save
- fix(convert killed event to recurring) request on notification now includes killed
- [SDESK-4296] Assignments behaviour when linked updated content moves desk
- [SDESK-4250] Place the cursor at the end of text in slugline when opening items in authoring
- [SDESK-4242] Validate planning on post to trap missing slugline
- [SDESK-4219] Remove the ability to edit in Add to Planning Modal
- [SDESK-4245] Fix error on update repetitions on killed events
- [SDESK-4273] Use exact slugline match in Fulfil Assignment on Publish
- Fix bug with 'PLANNING_FULFIL_ON_PUBLISH_FOR_DESKS' config if the config is an empty string
- [SDESK-4266] Handle removing featured planning items in the client
- [SDESK-4240] (fix) Location deleted when assigning a calendar to an Event
- [SDESK-4252] Fulfil Assignment links was updating regardless of PLANNING_LINK_UPDATES_TO_COVERAGES setting
- (fix) Limit assignments in fulfil modal to the content type
- fix(locations) Handle Locations with no address
- [SDESK-4214] Coverage completion notifications being generated on content updates
- [SDESK-4193] Convert unique_id to int in eventUtils.modifyForClient
- Ignore unique_id when comparing items and for autosave
- [SDNTB-572] Fix gathering of ingest providers
- (fix) Event schedule input not using proper timezone
- [SDESK-4026] Maintain sequence no during delivery creation on story updates and key assignments in complete status once completed
- [SDESK-4131] Force update redux store when locking/unlocking items
- [EVENTS] fixed crash on missing `state_reason` + don't override requested `state` update
- [SDESK-4142] (fix) Preview/Editor panels not scrolling in 'AddToPlanning'/'FulfilAssignment' modals
- [SDESK-4141] Only allow 'Assign To Calendar' if Event is not locked
- [SDESK-3975] (fix): FeaturedPlanning not clearing modal state when force unlocked
- [SDESK-4118] Error when unposting event which has a planning item
- [SDESK-4064] Netrwork Errors while filling link field of an event
- (fix) Last day of the multi-day event was not visible in the events list.
- validate custom fields according to schema
- (fix) Could not remove cancelled coverage and assigned user tooltip was not visible
- [SDESK-4056] Unassigned coverage will be put in workflow when assigned
- fix item state not being translated
- [SDESK-4088] Update repetitions was changing state of a published item
- [SDESK-4087] Items visibility in Featured Stories Modal
- [SDESK-3980] Inactive or disabled users should not be available for assignment selection
- (fix) Using gettext function of planning module so that is backward compatible.
- [SDESK-4035] Assignment notifications were not handled
- [SDESK-4036] Modified date validation to handle dateformat configured for the instance.
- (fix) overide_auto_assign_to_workflow flag should not be added to item flags.


## [1.5] 2019-03-07
### Features
- [SDESK-4023,SDESK-4024] Auto add coverage to workflow and override
- [SDESK-3985] Adding scheduled date as default sort for assignment.
- [SDESK-3979] Have single drop down to select assignment form My Assignments and Desk
- [SDESK-3979]: Allow fulfil action if the item and assignment are not same desk.
- [SDESK-3742] Navigate item list from keyboard and preview item on 'enter' key
- [SDESK-3782] Command to republish events and planning to newsroom.
- [SDESK-3659] Adding references to planning items while posting event.
- [SDESK-3637] Reverting completed text assignments and unlinking  published archive items

### Fixes
- Fixing the event schedule summary in case events with different timezone than local timezone.
- Fix the problem where edit metadata of recurring event creates more recurring events.
- [SDESK-4039] Modifying action dialog to use event timezone instead of local browser timezone.
- [SDESK-4031] Using timezone offset to determine if the event is in different timezone.
- [SDESK-4025] Add tooltip to not for publication slider
- Removed attachment's file type info in event/planning item preview 
- [SDESK-4018]: Various issues with AddToPlanning/FulfilAssignment actions * Remove @wip from feature tests
- [SDESK-3952] Fixing server error on reschedule event with planning.
- Add httmock to requirements.txt
- Fix add to planning item validation to use planning schema (#1122)
- Use archive item when fulfiling assignment on published item
- SDESK-3799 Fix code formatting issues.
- SDESK-3799 Cleanup and document commands in manage.py
- [SDESK-3763] Setting timezone for featured planning for save and post action.
- [SDESK-3853] Prevent loading list items when scrolling a sub-menu
- [SDESK-3836] Add 'selection_type' to vocabularies.json
- fix unstable unit test
- fix(profiles): handle custom cvs via planning types
- [SDESK-3808] Assign to calendar overwriting all calendars in the series * (fix) events * planning view not refetching after event series updated
- [SDESK-3831] Clear week day when the frequency is not set to weekly
- [SDESK-3802] Fixing the issue with save button being disable for all day event.
- [SDESK-3801] Fixing the tooltip for not for publication icon.
- [SDESK-3805][SDESK-3807] Fixing alignment issues with event dates.
- [SDESK-3802] Return promise on submit of convert to recurring form.
- (fix) Remove unwanted attributes from planning output formatter.
- make toggle box toggle on enter when focused
