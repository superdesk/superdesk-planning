import {test, expect, Page} from '@playwright/test';
import moment from 'moment/moment';

import {addItems, baseBackendUrl, login, setup, waitForPageLoad} from '../utils/common';
import {AddToPlanningModal, Monitoring, PlanningList} from '../page-object-models/planning';

interface IDesk {
    _id: string;
    incoming_stage: string;
    name: string;
}

test.describe('Planning.Add to Planning: link existing item', () => {
    let list: PlanningList;
    let addToPlanningModal: AddToPlanningModal;
    let monitoring: Monitoring;

    async function openAddToPlanningModal(page: Page, headline: string): Promise<void> {
        const deskResponse = await page.request.get(`${baseBackendUrl}/desks`);
        const desks: Array<IDesk> = (await deskResponse.json())._items;
        const desk = desks.find((item) => item.name === 'Master Desk') ?? desks[0];
        const articleResponse = await page.request.post(
            `${baseBackendUrl}/archive`,
            {
                data: {
                    guid: `add-to-planning-${Date.now()}`,
                    type: 'text',
                    state: 'draft',
                    slugline: headline,
                    headline: headline,
                    abstract: 'This story is being linked to an existing planning item.',
                    task: {
                        desk: desk._id,
                        stage: desk.incoming_stage,
                    },
                },
            },
        );

        expect(articleResponse.ok()).toBeTruthy();

        await page.goto('/#/workspace/monitoring');
        await monitoring.waitUntilReady();
        await monitoring.selectDesk(desk.name);

        await expect(monitoring.item(headline)).toBeVisible();
        await monitoring.openItemActions(headline);
        await monitoring.action('Add to Planning').click();
        await addToPlanningModal.waitTillOpen();
    }

    test.beforeEach(async ({page}) => {
        list = new PlanningList(page);
        addToPlanningModal = new AddToPlanningModal(page);
        monitoring = new Monitoring(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await addItems(
            page.request,
            'planning',
            [{
                slugline: 'Existing planning item for linking',
                planning_date: moment().format('yy-MM-DD') + 'T12:00:00+0000',
            }],
        );

        await login(page);
        await waitForPageLoad.planning(page);
    });

    test('links a news item to an existing planning item', async ({page}) => {
        const headline = 'News item for add to planning';

        await openAddToPlanningModal(page, headline);
        await addToPlanningModal.addAsCoverage('Existing planning item for linking');
        await monitoring.waitForCoverageLink(headline);

        await page.goto('/#/planning');
        await waitForPageLoad.planning(page);
        await expect(list.item(0)).toContainText('Existing planning item for linking');
    });

    test('links a news item to an existing planning item by double clicking it in the modal', async ({page}) => {
        const headline = 'News item for add to planning by double click';

        await openAddToPlanningModal(page, headline);
        await addToPlanningModal.addAsCoverageByDoubleClick('Existing planning item for linking');
        await monitoring.waitForCoverageLink(headline);

        await page.goto('/#/planning');
        await waitForPageLoad.planning(page);
        await expect(list.item(0)).toContainText('Existing planning item for linking');
    });
});
