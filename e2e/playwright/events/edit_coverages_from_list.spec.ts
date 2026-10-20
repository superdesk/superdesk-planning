import {test, expect} from '@playwright/test';

import {setup, addItems, login, waitForPageLoad} from '../utils/common';
import {AdvancedSearch, PlanningList} from '../page-object-models/planning';
import {createEventFor} from '../utils/fixtures/events';

const NAME = 'Edit coverages from event list';

function eventWithTextCoverage() {
    const event = createEventFor.today({name: NAME, slugline: NAME});

    return {
        ...event,
        coverages: [{
            workflow_status: 'draft',
            news_coverage_status: {qcode: 'ncostat:int', name: 'coverage intended', label: 'Planned'},
            planning: {
                g2_content_type: 'text',
                language: 'en',
                slugline: NAME,
                scheduled: event.dates.end,
            },
        }],
    };
}

test.describe('Planning.Events: edit coverages from the event list', () => {
    let list: PlanningList;
    let search: AdvancedSearch;

    test.beforeEach(async ({page}) => {
        list = new PlanningList(page);
        search = new AdvancedSearch(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await addItems(page.request, 'events', [eventWithTextCoverage()]);
    });

    test('updates a coverage status through Edit Coverages', async ({page}) => {
        await login(page);
        await waitForPageLoad.planning(page);
        await search.viewEventsOnly();
        await expect(list.item(0)).toContainText(NAME);

        const menu = await list.openActionMenu(0);
        const actions = await menu.getByRole('menuitem').allInnerTexts();
        const labels = actions.map((label) => label.trim());

        expect(labels[labels.indexOf('Edit in popup') + 1]).toBe('Edit Coverages');
        await menu.getByRole('menuitem', {name: 'Edit Coverages'}).click();

        const modal = page.getByRole('dialog', {name: 'Add Coverages (advanced mode)'});
        await expect(modal).toBeVisible();
        const status = modal.getByLabel('Status');

        await expect(status).toHaveValue('ncostat:int');
        await status.selectOption('ncostat:notdec');
        await modal.getByRole('button', {name: 'Save', exact: true}).click();
        await expect(modal).not.toBeVisible();

        // The action is only offered for unlocked events, so reopening also proves the lock was released
        await list.clickAction(0, 'Edit Coverages');
        await expect(modal).toBeVisible();
        await expect(modal.getByLabel('Status')).toHaveValue('ncostat:notdec');
    });

    test('hides Edit Coverages when the event profile has no coverages field', async ({page}) => {
        await addItems(page.request, 'planning_types', [{
            name: 'event',
            type: 'event',
            editor: {coverages: {enabled: false}},
        }]);
        await login(page);
        await waitForPageLoad.planning(page);
        await search.viewEventsOnly();
        await expect(list.item(0)).toContainText(NAME);

        const menu = await list.openActionMenu(0);

        await expect(menu.getByRole('menuitem', {name: 'Edit in popup'})).toBeVisible();
        await expect(menu.getByRole('menuitem', {name: 'Edit Coverages'})).not.toBeAttached();
    });
});
