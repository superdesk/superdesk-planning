import {setup, login, waitForPageLoad, addItems} from '../../support/common';
import {SearchFilters} from '../../support/planning';
import {LOCATIONS} from '../../fixtures/events';
import {AGENDAS} from '../../fixtures/planning';

describe('Search.Filters: creating search filters', () => {
    const searchFilters = new SearchFilters();

    beforeEach(() => {
        setup({fixture_profile: 'planning_prepopulate_data'}, '/#/planning');
        login();
        waitForPageLoad.planning();
    });

    it('can create a combined filter', () => {
        addItems('agenda', [AGENDAS.sports, AGENDAS.politics]);
        searchFilters.open();
        searchFilters.addNewFilterButton.click();
        searchFilters.editor.openAllToggleBoxes();
        searchFilters.editor.enterSearchParams({
            filter_name: 'Test Combined',
            full_text: 'searching',
            name: 'Test',
            slugline: 'Original',
            anpa_category: ['Overseas Sport'],
            subject: ['archaeology', 'music'],
            state: ['Postponed'],
            only_posted: true,
            lock_state: 'Locked',
            'start_date.date': '12/12/2025',
            'end_date.date': '12/12/2025',
            calendars: ['Finance'],
            agendas: ['Sports'],
        });
        searchFilters.saveFilterButton.click();
        searchFilters.waitForContentPanelToClose();
        searchFilters.expectItemCount(1);
        searchFilters.expectItemText(0, 'Test Combined');

        searchFilters.edit(0);
        searchFilters.editor.openAllToggleBoxes();
        searchFilters.editor.enterSearchParams({
            filter_name: 'Test Empties',
            full_text: '',
            name: '',
            slugline: '',
            anpa_category: [],
            subject: [],
            state: [],
            only_posted: false,
            lock_state: '',
            calendars: [],
            agendas: [],
        });
        searchFilters.editor.clearDate('start');
        searchFilters.editor.clearDate('end');
        searchFilters.saveFilterButton.click();
        searchFilters.waitForContentPanelToClose();
        searchFilters.expectItemCount(1);
        searchFilters.expectItemText(0, 'Test Empties');
    });

    it('can create event filter', () => {
        addItems('locations', [LOCATIONS.sydney_opera_house]);

        searchFilters.open();
        searchFilters.addNewFilterButton.click();
        searchFilters.editor.openAllToggleBoxes();

        searchFilters.editor.enterSearchParams({
            filter_name: 'Test Events',
            item_type: 'Events',
            full_text: 'searching',
            name: 'Test',
            slugline: 'Original',
            anpa_category: ['Overseas Sport'],
            subject: ['archaeology', 'music'],
            state: ['Postponed'],
            only_posted: true,
            lock_state: 'Locked',
            'start_date.date': '12/12/2025',
            'end_date.date': '12/12/2025',
            calendars: ['Sport'],
            source: ['aap'],
            location: 'Sydney Opera House',
        });

        searchFilters.saveFilterButton.click();
        searchFilters.waitForContentPanelToClose();
        searchFilters.expectItemCount(1);
        searchFilters.expectItemText(0, 'Test Events');

        searchFilters.edit(0);
        searchFilters.editor.openAllToggleBoxes();
        searchFilters.editor.enterSearchParams({
            filter_name: 'Test Empties',
            full_text: '',
            name: '',
            slugline: '',
            anpa_category: [],
            subject: [],
            state: [],
            only_posted: false,
            lock_state: '',
            calendars: [],
            source: [],
            location: '',
        });
        searchFilters.editor.clearDate('start');
        searchFilters.editor.clearDate('end');
        searchFilters.saveFilterButton.click();
        searchFilters.waitForContentPanelToClose();
        searchFilters.expectItemCount(1);
        searchFilters.expectItemText(0, 'Test Empties');
    });

    it('can create planning filter', () => {
        addItems('agenda', [AGENDAS.sports, AGENDAS.politics]);

        searchFilters.open();
        searchFilters.addNewFilterButton.click();
        searchFilters.editor.openAllToggleBoxes();

        searchFilters.editor.enterSearchParams({
            filter_name: 'Test Planning',
            item_type: 'Planning',
            full_text: 'searching',
            slugline: 'Original',
            anpa_category: ['Overseas Sport'],
            subject: ['archaeology', 'music'],
            state: ['Postponed'],
            only_posted: true,
            lock_state: 'Locked',
            'start_date.date': '12/12/2025',
            'end_date.date': '12/12/2025',
            agendas: ['Sports'],
            urgency: '3',
            g2_content_type: 'Video',
            ad_hoc_planning: true,
            featured: true,
            include_scheduled_updates: true,
        });

        searchFilters.saveFilterButton.click();
        searchFilters.waitForContentPanelToClose();
        searchFilters.expectItemCount(1);
        searchFilters.expectItemText(0, 'Test Planning');

        searchFilters.edit(0);
        searchFilters.editor.openAllToggleBoxes();
        searchFilters.editor.enterSearchParams({
            filter_name: 'Test Empties',
            full_text: '',
            slugline: '',
            anpa_category: [],
            subject: [],
            state: [],
            only_posted: false,
            lock_state: '',
            agendas: [],
            urgency: 'None',
            g2_content_type: '',
            ad_hoc_planning: false,
            featured: false,
            include_scheduled_updates: false,
        });
        searchFilters.editor.clearDate('start');
        searchFilters.editor.clearDate('end');
        searchFilters.saveFilterButton.click();
        searchFilters.waitForContentPanelToClose();
        searchFilters.expectItemCount(1);
        searchFilters.expectItemText(0, 'Test Empties');
    });

    it('can create schedules', () => {
        searchFilters.open();
        searchFilters.addNewFilterButton.click();
        searchFilters.editor.openAllToggleBoxes();
        searchFilters.editor.enterSearchParams({
            filter_name: 'Test Combined',
            name: 'Test',
            slugline: 'Original',
            anpa_category: ['Overseas Sport'],
            subject: ['archaeology', 'music'],
        });

        searchFilters.saveFilterButton.click();
        searchFilters.waitForContentPanelToClose();
        searchFilters.expectItemCount(1);
        searchFilters.expectItemText(0, 'Test Combined');

        // Create an Event filter
        searchFilters.addNewFilterButton.click();
        searchFilters.editor.openAllToggleBoxes();

        searchFilters.editor.enterSearchParams({
            filter_name: 'Test Events',
            item_type: 'Events',
            name: 'Test',
            slugline: 'Original',
            anpa_category: ['Overseas Sport'],
            subject: ['archaeology', 'music'],
            calendars: ['Sport']
        });

        searchFilters.saveFilterButton.click();
        searchFilters.waitForContentPanelToClose();
        searchFilters.expectItemCount(2);
        searchFilters.expectItemText(1, 'Test Events');

        searchFilters.preview(0);
        searchFilters.waitForContentPanelToOpen();
        searchFilters.editScheduleButton.click();
        searchFilters.saveScheduleButton.click();
        searchFilters.waitForContentPanelToClose();
        searchFilters.expectItemText(0, 'Scheduled export: Hourly to Politic Desk');


        searchFilters.preview(1);
        searchFilters.waitForContentPanelToOpen();
        searchFilters.editScheduleButton.click();
        searchFilters.editor.enterSearchParams({
            frequency: 'Weekly',
        });
        searchFilters.saveScheduleButton.click();
        searchFilters.waitForContentPanelToClose();
        searchFilters.expectItemText(1, 'Scheduled export: Daily @ Every Hour to Politic Desk');

        searchFilters.preview(1);
        searchFilters.waitForContentPanelToOpen();
        searchFilters.editScheduleButton.click();
        searchFilters.editor.enterSearchParams({
            week_days: ['Su', 'Sa'],
            hour: '11:00',
            desk: 'Sports Desk',
        });
        searchFilters.saveScheduleButton.click();
        searchFilters.waitForContentPanelToClose();
        searchFilters.expectItemText(1, 'Scheduled export: Weekly @ 11:00 to Sports Desk');

        searchFilters.preview(1);
        searchFilters.waitForContentPanelToOpen();
        searchFilters.editScheduleButton.click();
        searchFilters.editor.enterSearchParams({
            frequency: 'Monthly',
            month_day: '4th',
            hour: '14:00',
        });
        searchFilters.saveScheduleButton.click();
        searchFilters.waitForContentPanelToClose();
        searchFilters.expectItemText(1, 'Scheduled export: Monthly on the 4th day @ 14:00 to Sports Desk');
    });
});
