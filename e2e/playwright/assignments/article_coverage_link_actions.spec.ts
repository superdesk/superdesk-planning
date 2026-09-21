import {test, expect} from '@playwright/test';

import {setup, login, addItems} from '../utils/common';
import {createPlanningFor} from '../utils/fixtures/planning';
import {Monitoring, AddToPlanningModal} from '../page-object-models/planning';

test.describe('Planning.Assignment: article coverage link actions', () => {
    const ARTICLE = 'item5 slugline';
    const PLANNING = 'Planning for coverage link';

    let monitoring: Monitoring;
    let addToPlanning: AddToPlanningModal;

    test.beforeEach(async({page}) => {
        monitoring = new Monitoring(page);
        addToPlanning = new AddToPlanningModal(page);

        await setup(page, 'planning_prepopulate_data', '/#/workspace/monitoring');
        await addItems(page.request, 'planning', [createPlanningFor.today({slugline: PLANNING})]);
        await login(page);
        await monitoring.item(ARTICLE).waitFor({state: 'visible'});
    });

    test('offers "Add to Planning" only while the article is not linked to a coverage', async() => {
        await monitoring.openItemActions(ARTICLE);
        await expect(monitoring.action('Add to Planning')).toBeVisible();
        await expect(monitoring.action('Unlink as Coverage')).toHaveCount(0);

        await monitoring.action('Add to Planning').click();
        await addToPlanning.waitTillOpen();
        await addToPlanning.addAsCoverage(PLANNING);

        await monitoring.waitForCoverageLink(ARTICLE);
        await monitoring.openItemActions(ARTICLE);
        await expect(monitoring.action('Unlink as Coverage')).toBeVisible();
        await expect(monitoring.action('Add to Planning')).toHaveCount(0);
    });
});
