import {test} from '@playwright/test';
import moment from 'moment/moment';

import {setup, login, waitForPageLoad, UiFrameworkModal, SubNavBar, CLIENT_FORMAT} from '../utils/common';
import {PlanningList, PlanningPreview, EventEditor} from '../page-object-models/planning';

test.describe('Planning.Events: duplicate event', () => {
    let event: {[key: string]: any};
    let expectedValues: {[key: string]: any};

    let editor: EventEditor;
    let modal: UiFrameworkModal;
    let subnav: SubNavBar;
    let list: PlanningList;
    let preview: PlanningPreview;

    test.beforeEach(async({page}) => {
        editor = new EventEditor(page);
        modal = new UiFrameworkModal(page);
        subnav = new SubNavBar(page);
        list = new PlanningList(page);
        preview = new PlanningPreview(page);
        const now = moment();

        event = {
            slugline: 'Original',
            name: 'Test',
            definition_short: 'Desc.',
            'dates.start.date': now.format(CLIENT_FORMAT),
            'dates.start.time': '00:00',
            'dates.end.time': '01:00',
            occur_status: 'Planned, occurs certainly',
            calendars: ['Sport'],
            anpa_category: ['Finance'],
            subject: ['sports awards'],
            definition_long: 'Desc. Long',
            internal_note: 'Internal',
            ednote: 'Ed. Note',
            links: ['https://www.google.com.au'],
        };

        expectedValues = Object.assign({}, event, {
            'dates.end.date': now.format(CLIENT_FORMAT),
            'dates.end.time': '01:00',
        });

        await setup(page, 'planning_prepopulate_data', '/#/planning');
        await login(page);
        await waitForPageLoad.planning(page);
    });

    test('can duplicate an event', async() => {
        // 1. Duplicate from the list
        await subnav.createEvent();
        await editor.createAndClose(event);

        await list.clickAction(0, 'Duplicate');
        await editor.waitLoadingComplete();
        await editor.openAllToggleBoxes();
        await editor.expect(expectedValues);
        await editor.createAndClose({
            slugline: 'Duplicate',
            'dates.start.time': '01:00',
            'dates.end.time': '02:00',
        }, false);

        // 2. Cancel duplicate ignoring changes
        await list.clickAction(0, 'Duplicate');
        await editor.waitLoadingComplete();
        await editor.openAllToggleBoxes();
        await editor.expect(expectedValues);
        await editor.type({slugline: 'Duplicate2'});
        await editor.waitForAutosave();
        await editor.closeButton.click();
        await modal.waitTillOpen();
        await modal.getFooterButton('Ignore').click();
        await editor.waitTillClosed();

        // 3. Duplicate from preview
        await list.item(0).click();
        await preview.waitTillOpen();
        await preview.clickAction('Duplicate');
        await editor.waitLoadingComplete();
        await editor.openAllToggleBoxes();
        await editor.expect(expectedValues);
        await editor.closeButton.click();
        await modal.getFooterButton('Ignore').click();
        await editor.waitTillClosed();

        // 4. Cancel duplicate saving changes
        await list.clickAction(0, 'Duplicate');
        await editor.waitLoadingComplete();
        await editor.openAllToggleBoxes();
        await editor.expect(expectedValues);
        await editor.type({
            slugline: 'Duplicate3',
            'dates.start.time': '02:00',
            'dates.end.time': '03:00',
        });
        await editor.closeButton.click();
        await modal.waitTillOpen();
        await modal.getFooterButton('Create').click();
        await editor.waitTillClosed();
    });
});
