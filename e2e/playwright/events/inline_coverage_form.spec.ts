import {test, expect} from '@playwright/test';
import type {Locator, Page} from '@playwright/test';

import {setup, login, waitForPageLoad, addItems} from '../utils/common';
import {
    CoverageInlineForm,
    CoverageInlineEditor,
    EventEditor,
    ManageContentProfiles,
    ManageCoverageProfiles,
    PlanningList,
} from '../page-object-models/planning';
import {createEventFor} from '../utils/fixtures/events';
import {EVENT_PROFILE_INLINE_COVERAGES} from '../utils/fixtures/planning_types';

const DESK = 'Sports Desk';

function selectedOption(coverage: Locator, field: string): Locator {
    return coverage.getByTestId(field).locator('option:checked');
}

test.describe('Planning.Events: inline coverage form', () => {
    let editor: EventEditor;
    let inlineForm: CoverageInlineForm;
    let list: PlanningList;
    let manageProfiles: ManageContentProfiles;
    let manageCoverageProfiles: ManageCoverageProfiles;

    test.beforeEach(async ({page}) => {
        editor = new EventEditor(page);
        inlineForm = new CoverageInlineForm(editor.element.getByTestId('field-coverages'));
        list = new PlanningList(page);
        manageProfiles = new ManageContentProfiles(page);
        manageCoverageProfiles = new ManageCoverageProfiles(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await addItems(page.request, 'events', [createEventFor.today({
            state: 'draft',
            name: 'Inline coverages',
            slugline: 'inline-coverages',
        })]);
    });

    async function openEvent(page: Page): Promise<void> {
        await waitForPageLoad.planning(page);

        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await editor.waitLoadingComplete();
    }

    test('adds a coverage per ticked content type and keeps them after a save and reload', async ({page}) => {
        await addItems(page.request, 'planning_types', [EVENT_PROFILE_INLINE_COVERAGES]);
        await login(page);
        await openEvent(page);

        await expect(inlineForm.element).toBeVisible();
        await expect(inlineForm.coveragesField.getByTestId('create-button')).not.toBeAttached();

        await inlineForm.enableType('text');
        await inlineForm.enableType('picture');
        await inlineForm.setDesk('text', DESK);
        await inlineForm.add();

        await expect(inlineForm.coverage(0)).toBeVisible();
        await expect(inlineForm.coverage(1)).toBeVisible();
        await expect(inlineForm.coverage(2)).not.toBeAttached();
        await inlineForm.expectNoTypesEnabled();

        // Cancel discards the ticked types and collapses the form, reopening starts clean
        await inlineForm.enableType('video');
        await inlineForm.cancel();
        await expect(inlineForm.element).not.toBeAttached();
        await expect(inlineForm.coverage(2)).not.toBeAttached();

        await inlineForm.open();
        await inlineForm.expectNoTypesEnabled();

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

    test('falls back to the add coverage button when the profile option is off', async ({page}) => {
        await login(page);
        await openEvent(page);

        await expect(inlineForm.coveragesField.getByTestId('create-button')).toBeVisible();
        await expect(inlineForm.openButton).not.toBeAttached();
    });

    test('can be turned on from the event profile editor', async ({page}) => {
        await login(page);
        await waitForPageLoad.planning(page);

        await manageProfiles.show('event');
        await manageProfiles.selectTab(1);
        await manageProfiles.getFieldListItem('coverages').click();
        await manageProfiles.getEditorCheckbox('field.inline_form').type(true);
        await manageProfiles.saveField();
        await manageProfiles.saveAll();

        await openEvent(page);

        await expect(inlineForm.element).toBeVisible();
        await expect(inlineForm.coveragesField.getByTestId('create-button')).not.toBeAttached();
    });

    test('can enable more coverage fields', async ({page}) => {
        await addItems(page.request, 'planning_types', [EVENT_PROFILE_INLINE_COVERAGES]);
        await login(page);
        await waitForPageLoad.planning(page);

        await manageCoverageProfiles.show();
        await manageCoverageProfiles.selectType('Text');
        await manageCoverageProfiles.enableShowInEmbeddedEditor([
            'genre',
            'slugline',
            'news_coverage_status',
            'internal_note',
        ]);

        // Workaround for a bug, cannot modify multiple new Coverage profiles
        await manageCoverageProfiles.saveAll();
        await manageCoverageProfiles.show();

        await manageCoverageProfiles.selectType('Picture');
        await manageCoverageProfiles.enableShowInEmbeddedEditor([
            'slugline',
            'news_coverage_status',
        ]);
        await manageCoverageProfiles.saveAll();

        await openEvent(page);
        await expect(inlineForm.element).toBeVisible();

        await inlineForm.enableType('text');
        await inlineForm.enableType('picture');

        const inlineTextCoverage = new CoverageInlineEditor(page, inlineForm, 'text');
        const inlinePictureCoverage = new CoverageInlineEditor(page, inlineForm, 'picture');

        // Text: Expect the right fields to be visible with the correct value
        await expect(inlineTextCoverage.getParent().getByTestId('field-add_coverage_to_workflow')).not.toBeVisible();
        await expect(inlineTextCoverage.fields.desk.element).toBeVisible();
        await expect(inlineTextCoverage.fields.user.element).toBeVisible();
        await expect(inlineTextCoverage.fields.genre.element).toBeVisible();
        await expect(inlineTextCoverage.fields.slugline.element).toBeVisible();
        await expect(inlineTextCoverage.fields.status.element).toBeVisible();
        await expect(inlineTextCoverage.fields.internal_note.element).toBeVisible();
        await expect(inlineTextCoverage.fields.scheduled_date.element).toBeVisible();
        await expect(inlineTextCoverage.fields.scheduled_time.element).toBeVisible();
        await inlineTextCoverage.fields.slugline.expect('inline-coverages');
        await inlineTextCoverage.fields.scheduled_date.expect('12/11/2026');
        await inlineTextCoverage.fields.scheduled_time.expect('19:00');

        // Picture: Expect the right fields to be visible with the correct value
        await expect(inlinePictureCoverage.getParent().getByTestId('field-add_coverage_to_workflow')).not.toBeVisible();
        await expect(inlinePictureCoverage.fields.desk.element).toBeVisible();
        await expect(inlinePictureCoverage.fields.user.element).toBeVisible();
        await expect(inlinePictureCoverage.fields.genre.element).not.toBeVisible();
        await expect(inlinePictureCoverage.fields.slugline.element).toBeVisible();
        await expect(inlinePictureCoverage.fields.status.element).toBeVisible();
        await expect(inlinePictureCoverage.fields.internal_note.element).not.toBeVisible();
        await expect(inlinePictureCoverage.fields.scheduled_date.element).toBeVisible();
        await expect(inlinePictureCoverage.fields.scheduled_time.element).toBeVisible();
        await inlinePictureCoverage.fields.slugline.expect('inline-coverages');
        await inlinePictureCoverage.fields.scheduled_date.expect('12/11/2026');
        await inlinePictureCoverage.fields.scheduled_time.expect('19:00');
        await inlinePictureCoverage.fields.scheduled_date.type('13/11/2026');
        await inlinePictureCoverage.fields.scheduled_time.type('03:00');

        // Enter some values and add the Coverages to the Event
        await inlineTextCoverage.fields.desk.type('Sports Desk');
        await inlineTextCoverage.fields.slugline.type('text-coverage');
        await inlinePictureCoverage.fields.desk.type('Politic Desk');
        await inlineForm.add();

        const textCoverage = editor.getCoverageEditor(0);
        const pictureCoverage = editor.getCoverageEditor(1);

        // Open up the Event Coverages and inspect the forms
        await textCoverage.expand();
        await pictureCoverage.expand();

        await expect(textCoverage.fields.add_coverage_to_workflow.element).toBeVisible();
        await expect(textCoverage.element).toContainText('Sports Desk');
        await textCoverage.fields.slugline.expect('text-coverage');
        await textCoverage.fields.scheduled.date.expect('12/11/2026');
        await textCoverage.fields.scheduled.time.expect('19:00');

        await expect(pictureCoverage.fields.add_coverage_to_workflow.element).toBeVisible();
        await expect(pictureCoverage.element).toContainText('Politic Desk');
        await pictureCoverage.fields.slugline.expect('inline-coverages');
        await pictureCoverage.fields.scheduled.date.expect('13/11/2026');
        await pictureCoverage.fields.scheduled.time.expect('03:00');
    });
});
