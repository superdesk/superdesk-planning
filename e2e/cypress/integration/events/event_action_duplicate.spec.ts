import {setup, login, waitForPageLoad, Modal, SubNavBar} from '../../support/common';
import {PlanningList, PlanningPreview, EventEditor} from '../../support/planning';

describe('Planning.Events: duplicate event', () => {
    let event;
    let expectedValues;

    const editor = new EventEditor();
    const modal = new Modal();
    const subnav = new SubNavBar();
    const list = new PlanningList();
    const preview = new PlanningPreview();

    beforeEach(() => {
        event = {
            slugline: 'Original',
            name: 'Test',
            definition_short: 'Desc.',
            'dates.start.date': '12/12/2045',
            'dates.start.time': '00:00',
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
            'dates.end.date': '12/12/2045',
            'dates.end.time': '01:00',
        });

        setup({fixture_profile: 'planning_prepopulate_data'}, '/#/planning');
        login();
        waitForPageLoad.planning();
    });

    it('can duplicate an event', () => {
        // 1. Duplicate from the list
        subnav.createEvent();
        editor.createAndClose(event);

        list.clickAction(0, 'Duplicate');
        editor.waitTillOpen();
        editor.openAllToggleBoxes();
        editor.expect(expectedValues);
        editor.createAndClose({
            slugline: 'Duplicate',
            'dates.start.time': '01:00',
            'dates.end.time': '02:00',
        }, false);

        // 2. Cancel duplicate ignoring changes
        list.clickAction(0, 'Duplicate');
        editor.waitTillOpen();
        editor.openAllToggleBoxes();
        editor.expect(expectedValues);
        editor.type({slugline: 'Duplicate2'});
        editor.waitForAutosave();
        editor.closeButton
            .should('exist')
            .click();
        modal.waitTillOpen(30000);
        modal.getFooterButton('Ignore')
            .click();
        editor.waitTillClosed();

        // 3. Cancel duplicate saving changes
        list.clickAction(0, 'Duplicate');
        editor.waitTillOpen();
        editor.openAllToggleBoxes();
        editor.expect(expectedValues);
        editor.type({
            slugline: 'Duplicate3',
            'dates.start.time': '02:00',
            'dates.end.time': '03:00',
        });
        editor.waitForAutosave();
        editor.closeButton
            .should('exist')
            .click();
        modal.waitTillOpen(30000);
        modal.getFooterButton('Create')
            .click();
        editor.waitTillClosed();

        // 4. Duplicate from preview
        list.item(0).click();
        preview.waitTillOpen();
        preview.clickAction('Duplicate');
        editor.waitTillOpen();
        editor.openAllToggleBoxes();
        editor.expect(expectedValues);
    });
});
