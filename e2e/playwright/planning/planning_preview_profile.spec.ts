import {test, expect, Locator} from '@playwright/test';

import {setup, addItems, login, waitForPageLoad} from '../utils/common';
import {PlanningList, PlanningPreview} from '../utils/planning';
import {createPlanningFor} from '../utils/fixtures/planning';
import {PLANNING_PROFILE_GROUPED_PREVIEW} from '../utils/fixtures/planning_types';

// Longer than the 500 character truncation threshold, no newlines,
// with a marker at the end that is only visible once expanded.
const LONG_TEXT_HEAD = 'Long description preview text. '.repeat(20);
const LONG_TEXT_TAIL = 'END-OF-DESCRIPTION-MARKER';
const LONG_TEXT = LONG_TEXT_HEAD + LONG_TEXT_TAIL;

test.describe('Planning.Planning: profile driven preview panel', () => {
    let list: PlanningList;
    let preview: PlanningPreview;

    const openPreview = async () => {
        await list.item(0).click();
        await preview.waitTillOpen();
    };

    const expandableLink = (row: Locator): Locator => row.locator('.sd-text__expandable-link');

    test.beforeEach(async ({page}) => {
        list = new PlanningList(page);
        preview = new PlanningPreview(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await addItems(page.request, 'planning_types', [PLANNING_PROFILE_GROUPED_PREVIEW]);
        await addItems(
            page.request,
            'planning',
            [createPlanningFor.today({
                slugline: 'Profile Preview',
                name: 'Field Without A Group',
                description_text: LONG_TEXT,
                anpa_category: [{qcode: 'e', name: 'Entertainment'}],
                priority: 2,
                // internal_note deliberately left unset to cover empty-field rendering
            })],
        );

        await login(page);
        await waitForPageLoad.planning(page);
    });

    test('preview shows fields in profile order and profile groups', async () => {
        await openPreview();

        const mainGroup = preview.element.getByTestId('preview-group__main');
        const mainGroupRows = mainGroup.locator('[data-test-id^="field-"]');
        const fieldOrder = [
            'field-description_text',
            'field-slugline',
            'field-priority',
            'field-planning_date',
            'field-internal_note',
        ];

        await expect(mainGroupRows).toHaveCount(fieldOrder.length);
        for (let index = 0; index < fieldOrder.length; index++) {
            await expect(mainGroupRows.nth(index)).toHaveAttribute('data-test-id', fieldOrder[index]);
        }

        const toggleGroup = preview.element.getByTestId('toggle-extra');

        await expect(toggleGroup).toBeVisible();
        await expect(toggleGroup.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
        await expect(toggleGroup.getByTestId('field-anpa_category')).not.toBeVisible();

        await toggleGroup.getByRole('button').click();
        await expect(toggleGroup.getByTestId('field-anpa_category')).toBeVisible();
        // The 'ANPA Category' label is translated to 'Category' in this build
        await expect(toggleGroup.getByTestId('field-anpa_category')).toContainText('Category:');
        await expect(toggleGroup.getByTestId('field-anpa_category')).toContainText('Entertainment');

        // Enabled in the profile but assigned to no group, so it must not render
        await expect(preview.element.getByTestId('field-name')).not.toBeAttached();
    });

    test('empty enabled text field renders with a dash', async () => {
        await openPreview();

        const internalNote = preview.element.getByTestId('field-internal_note');

        await expect(internalNote).toBeVisible();
        await expect(internalNote.locator('label')).toHaveText('Internal Note:');
        await expect(internalNote.locator('p')).toHaveText('-');
    });

    test('priority renders as a coloured vocabulary badge', async () => {
        await openPreview();

        const priorityRow = preview.element.getByTestId('field-priority');

        await expect(priorityRow.locator('label')).toHaveText('Priority:');

        // The value renders as a badge showing the vocabulary item name,
        // not as the legacy plain "Priority:: 2" text
        const badge = priorityRow.getByTestId('priority-badge');

        await expect(badge).toHaveText('2');
        await expect(badge).toHaveCSS('background-color', 'rgb(255, 105, 0)');
        await expect(priorityRow).not.toContainText('Priority::');
    });

    test('long text field truncates with a working "Show all"/"Show less" link', async () => {
        await openPreview();

        const description = preview.element.getByTestId('field-description_text');

        await expect(description).toBeVisible();
        await expect(description).not.toContainText(LONG_TEXT_TAIL);
        await expect(expandableLink(description)).toContainText('Show all');

        await expandableLink(description).click();
        await expect(description).toContainText(LONG_TEXT_TAIL);
        await expect(expandableLink(description)).toContainText('Show less');

        await expandableLink(description).click();
        await expect(description).not.toContainText(LONG_TEXT_TAIL);
        await expect(expandableLink(description)).toContainText('Show all');
    });
});
