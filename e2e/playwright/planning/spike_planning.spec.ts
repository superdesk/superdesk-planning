import {test, expect, Page} from '@playwright/test';
import moment from 'moment/moment';

import {setup, login, addItems, waitForPageLoad, getMenuItem, Modal} from '../utils/common';
import {PlanningList, PlanningEditor} from '../page-object-models/planning';
import {createPlanningFor} from '../utils/fixtures/planning';

const SLUGLINE = 'Planning to spike';
const PLANNING = createPlanningFor.today({slugline: SLUGLINE});

test.describe('Planning.Planning: spike', () => {
    let list: PlanningList;
    let editor: PlanningEditor;
    let modal: Modal;

    test.beforeEach(async ({page}) => {
        list = new PlanningList(page);
        editor = new PlanningEditor(page);
        modal = new Modal(page);

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await addItems(page.request, 'planning', [PLANNING]);
        await login(page);
        await waitForPageLoad.planning(page);
    });

    async function spikeFromList(page: Page): Promise<void> {
        const planningDate = moment(PLANNING.planning_date);

        await (await getMenuItem(page, list.item(0), 'Spike planning')).click();
        await modal.waitTillOpen();
        await modal.shouldContainTitle('Spike Planning Item');
        await expect(modal.element).toContainText(SLUGLINE);
        await expect(modal.element).toContainText(
            `${planningDate.format('DD/MM/YYYY')} @ ${planningDate.format('HH:mm')}`
        );

        await modal.getFooterButton('Spike').click();
        await modal.waitTillClosed();
        await expect(
            page.getByTestId('notification--success').filter({hasText: 'has been spiked'})
        ).toBeVisible();
        await list.expectItemCount(0);
    }

    test('can spike a planning item from the list', async ({page}) => {
        await spikeFromList(page);
    });

    test('can spike a planning item from the list while it is open in the editor', async ({page}) => {
        await list.item(0).dblclick();
        await editor.waitLoadingComplete();

        await spikeFromList(page);
        await editor.waitTillClosed();
    });
});
