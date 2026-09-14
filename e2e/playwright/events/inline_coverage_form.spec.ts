import {test, expect} from '@playwright/test';
import type {Locator, Page} from '@playwright/test';

import {setup, login, waitForPageLoad, addItems, enableInlineCoverageForm} from '../utils/common';
import {
    CoverageInlineForm,
    EmbeddedCoverageEditor,
    EventEditor,
    PlanningList,
} from '../page-object-models/planning';
import {createEventFor} from '../utils/fixtures/events';
import {createPlanningFor} from '../utils/fixtures/planning';

const DESK = 'Sports Desk';

function selectedOption(coverage: Locator, field: string): Locator {
    return coverage.getByTestId(field).locator('option:checked');
}

test.describe('Planning.Events: inline coverage form', () => {
    let editor: EventEditor;
    let embedded: EmbeddedCoverageEditor;
    let inlineForm: CoverageInlineForm;
    let list: PlanningList;

    test.beforeEach(async ({page}) => {
        editor = new EventEditor(page);
        embedded = new EmbeddedCoverageEditor(editor);
        inlineForm = new CoverageInlineForm(embedded, 0);
        list = new PlanningList(page);
    });

    async function openEvent(page: Page): Promise<void> {
        await waitForPageLoad.planning(page);

        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await editor.waitLoadingComplete();
    }

    test('adds a coverage for every ticked content type', async ({page}) => {
        await enableInlineCoverageForm(page);
        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await addItems(page.request, 'events', [createEventFor.today({
            state: 'draft',
            name: 'Inline coverages',
            slugline: 'inline-coverages',
        })]);
        await login(page);
        await openEvent(page);

        // The card remounts while its autosave document is created, which swallows clicks
        // landing in that window, so let the autosave finish before touching the form.
        const autosaved = embedded.waitForAutosaved(page, 'PATCH');

        await editor.clickBookmark('add_planning');
        await expect(embedded.getPlanningItem(0)).toBeVisible();
        await autosaved;
        await embedded.expand(0);

        await expect(inlineForm.element).toBeVisible();
        await expect(embedded.getAddCoverageForm(0)).not.toBeVisible();

        await inlineForm.enableType('text');
        await inlineForm.enableType('picture');
        await inlineForm.setDesk('text', DESK);
        await inlineForm.add();

        await expect(embedded.getRelatedCoverage(0, 0)).toBeVisible();
        await expect(embedded.getRelatedCoverage(0, 1)).toBeVisible();
        await expect(embedded.getRelatedCoverage(0, 2)).not.toBeAttached();

        await inlineForm.expectNoTypesEnabled();
    });

    test('keeps the added coverages, their desk and their status after a reload', async ({page}) => {
        test.setTimeout(120000);

        const eventId = `e2e-inline-coverage-form-${Date.now()}`;

        await enableInlineCoverageForm(page);
        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await addItems(page.request, 'events', [createEventFor.today({
            guid: eventId,
            state: 'draft',
            name: 'Inline coverages',
            slugline: 'inline-coverages',
        })]);
        await addItems(page.request, 'planning', [createPlanningFor.today({
            slugline: 'INLINE-COVERAGES-PLAN',
            related_events: [{_id: eventId, link_type: 'primary'}],
        })]);
        await login(page);
        await openEvent(page);

        await embedded.expand(0);
        await expect(inlineForm.element).toBeVisible();

        await inlineForm.enableType('text');
        await inlineForm.enableType('picture');
        await inlineForm.setDesk('text', DESK);
        await inlineForm.add();

        await expect(embedded.getRelatedCoverage(0, 1)).toBeVisible();

        await embedded.save(0);

        // Reloading with the item still locked leaves the app on its loading screen,
        // so hand the lock back before starting over.
        await editor.closeButton.click();
        await editor.waitTillClosed();

        await page.reload();
        await openEvent(page);
        await embedded.expand(0);

        const textCoverage = embedded.getRelatedCoverage(0, 0);
        const pictureCoverage = embedded.getRelatedCoverage(0, 1);

        await embedded.expandRelatedCoverage(0, 0);
        await embedded.expandRelatedCoverage(0, 1);

        await expect(selectedOption(textCoverage, 'field-g2_content_type')).toHaveText('Text');
        await expect(selectedOption(pictureCoverage, 'field-g2_content_type')).toHaveText('Picture');
        await expect(textCoverage).toContainText(DESK);

        // Picking a desk moves the coverage to Planned, because the e2e server leaves
        // PLANNING_MANUAL_NEWS_COVERAGE_STATUS unset.
        await expect(selectedOption(textCoverage, 'field-news_coverage_status')).toHaveText('Planned');
    });

    test('falls back to the add coverage button when the config is off', async ({page}) => {
        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await addItems(page.request, 'events', [createEventFor.today({
            state: 'draft',
            name: 'Inline coverages',
            slugline: 'inline-coverages',
        })]);
        await login(page);
        await openEvent(page);

        const autosaved = embedded.waitForAutosaved(page, 'PATCH');

        await editor.clickBookmark('add_planning');
        await expect(embedded.getPlanningItem(0)).toBeVisible();
        await autosaved;
        await embedded.expand(0);

        await expect(embedded.getAddCoverageForm(0)).toBeVisible();
        await expect(inlineForm.element).not.toBeAttached();
    });
});
