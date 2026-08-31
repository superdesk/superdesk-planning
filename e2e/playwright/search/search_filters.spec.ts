import {test, expect} from '@playwright/test';

import {setup, login, waitForPageLoad, addItems} from '../utils/common';
import {SearchFilters} from '../page-object-models/planning';

import {LOCATIONS} from '../utils/fixtures/events';
import {AGENDAS} from '../utils/fixtures/planning';

test.describe('Search.Filters: creating search filters', () => {
    let searchFilters: SearchFilters;

    test.beforeEach(async ({page}) => {
        searchFilters = new SearchFilters(page);

        await addItems(page.request, 'agenda', [AGENDAS.sports, AGENDAS.politics]);
        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await login(page);
        await waitForPageLoad.planning(page);
    });

    test('can create a combined filter', async ({page}) => {
        await addItems(page.request, 'agenda', [AGENDAS.sports, AGENDAS.politics]);
        await searchFilters.open();
        await searchFilters.addNewFilterButton.click();
        await searchFilters.editor.openAllToggleBoxes();
        await searchFilters.editor.enterSearchParams({
            filter_name: 'Test Combined',
            full_text: 'searching',
            name: 'Test',
            slugline: 'Original',
            anpa_category: ['Overseas Sport'],
            subject: ['archaeology', 'music'],
            state: ['Postponed'],
            only_posted: true,
            lock_state: 'Locked',
            'start_date.date': '12/12/2045',
            'end_date.date': '12/12/2045',
            calendars: ['Finance'],
            agendas: ['Sports'],
        });
        await searchFilters.saveFilterButton.click();
        await searchFilters.waitForContentPanelToClose();
        await searchFilters.expectItemCount(1);
        await searchFilters.expectItemText(0, 'Test Combined');

        await searchFilters.edit(0);
        await searchFilters.editor.openAllToggleBoxes();
        await searchFilters.editor.enterSearchParams({
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
        await searchFilters.editor.clearDate('start');
        await searchFilters.editor.clearDate('end');
        await searchFilters.saveFilterButton.click();
        await searchFilters.waitForContentPanelToClose();
        await searchFilters.expectItemCount(1);
        await searchFilters.expectItemText(0, 'Test Empties');
    });

    test('can create event filter', {
        annotation: [
            // Planning filters and scheduled exports - basic cases (Mikayel) - PASS 02.11.22
            {type: 'confluence', description: '1311835173 complete'},
        ],
    }, async ({page}) => {
        await addItems(page.request, 'locations', [LOCATIONS.sydney_opera_house]);

        await searchFilters.open();
        await searchFilters.addNewFilterButton.click();
        await searchFilters.editor.openAllToggleBoxes();

        await searchFilters.editor.enterSearchParams({
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
            'start_date.date': '12/12/2045',
            'end_date.date': '12/12/2045',
            calendars: ['Sport'],
            source: ['aap'],
            location: 'Sydney Opera House',
        });

        await searchFilters.saveFilterButton.click();
        await searchFilters.waitForContentPanelToClose();
        await searchFilters.expectItemCount(1);
        await searchFilters.expectItemText(0, 'Test Events');

        await searchFilters.edit(0);
        await searchFilters.editor.openAllToggleBoxes();
        await searchFilters.editor.enterSearchParams({
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
        await searchFilters.editor.clearDate('start');
        await searchFilters.editor.clearDate('end');
        await searchFilters.saveFilterButton.click();
        await searchFilters.waitForContentPanelToClose();
        await searchFilters.expectItemCount(1);
        await searchFilters.expectItemText(0, 'Test Empties');
    });

    test('can create planning filter', async ({page}) => {
        await addItems(page.request, 'agenda', [AGENDAS.sports, AGENDAS.politics]);

        await searchFilters.open();
        await searchFilters.addNewFilterButton.click();
        await searchFilters.editor.openAllToggleBoxes();

        await searchFilters.editor.enterSearchParams({
            filter_name: 'Test Planning',
            item_type: 'Planning',
            full_text: 'searching',
            slugline: 'Original',
            anpa_category: ['Overseas Sport'],
            subject: ['archaeology', 'music'],
            state: ['Postponed'],
            only_posted: true,
            lock_state: 'Locked',
            'start_date.date': '12/12/2045',
            'end_date.date': '12/12/2045',
            agendas: ['Sports'],
            urgency: '3',
            g2_content_type: 'Video',
            ad_hoc_planning: true,
            featured: true,
            include_scheduled_updates: true,
        });

        await searchFilters.saveFilterButton.click();
        await searchFilters.waitForContentPanelToClose();
        await searchFilters.expectItemCount(1);
        await searchFilters.expectItemText(0, 'Test Planning');

        await searchFilters.edit(0);
        await searchFilters.editor.openAllToggleBoxes();
        await searchFilters.editor.enterSearchParams({
            filter_name: 'Test Empties',
            full_text: '',
            slugline: '',
            anpa_category: [],
            subject: [],
            state: [],
            only_posted: false,
            lock_state: '',
            agendas: [],
            urgency: '',
            g2_content_type: '',
            ad_hoc_planning: false,
            featured: false,
            include_scheduled_updates: false,
        });
        await searchFilters.editor.clearDate('start');
        await searchFilters.editor.clearDate('end');
        await searchFilters.saveFilterButton.click();
        await searchFilters.waitForContentPanelToClose();
        await searchFilters.expectItemCount(1);
        await searchFilters.expectItemText(0, 'Test Empties');
    });

    test('can create schedules', async ({page}) => {
        await searchFilters.open();
        await searchFilters.addNewFilterButton.click();
        await searchFilters.editor.openAllToggleBoxes();
        await searchFilters.editor.enterSearchParams({
            filter_name: 'Test Combined',
            name: 'Test',
            slugline: 'Original',
            anpa_category: ['Overseas Sport'],
            subject: ['archaeology', 'music'],
        });

        await searchFilters.saveFilterButton.click();
        await searchFilters.waitForContentPanelToClose();
        await searchFilters.expectItemCount(1);
        await searchFilters.expectItemText(0, 'Test Combined');

        // Create an Event filter
        await searchFilters.addNewFilterButton.click();
        await searchFilters.editor.openAllToggleBoxes();

        await searchFilters.editor.enterSearchParams({
            filter_name: 'Test Events',
            item_type: 'Events',
            name: 'Test',
            slugline: 'Original',
            anpa_category: ['Overseas Sport'],
            subject: ['archaeology', 'music'],
            calendars: ['Sport']
        });

        await searchFilters.saveFilterButton.click();
        await searchFilters.waitForContentPanelToClose();
        await searchFilters.expectItemCount(2);
        await searchFilters.expectItemText(1, 'Test Events');

        await searchFilters.preview(0);
        await searchFilters.waitForContentPanelToOpen();
        await searchFilters.editScheduleButton.click();
        await searchFilters.saveScheduleButton.click();
        await searchFilters.waitForContentPanelToClose();
        await searchFilters.expectItemText(0, 'Scheduled export: Hourly to Politic Desk');


        await searchFilters.preview(1);
        await searchFilters.waitForContentPanelToOpen();
        await searchFilters.editScheduleButton.click();
        await searchFilters.editor.enterSearchParams({
            frequency: 'Weekly',
        });
        await searchFilters.saveScheduleButton.click();
        await searchFilters.waitForContentPanelToClose();
        await searchFilters.expectItemText(1, 'Scheduled export: Daily @ 00:00 to Politic Desk');

        await searchFilters.preview(1);
        await searchFilters.waitForContentPanelToOpen();
        await searchFilters.editScheduleButton.click();
        await searchFilters.editor.enterSearchParams({
            week_days: ['Su', 'Sa'],
            desk: 'Sports Desk',
        });

        await page.getByTestId('field-hour').click();
        await page.getByTestId('time-picker-popover')
            .locator('.time-unit')
            .getByText('11')
            .first()
            .click();
        await expect (page.getByTestId('field-hour')).toHaveValue('11:00');
        await searchFilters.saveScheduleButton.click();
        await searchFilters.waitForContentPanelToClose();
        await searchFilters.expectItemText(1, 'Scheduled export: Weekly @ 11:00 to Sports Desk');

        await searchFilters.preview(1);
        await searchFilters.waitForContentPanelToOpen();
        await searchFilters.editScheduleButton.click();
        await searchFilters.editor.enterSearchParams({
            frequency: 'Monthly',
            month_day: '4th',
        });
        await page.getByTestId('field-hour').click();
        await page.getByTestId('time-picker-popover')
            .locator('.time-unit')
            .getByText('10')
            .first()
            .click();
        await expect(page.getByTestId('field-hour')).toHaveValue('10:00');
        await searchFilters.saveScheduleButton.click();
        await searchFilters.waitForContentPanelToClose();
        await searchFilters.expectItemText(1, 'Scheduled export: Monthly on the 4th day @ 10:00 to Sports Desk');
    });
});
