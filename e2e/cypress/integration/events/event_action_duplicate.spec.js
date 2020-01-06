import {
    App,
    UI,
    Editors,
    Preview,
} from '../../support';

describe('event duplicate', () => {
    let event;
    let expectedValues;

    const editor = new Editors.EventEditor();
    const modal = new UI.Modal();

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

        App.setup({fixture_profile: 'planning_prepopulate_data'});
        cy.visit('/#/planning');
        App.login();
        UI.waitForPageLoad();
    });

    it('can duplicate an event', () => {
        // 1. Duplicate from the list
        UI.SubNavBar.createEvent();
        editor.createAndClose(event);

        UI.ListPanel.clickAction(0, 'Duplicate');
        editor.waitTillOpen();
        editor.openAllToggleBoxes();
        editor.expect(expectedValues);
        editor.createAndClose({
            slugline: 'Duplicate',
            'dates.start.time': '01:00',
            'dates.end.time': '02:00',
        }, false);

        // 2. Cancel duplicate ignoring changes
        UI.ListPanel.clickAction(0, 'Duplicate');
        editor.waitTillOpen();
        editor.openAllToggleBoxes();
        editor.expect(expectedValues);
        editor.type({slugline: 'Duplicate2'});
        editor.waitForAutosave();
        editor.closeButton.click();
        modal.waitTillOpen(30000);
        modal.getFooterButton('Ignore')
            .click();
        editor.waitTillClosed();

        // 3. Cancel duplicate saving changes
        UI.ListPanel.clickAction(0, 'Duplicate');
        editor.waitTillOpen();
        editor.openAllToggleBoxes();
        editor.expect(expectedValues);
        editor.type({
            slugline: 'Duplicate3',
            'dates.start.time': '02:00',
            'dates.end.time': '03:00',
        });
        editor.waitForAutosave();
        editor.closeButton.click();
        modal.waitTillOpen(30000);
        modal.getFooterButton('Create')
            .click();
        editor.waitTillClosed();

        // 4. Duplicate from preview
        UI.ListPanel.item(0).click();
        Preview.waitTillOpen();
        Preview.clickAction('Duplicate');
        editor.waitTillOpen();
        editor.openAllToggleBoxes();
        editor.expect(expectedValues);
    });
});
