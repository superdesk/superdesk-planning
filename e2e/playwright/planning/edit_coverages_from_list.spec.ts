import {test, expect} from '@playwright/test';

import {setup, addItems, login, waitForPageLoad} from '../utils/common';
import {PlanningList} from '../page-object-models/planning';
import {createPlanningFor} from '../utils/fixtures/planning';

const PLANNING = {
    slugline: 'Edit coverages from planning list',
    coverages: [{
        coverage_id: 'e2e-edit-coverages',
        workflow_status: 'draft',
        news_coverage_status: {qcode: 'ncostat:int'},
        planning: {
            g2_content_type: 'text',
            language: null,
        },
    }],
};

test.describe('Planning: edit coverages from the planning list', () => {
    let list: PlanningList;

    test.beforeEach(async ({page}) => {
        list = new PlanningList(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await addItems(page.request, 'planning', [createPlanningFor.today(PLANNING)]);
        await login(page);
        await waitForPageLoad.planning(page);

        await expect(list.item(0)).toContainText(PLANNING.slugline);
    });

    test('updates a coverage status through Edit Coverages', async ({page}) => {
        await list.clickAction(0, 'Edit Coverages');

        const modal = page.getByRole('dialog', {name: 'Add Coverages (advanced mode)'});
        await expect(modal).toBeVisible();
        const status = modal.getByLabel('Status');

        await expect(status).toHaveValue('ncostat:int');
        await status.selectOption('ncostat:notdec');
        await modal.getByRole('button', {name: 'Save', exact: true}).click();
        await expect(modal).not.toBeVisible();

        await list.clickAction(0, 'Edit Coverages');
        await expect(modal).toBeVisible();
        await expect(modal.getByLabel('Status')).toHaveValue('ncostat:notdec');
    });
});