import {test, expect} from '@playwright/test';

import {setup, login, waitForPageLoad, addItems} from '../utils/common';
import {AdvancedSearch, PlanningList, PlanningPreview} from '../utils/planning';
import {createPlanningFor} from '../utils/fixtures/planning';

const PLANNING = {
    slugline: 'Coverage card labels',
    coverages: [{
        coverage_id: 'e2e-coverage-card',
        workflow_status: 'draft',
        news_coverage_status: {qcode: 'ncostat:int', name: 'coverage intended', label: 'Planned'},
        planning: {
            g2_content_type: 'text',
        },
    }],
};

test.describe('Planning: coverage card status labels', () => {
    let list: PlanningList;
    let preview: PlanningPreview;
    let search: AdvancedSearch;

    test.beforeEach(async ({page}) => {
        list = new PlanningList(page);
        preview = new PlanningPreview(page);
        search = new AdvancedSearch(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await addItems(page.request, 'planning', [createPlanningFor.today(PLANNING)]);

        await login(page);
        await waitForPageLoad.planning(page);

        // The multi-select checkbox is only rendered outside the combined view
        await search.viewPlanningOnly();
        await list.expectItemCount(1);
    });

    const openPreview = async () => {
        await list.item(0).click();
        await preview.waitTillOpen();
        await expect(preview.coverageCards).toHaveCount(1);
    };

    test('a coverage that is not in workflow shows its status', async () => {
        await openPreview();

        await expect(preview.coverageCard(0)).toContainText('draft');
        await expect(preview.coverageCard(0)).not.toContainText('Added to workflow');
    });

    test('a coverage added to workflow shows "Added to workflow" instead of its status', async () => {
        await list.addSelectedToWorkflow(0);
        await openPreview();

        await expect(preview.coverageCard(0)).toContainText('Added to workflow');
        await expect(preview.coverageCard(0)).not.toContainText('active');
    });

    test('a coverage added automatically shows its status instead of "Added to workflow"', async ({page}) => {
        await list.addSelectedToWorkflow(0);

        await page.addInitScript(() => {
            window.localStorage.setItem(
                'TEST_APP_CONFIG',
                JSON.stringify({planning_auto_assign_to_workflow: true}),
            );
        });
        await page.reload();
        await waitForPageLoad.planning(page);

        await openPreview();

        await expect(preview.coverageCard(0)).toContainText('active');
        await expect(preview.coverageCard(0)).not.toContainText('Added to workflow');
    });
});
