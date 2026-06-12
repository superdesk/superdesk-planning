import {test, expect} from '@playwright/test';

import {setup, login, waitForPageLoad, SubNavBar, changeWorkspace, Modal} from '../utils/common';
import {PlanningList, PlanningEditor, AssignmentEditor, AssignmentPreview} from '../page-object-models/planning';
import {getMenuItem} from '../utils/common';

test.describe('Planning.Assignment: reassign assignment', () => {
    let editor: PlanningEditor;
    let subnav: SubNavBar;
    let list: PlanningList;
    let modal: Modal;
    let preview: AssignmentPreview;

    test.beforeEach(async ({page}) => {
        editor = new PlanningEditor(page);
        subnav = new SubNavBar(page);
        list = new PlanningList(page);
        modal = new Modal(page);
        preview = new AssignmentPreview(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');

        await login(page);

        await waitForPageLoad.planning(page);
        await subnav.createPlanning();
        await editor.waitTillOpen();
    });

    test('can reassign Assignment', async ({page}) => {
        await editor.type({slugline: 'Slugline'});
        await editor.addCoverage('Text');

        const coverageEditor = editor.getCoverageEditor(0);
        const assignmentEditor = new AssignmentEditor(page);

        await coverageEditor.editAssignmentButton.click();
        await assignmentEditor.waitTillOpen();
        await assignmentEditor.type({
            desk: 'Politic Desk',
        });
        await assignmentEditor.okButton.click();
        await assignmentEditor.waitTillClosed();

        await editor.waitForAutosave();
        await editor.createButton.click();
        await editor.waitLoadingComplete();

        await coverageEditor.element.click();
        await expect(
            coverageEditor.element.locator('.sd-collapse-box__content-block--top')
        ).toContainText('Politic Desk');
        await expect(
            coverageEditor.element
                .locator('.sd-collapse-box__content-block--top')
                .locator('.label')
        ).toContainText('Draft');
        await coverageEditor.toggleAddToWorkflow();

        await editor.saveButton.click();

        await editor.waitForAutosave();
        await expect(
            coverageEditor.element
                .locator('.sd-collapse-box__content-block--top')
                .locator('.label')
        ).toContainText('Assigned');
        await changeWorkspace(page, 'Assignments');

        await list.expectItemCount(1);
        await list.expectItemText(0, 'Slugline');

        await list.item(0).click();
        await (await getMenuItem(page, list.item(0), 'Reassign')).click();

        await modal.waitTillOpen();
        await assignmentEditor.type({
            user: 'first name last name',
        });
        await modal.element.locator('.btn--primary').click();
        await modal.waitTillClosed();

        await expect(preview.topTools).toContainText('first name last name');
    });
});
