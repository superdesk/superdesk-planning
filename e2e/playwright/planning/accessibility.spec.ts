import {test, expect} from '@playwright/test';

import {setup, login, waitForPageLoad, addItems} from '../utils/common';
import {PlanningList} from '../page-object-models/planning';
import {TIME_STRINGS, TIMEZONE} from '../utils/time';
import {createPlanningFor} from '../utils/fixtures/planning';
import {createEventFor} from '../utils/fixtures/events';

test.describe('Planning.Planning: list view accessibility', () => {
    let list: PlanningList;

    test.beforeEach(async ({page}) => {
        list = new PlanningList(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');

        await addItems(
            page.request,
            'planning',
            [
                createPlanningFor.today({slugline: 'group 1, item 1'}, TIME_STRINGS[0]),
                createPlanningFor.today({slugline: 'group 1, item 2'}, TIME_STRINGS[1]),
                createPlanningFor.today({slugline: 'group 1, item 3'}, TIME_STRINGS[2]),
                createPlanningFor.tomorrow({slugline: 'group 2, item 1'}, TIME_STRINGS[0]),
                createPlanningFor.tomorrow({slugline: 'group 2, item 2'}, TIME_STRINGS[1]),
                createPlanningFor.tomorrow({slugline: 'group 2, item 3'}, TIME_STRINGS[2])
            ],
        );

        await addItems(
            page.request,
            'events',
            [
                createEventFor.today(
                    {
                        calendars: [],
                        place: [],
                        name: 'Test',
                        slugline: 'group 2, item 4',
                    },
                    TIMEZONE,
                    TIME_STRINGS[3],
                    TIME_STRINGS[4],
                )
            ]
        );

        await login(page);
        await waitForPageLoad.planning(page);
        await list.expectItemCount(7);
    });

    test('can navigate a list using arrow up/down keys', async ({page}) => {
        const group = page.locator('.sd-list-item-group').first();

        await group.focus();
        page.keyboard.press('ArrowDown');
        await expect(group).toHaveAttribute('aria-activedescendant', 'list-panel-0--0');

        page.keyboard.press('ArrowDown');
        await expect(group).toHaveAttribute('aria-activedescendant', 'list-panel-0--1');

        page.keyboard.press('ArrowDown');
        await expect(group).toHaveAttribute('aria-activedescendant', 'list-panel-0--2');

        page.keyboard.press('ArrowUp');
        await expect(group).toHaveAttribute('aria-activedescendant', 'list-panel-0--1');

        page.keyboard.press('ArrowUp');
        await expect(group).toHaveAttribute('aria-activedescendant', 'list-panel-0--0');
    });

    test('can open an item for editing using a keyboard', {
        annotation: [
            {type: 'confluence', description: '1311835157 complete'}, // Edit planning item in popup
        ],
    }, async ({page}) => {
        const group = page.locator('.sd-list-item-group').first();

        await group.focus();
        page.keyboard.press('ArrowDown'); // group 1, item 1
        page.keyboard.press('ArrowDown'); // group 1, item 2

        page.keyboard.press('Enter'); // opens action menu
        await page.getByTestId('menu').waitFor({state: 'visible'});
        page.keyboard.press('ArrowDown'); // "Edit in popup" is the second option in the menu
        page.keyboard.press('Enter');

        await expect(
            page.getByTestId('planning-editor')
                .getByTestId('field-slugline')
                .getByRole('textbox')
        ).toHaveValue('group 1, item 2');
    });

    test('maintains focus after quiting item actions menu', async ({page}) => {
        const group = page.locator('.sd-list-item-group').first();

        await group.focus();
        page.keyboard.press('ArrowDown'); // group 1, item 1
        page.keyboard.press('ArrowDown'); // group 1, item 2

        page.keyboard.press('Enter'); // opens action menu
        await page.getByTestId('menu').waitFor({state: 'visible'});
        page.keyboard.press('Escape'); // closes action menu

        page.keyboard.press('ArrowDown'); // group 1, item 3
        await expect(group).toHaveAttribute('aria-activedescendant', 'list-panel-0--2');
    });

    test('maintains focus after returning from actions button to the list', async ({page}) => {
        const group = page.locator('.sd-list-item-group').first();

        await group.focus();
        page.keyboard.press('ArrowDown'); // group 1, item 1
        page.keyboard.press('ArrowDown'); // group 1, item 2
        page.keyboard.press('Tab'); // focus actions button
        await expect(page.getByTestId('menu-button')).toBeFocused();

        page.keyboard.press('Shift+Tab'); // returns to group 1 item 2

        page.keyboard.press('Enter'); // opens action menu
        await page.getByTestId('menu').waitFor({state: 'visible'});
        page.keyboard.press('ArrowDown'); // "Edit in popup" is the second option in the menu
        page.keyboard.press('Enter');

        await expect(
            page.getByTestId('planning-editor')
                .getByTestId('field-slugline')
                .getByRole('textbox')
        ).toHaveValue('group 1, item 2');
    });

    test('can switch groups using tab key when an item is selected', async ({page}) => {
        const group1 = page.locator('.sd-list-item-group').nth(0);
        const group2 = page.locator('.sd-list-item-group').nth(1);

        await expect(group1).not.toBeFocused();
        await expect(group2).not.toBeFocused();

        await group1.focus();

        page.keyboard.press('ArrowDown'); // group 1, item 1
        page.keyboard.press('ArrowDown'); // group 1, item 2

        await expect(group1).toBeFocused();
        await expect(group2).not.toBeFocused();

        page.keyboard.press('Tab'); // focus on menu
        await expect(page.getByTestId('menu-button')).toBeFocused();

        page.keyboard.press('Tab'); // focus on next group

        await expect(group1).not.toBeFocused();
        await expect(group2).toBeFocused();

        page.keyboard.press('ArrowDown'); // group 2, item 1
        page.keyboard.press('ArrowDown'); // group 2, item 2

        await expect(group1).not.toBeFocused();
        await expect(group2).toBeFocused();

        page.keyboard.press('Shift+Tab'); // focus on previous group
        await expect(group1).toBeFocused();
        await expect(group2).not.toBeFocused();

        page.keyboard.press('ArrowDown'); // group 1, item 1
        page.keyboard.press('ArrowDown'); // group 1, item 2

        await expect(group1).toBeFocused();
        await expect(group2).not.toBeFocused();
    });

    test('limits navigation with arrow up/down keys to selected group', async ({page}) => {
        const group1 = page.locator('.sd-list-item-group').nth(0);
        const group2 = page.locator('.sd-list-item-group').nth(1);

        await expect(group1).not.toBeFocused();
        await expect(group2).not.toBeFocused();

        await group1.focus();

        page.keyboard.press('ArrowDown'); // group 1, item 1

        await expect(group1).toBeFocused();
        await expect(group2).not.toBeFocused();

        page.keyboard.press('ArrowDown'); // group 1, item 2
        page.keyboard.press('ArrowDown'); // group 1, item 3
        page.keyboard.press('ArrowDown'); // group 1, item 3
        page.keyboard.press('ArrowDown'); // does nothing when triggred on last item
        page.keyboard.press('ArrowDown'); // does nothing when triggred on last item

        await expect(group1).toBeFocused();
        await expect(group2).not.toBeFocused();


        page.keyboard.press('Tab'); // focus on menu
        page.keyboard.press('Tab'); // focus on next group

        await expect(group1).not.toBeFocused();
        await expect(group2).toBeFocused();

        page.keyboard.press('ArrowDown'); // group 2, item 1
        page.keyboard.press('ArrowDown'); // group 2, item 2
        page.keyboard.press('ArrowUp'); // group 2, item 1
        page.keyboard.press('ArrowUp'); // does nothing when triggred on first item
        page.keyboard.press('ArrowUp'); // does nothing when triggred on first item

        await expect(group1).not.toBeFocused();
        await expect(group2).toBeFocused();
    });

    test('returns focus to the list item after preview is closed', async ({page}) => {
        const group = page.locator('.sd-list-item-group').first();

        await group.focus();

        // Test on event. It's 4th in the list
        page.keyboard.press('ArrowDown'); // group 1, item 1
        page.keyboard.press('ArrowDown'); // group 1, item 2
        page.keyboard.press('ArrowDown'); // group 1, item 3
        page.keyboard.press('ArrowDown'); // group 1, item 4

        await expect(group).toHaveAttribute('aria-activedescendant', 'list-panel-0--3');

        page.keyboard.press('Enter'); // opens actions menu
        await page.getByTestId('menu').waitFor({state: 'visible'});
        page.keyboard.press('Enter'); // "Preview" is the first option in the menu

        await expect(
            page.locator('.sd-preview-panel').getByTestId('field-slugline')
        ).toContainText('group 2, item 4');

        await page.locator('.sd-preview-panel .side-panel__header')
            .getByRole('button', {name: 'Close'})
            .click();

        await expect(group).toHaveAttribute('aria-activedescendant', 'list-panel-0--3');

        page.keyboard.press('ArrowUp'); // group 1, item 3

        await expect(group).toHaveAttribute('aria-activedescendant', 'list-panel-0--2');
    });
});
