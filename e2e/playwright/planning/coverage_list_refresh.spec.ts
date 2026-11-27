import {test, expect, Page} from '@playwright/test';

import {setup, login, waitForPageLoad, addItems, changeWorkspace} from '../utils/common';
import {
    AdvancedSearch,
    AssignmentEditor,
    PlanningEditor,
    PlanningList,
} from '../page-object-models/planning';
import {createPlanningFor} from '../utils/fixtures/planning';

const ADD_SLUGLINE = 'COVERAGE-REFRESH-ADD';
const ASSIGN_SLUGLINE = 'COVERAGE-REFRESH-ASSIGN';

const PLANNING_WITH_COVERAGE = {
    slugline: ASSIGN_SLUGLINE,
    coverages: [{
        coverage_id: 'e2e-coverage-list-refresh',
        workflow_status: 'draft',
        news_coverage_status: {qcode: 'ncostat:int', name: 'coverage intended', label: 'Planned'},
        planning: {
            g2_content_type: 'text',
            language: 'en',
        },
    }],
};

// The icon colour is set as `color: var(--...)`; resolve the variable to the
// computed rgb() the browser reports, so assertions compare like with like
async function resolveColor(page: Page, cssValue: string): Promise<string> {
    return page.evaluate((value) => {
        const probe = document.createElement('div');

        probe.style.color = value;
        document.body.appendChild(probe);
        const resolved = getComputedStyle(probe).color;

        probe.remove();
        return resolved;
    }, cssValue);
}

test.describe('Planning: coverage changes refresh open list views', () => {
    let list: PlanningList;
    let search: AdvancedSearch;
    let editor: PlanningEditor;

    test.beforeEach(async({page}) => {
        list = new PlanningList(page);
        search = new AdvancedSearch(page);
        editor = new PlanningEditor(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        // The phone-home prompt reappears after every reset and its backdrop
        // swallows clicks at an arbitrary moment; seed it answered
        await addItems(page.request, 'config', [{_id: 'phone_home', val: {done: 1}}]);
        await addItems(page.request, 'planning', [
            createPlanningFor.today({slugline: ADD_SLUGLINE}),
            createPlanningFor.today(PLANNING_WITH_COVERAGE),
        ]);

        await login(page);
        await waitForPageLoad.planning(page);
        await search.viewPlanningOnly();
        await list.expectItemCount(2);
    });

    test('a coverage added in the editor appears on the list row without a reload', async() => {
        const row = list.itemByText(ADD_SLUGLINE);

        // The coverage-icons container renders even with no coverages; the
        // icons inside are what track the coverage list
        await expect(row.getByTestId('coverage-icons').locator('i')).toHaveCount(0);

        await row.dblclick();
        await editor.waitTillOpen();
        await editor.waitLoadingComplete();

        await editor.addCoverage('Text');
        await editor.waitForAutosave();
        await editor.saveButton.click();
        await editor.waitLoadingComplete();

        await expect(row.getByTestId('coverage-icons').locator('i[aria-label="text"]')).toBeVisible();
    });

    test('assigning a coverage recolours the list row and the open Assignments view', async({page, context}) => {
        const row = list.itemByText(ASSIGN_SLUGLINE);
        const coverageIcon = row.getByTestId('coverage-icons').locator('i');
        const assignedBlue = await resolveColor(page, 'var(--sd-colour-state--in-workflow)');

        await expect(coverageIcon).toBeVisible();
        expect(await coverageIcon.evaluate((el) => getComputedStyle(el).color)).not.toBe(assignedBlue);

        // Second tab watching the Assignments view: the assignment created in
        // the first tab must appear here live, with no reload
        const assignmentsPage = await context.newPage();
        const assignmentsList = new PlanningList(assignmentsPage);

        await assignmentsPage.goto('/');
        await changeWorkspace(assignmentsPage, 'Assignments');
        await assignmentsPage.getByTestId('assignment-group__list')
            .first()
            .waitFor({state: 'visible'});
        await expect(assignmentsList.itemByText(ASSIGN_SLUGLINE)).toHaveCount(0);

        await row.dblclick();
        await editor.waitTillOpen();
        await editor.waitLoadingComplete();

        const coverageEditor = editor.getCoverageEditor(0);
        const assignmentEditor = new AssignmentEditor(page);

        // A seeded coverage opens collapsed; the assignment controls only
        // render once the card is expanded
        await coverageEditor.ensureExpanded();
        await coverageEditor.editAssignmentButton.click();
        await assignmentEditor.waitTillOpen();
        await assignmentEditor.type({desk: 'Politic Desk'});
        await assignmentEditor.okButton.click();
        await assignmentEditor.waitTillClosed();

        await coverageEditor.toggleAddToWorkflow();
        await editor.waitForAutosave();
        await editor.saveButton.click();
        await editor.waitLoadingComplete();

        await expect(coverageIcon).toHaveCSS('color', assignedBlue);

        // The coverage card records which desk the assignment went to
        await expect(
            coverageEditor.element.locator('.sd-collapse-box__content-block--top')
        ).toContainText('Politic Desk');

        const assignmentRow = assignmentsList.itemByText(ASSIGN_SLUGLINE);

        await expect(assignmentRow).toBeVisible();
        await expect(assignmentRow).toContainText('Politic Desk');
    });
});
