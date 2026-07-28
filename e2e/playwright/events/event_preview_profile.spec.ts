import {test, expect} from '@playwright/test';

import {setup, addItems, login, waitForPageLoad} from '../utils/common';
import {PlanningList, PlanningPreview} from '../utils/planning';
import {createEventFor} from '../utils/fixtures/events';
import {createPlanningFor} from '../utils/fixtures/planning';
import {EVENT_PROFILE_GROUPED_PREVIEW} from '../utils/fixtures/planning_types';

const EVENT_ID = 'e2e-event-profile-preview';

test.describe('Planning.Events: profile driven preview panel', () => {
    let list: PlanningList;
    let preview: PlanningPreview;

    const openPreview = async () => {
        await list.item(0).click();
        await preview.waitTillOpen();
    };

    test.beforeEach(async ({page}) => {
        list = new PlanningList(page);
        preview = new PlanningPreview(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await addItems(page.request, 'planning_types', [EVENT_PROFILE_GROUPED_PREVIEW]);
        await addItems(page.request, 'events', [createEventFor.today({
            guid: EVENT_ID,
            slugline: 'Event Profile Preview',
            definition_short: 'A short event description',
            anpa_category: [{qcode: 'e', name: 'Entertainment'}],
            // location deliberately left unset to cover empty-field rendering
        })]);
        await addItems(page.request, 'planning', [createPlanningFor.today({
            slugline: 'Linked Planning',
            related_events: [{_id: EVENT_ID, link_type: 'primary'}],
        })]);

        await login(page);
        await waitForPageLoad.planning(page);
    });

    test('preview shows fields in profile order and profile groups', async () => {
        await openPreview();

        const mainGroup = preview.element.getByTestId('preview-group__main');

        const fieldOrder = [
            'field-slugline',
            'field-dates',
            'field-definition_short',
            'field-location',
        ];
        const mainGroupRows = mainGroup.locator('[data-test-id^="field-"]');

        await expect(mainGroupRows).toHaveCount(fieldOrder.length);
        for (let index = 0; index < fieldOrder.length; index++) {
            await expect(mainGroupRows.nth(index)).toHaveAttribute('data-test-id', fieldOrder[index]);
        }

        const location = preview.element.getByTestId('field-location');

        await expect(location.locator('label')).toHaveText('Location:');
        await expect(location.locator('p')).toHaveText('-');

        const toggleGroup = preview.element.getByTestId('toggle-extra');

        await expect(toggleGroup).toBeVisible();
        await expect(toggleGroup.getByRole('button')).toHaveAttribute('aria-expanded', 'false');

        await toggleGroup.getByRole('button').click();
        await expect(toggleGroup.getByTestId('field-anpa_category')).toBeVisible();
        await expect(toggleGroup.getByTestId('field-anpa_category')).toContainText('Entertainment');
    });

    test('attachments render before related plannings, without nested toggles', async () => {
        await openPreview();

        const attachments = preview.element.getByTestId('toggle-attachments');

        await expect(attachments).toBeVisible();
        await attachments.getByRole('button').click();

        // The files field must not nest its own toggle box inside the group toggle
        await expect(attachments).toContainText('No attached files added.');
        await expect(attachments.locator('.toggle-box')).toHaveCount(0);

        const heading = preview.element.locator('h3', {hasText: 'Related Plannings'});

        await expect(heading).toBeVisible();
        await expect(preview.element).toContainText('Linked Planning');

        const html = await preview.element.innerHTML();

        expect(html.indexOf('toggle-attachments')).toBeGreaterThan(-1);
        expect(html.indexOf('toggle-attachments')).toBeLessThan(html.indexOf('Related Plannings'));
    });
});
