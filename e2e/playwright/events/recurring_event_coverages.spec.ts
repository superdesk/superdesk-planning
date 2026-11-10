import {test, expect} from '@playwright/test';
import moment from 'moment';

import {setup, login, waitForPageLoad, SubNavBar, Modal, CLIENT_FORMAT} from '../utils/common';
import {EventEditor, PlanningList} from '../page-object-models/planning';
import {setupPlanningPublishing} from '../utils/fixtures/publish_config';

test.describe('Planning.Events: recurring event coverages', () => {
    let editor: EventEditor;
    let list: PlanningList;
    let subnav: SubNavBar;
    let modal: Modal;

    test.beforeEach(async({page}) => {
        editor = new EventEditor(page);
        list = new PlanningList(page);
        subnav = new SubNavBar(page);
        modal = new Modal(page);

        // Coverage due dates can list an occurrence under more than one day.
        await setup(page, 'planning_prepopulate_data', '/#/planning?filter=EVENTS&groupListBy=not_grouped');
        await setupPlanningPublishing(page.request);
        await login(page);
        await waitForPageLoad.planning(page);
    });

    test('saves and posts all occurrences after adding coverage directly to an event', async({page}) => {
        test.setTimeout(120_000);
        const pageErrors: Array<string> = [];

        page.on('pageerror', (error) => pageErrors.push(error.message));

        await subnav.createEvent();
        await editor.waitTillOpen();
        await editor.openAllToggleBoxes();
        await editor.type({
            name: 'Recurring event with coverages',
            slugline: 'recurring-event-coverages',
            'dates.start.date': moment().add(1, 'day')
                .format(CLIENT_FORMAT),
            'dates.start.time': '10:00',
            'dates.end.date': moment().add(1, 'day')
                .format(CLIENT_FORMAT),
            'dates.end.time': '11:00',
            'dates.recurring.enable': true,
            'dates.recurring.until': moment().add(3, 'day')
                .format(CLIENT_FORMAT),
        });
        await editor.addCoverage('Text');
        await expect(editor.getCoverageEditor(0).element).toBeVisible();
        await editor.createButton.click();
        await expect(editor.createButton).not.toBeAttached();
        await editor.closeButton.click();
        await editor.waitTillClosed();
        await list.expectItemCount(3);

        await list.item(0).dblclick();
        await editor.waitTillOpen();
        await editor.waitLoadingComplete();
        await editor.addCoverage('Picture');
        await expect(editor.getCoverageEditor(1).element).toBeVisible();
        await expect(editor.postButton).toHaveText('Save & Post');
        await editor.postButton.click();
        await modal.waitTillOpen();
        await modal.selectUpdateMethod('all');
        const [saved] = await Promise.all([
            page.waitForResponse((response) => (
                response.request().method() === 'PATCH' && response.url().includes('/api/events/')
            )),
            modal.getFooterButton('Save').click(),
        ]);

        expect(saved.status()).toBe(200);
        await modal.waitTillClosed();
        await expect(editor.unpostButton).toBeVisible();
        await expect(editor.updateButton).toBeDisabled();
        await editor.closeButton.click();
        await editor.waitTillClosed();

        await page.reload();
        await waitForPageLoad.planning(page);
        await list.expectItemCount(3);

        for (let index = 0; index < 3; index++) {
            await list.item(index).dblclick();
            await editor.waitTillOpen();
            await editor.waitLoadingComplete();
            await expect(editor.unpostButton).toBeVisible();
            await editor.getCoverageEditor(0).expand();
            await editor.getCoverageEditor(0).expect({content_type: 'Text'});
            await editor.getCoverageEditor(1).expand();
            await editor.getCoverageEditor(1).expect({content_type: 'Picture'});
            await expect(editor.getCoverageEditor(2).element).not.toBeAttached();
            await editor.closeButton.click();
            await editor.waitTillClosed();
        }

        expect(pageErrors).toEqual([]);
    });
});
