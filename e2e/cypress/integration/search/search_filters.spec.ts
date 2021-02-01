import {setup, login, waitForPageLoad} from '../../support/common';
import {SearchFilters} from '../../support/planning';

describe('Search.Filters: creating search filters', () => {
    const searchFilters = new SearchFilters();

    beforeEach(() => {
        setup({fixture_profile: 'planning_prepopulate_data'}, '/#/planning');
        login();
        waitForPageLoad.planning();
    });

    it('can create search filters', () => {
        // Create a combined filter
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

        // Create a Planning filter
        searchFilters.addNewFilterButton.click();
        searchFilters.editor.openAllToggleBoxes();

        searchFilters.editor.enterSearchParams({
            filter_name: 'Test Planning',
            item_type: 'Planning',
            slugline: 'Original',
            anpa_category: ['Overseas Sport'],
            subject: ['archaeology', 'music'],
        });

        searchFilters.saveFilterButton.click();
        searchFilters.waitForContentPanelToClose();
        searchFilters.expectItemCount(3);
        searchFilters.expectItemText(2, 'Test Planning');

        // Create a schedule
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
