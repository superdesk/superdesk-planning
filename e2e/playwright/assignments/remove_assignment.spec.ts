import {test, expect} from '@playwright/test';

import {setup, login, waitForPageLoad, SubNavBar, changeWorkspace, UiFrameworkModal} from '../utils/common';
import {PlanningList, PlanningEditor, AssignmentEditor} from '../page-object-models/planning';
import {getMenuItem} from '../utils/common';

test.describe('Planning.Assignment: remove assignment', () => {
    let editor: PlanningEditor;
    let subnav: SubNavBar;
    let list: PlanningList;
    let modal: UiFrameworkModal;

    test.beforeEach(async({page}) => {
        editor = new PlanningEditor(page);
        subnav = new SubNavBar(page);
        list = new PlanningList(page);
        modal = new UiFrameworkModal(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');

        await login(page);

        await waitForPageLoad.planning(page);
        await subnav.createPlanning();
        await editor.waitTillOpen();
    });

    test('can remove Assignment', async({page}) => {
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
        await (await getMenuItem(page, list.item(0), 'Remove Assignment')).click();

        await modal.waitTillOpen();
        await modal.element.locator('.btn--primary').click();
        await modal.waitTillClosed();
        await list.expectItemCount(0);

        await changeWorkspace(page, 'Planning');
        await waitForPageLoad.planning(page);
        await editor.waitTillOpen();
        await coverageEditor.waitTillVisible();
        await expect(coverageEditor.element).toContainText('Unassigned');
        await expect(
            coverageEditor.element.locator('.label')
        ).toContainText('draft');
    });
});
