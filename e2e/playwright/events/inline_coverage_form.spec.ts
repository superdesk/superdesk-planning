import {test, expect} from '@playwright/test';
import type {Locator, Page} from '@playwright/test';

import {setup, login, waitForPageLoad, addItems, setInlineCoverageForm} from '../utils/common';
import {CoverageInlineForm, EventEditor, PlanningList} from '../page-object-models/planning';
import {createEventFor} from '../utils/fixtures/events';

const DESK = 'Sports Desk';

function selectedOption(coverage: Locator, field: string): Locator {
    return coverage.getByTestId(field).locator('option:checked');
}

test.describe('Planning.Events: inline coverage form', () => {
    let editor: EventEditor;
    let inlineForm: CoverageInlineForm;
    let list: PlanningList;

    test.beforeEach(async ({page}) => {
        editor = new EventEditor(page);
        inlineForm = new CoverageInlineForm(editor.element.getByTestId('field-coverages'));
        list = new PlanningList(page);
    });

    async function prepare(page: Page, inlineFormEnabled: boolean): Promise<void> {
        await setInlineCoverageForm(page, inlineFormEnabled);
        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await addItems(page.request, 'events', [createEventFor.today({
            state: 'draft',
            name: 'Inline coverages',
            slugline: 'inline-coverages',
        })]);
        await login(page);
    }

    async function openEvent(page: Page): Promise<void> {
        await waitForPageLoad.planning(page);

        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await editor.waitLoadingComplete();
    }

    test('adds a coverage per ticked content type and keeps them after a save and reload', async ({page}) => {
        test.setTimeout(120000);

        await prepare(page, true);
        await openEvent(page);

        await expect(inlineForm.openButton).toBeVisible();
        await expect(inlineForm.coveragesField.getByTestId('create-button')).not.toBeAttached();

        await inlineForm.open();
        await inlineForm.enableType('text');
        await inlineForm.enableType('picture');
        await inlineForm.setDesk('text', DESK);
        await inlineForm.add();

        await expect(inlineForm.coverage(0)).toBeVisible();
        await expect(inlineForm.coverage(1)).toBeVisible();
        await expect(inlineForm.coverage(2)).not.toBeAttached();

        await expect(inlineForm.element).not.toBeAttached();
        await inlineForm.open();
        await inlineForm.expectNoTypesEnabled();
        await inlineForm.cancel();
        await expect(inlineForm.element).not.toBeAttached();
        await expect(inlineForm.openButton).toBeVisible();

        await editor.saveButton.click();

        // Reloading with the item still locked leaves the app on its loading screen,
        // so hand the lock back before starting over.
        await editor.closeButton.click();
        await editor.waitTillClosed();

        await page.reload();
        await openEvent(page);

        const textCoverage = inlineForm.coverage(0);
        const pictureCoverage = inlineForm.coverage(1);

        await inlineForm.expandCoverage(0);
        await inlineForm.expandCoverage(1);

        await expect(selectedOption(textCoverage, 'field-g2_content_type')).toHaveText('Text');
        await expect(selectedOption(pictureCoverage, 'field-g2_content_type')).toHaveText('Picture');
        await expect(textCoverage).toContainText(DESK);

        // Picking a desk moves the coverage to Planned, because the e2e server leaves
        // PLANNING_MANUAL_NEWS_COVERAGE_STATUS unset.
        await expect(selectedOption(textCoverage, 'field-news_coverage_status')).toHaveText('Planned');
    });

    test('falls back to the add coverage button when the config is off', async ({page}) => {
        await prepare(page, false);
        await openEvent(page);

        await expect(inlineForm.coveragesField.getByTestId('create-button')).toBeVisible();
        await expect(inlineForm.openButton).not.toBeAttached();
    });
});
