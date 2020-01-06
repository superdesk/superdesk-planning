import {
    App,
    UI,
    Editors,
    Preview,
} from '../../support';

describe('event action create planning', () => {
    const editors = {
        event: new Editors.EventEditor(),
        planning: new Editors.PlanningEditor(),
    };
    const modal = new UI.Modal();
    let menu;

    const event = {
        slugline: 'Original',
        name: 'Test',
        definition_short: 'Desc.',
        'dates.start.date': '12/12/2045',
        'dates.start.time': '00:00',
        anpa_category: ['Finance'],
        subject: ['sports awards'],
        ednote: 'Ed. Note',
    };

    const expectedValues = {
        slugline: 'Original',
        name: 'Test',
        'planning_date.date': '12/12/2045',
        'planning_date.time': '00:00',
        description_text: 'Desc.',
        ednote: 'Ed. Note',
        anpa_category: ['Finance'],
        subject: ['sports awards'],
    };

    function expectListItemText() {
        UI.ListPanel.nestedItem(0)
            .find('.sd-list-item')
            .eq(0)
            .should('contain.text', '(1) Show planning item(s)');

        UI.ListPanel.toggleAssociatedPlanning(0);

        UI.ListPanel.nestedItem(0)
            .find('.sd-list-item')
            .eq(0)
            .should('contain.text', '(1) Hide planning item(s)');
    }

    function expectEditorValues() {
        editors.planning.waitTillOpen();
        editors.planning.waitLoadingComplete();
        editors.planning.openAllToggleBoxes();
        editors.planning.expect(expectedValues);
    }

    function doubleClickPlanningItem() {
        UI.ListPanel
            .nestedItem(0)
            .find('.sd-list-item-nested__childs')
            .find('.sd-list-item')
            .eq(0)
            .dblclick();
    }

    function createFromPreview(open) {
        UI.ListPanel
            .item(0)
            .click();

        menu = Preview.actionMenu;
        menu.open();
        menu.getAction(open ?
            'Create and Open Planning Item' :
            'Create Planning Item'
        )
            .click();
    }

    function createFromEditor(open) {
        UI.ListPanel
            .item(0)
            .dblclick();

        editors.event.waitTillOpen();
        editors.event.waitLoadingComplete();

        menu = editors.planning.actionMenu;
        menu.open();
        menu.getAction(open ?
            'Create and Open Planning Item' :
            'Create Planning Item'
        )
            .click();
    }

    beforeEach(() => {
        App.setup({fixture_profile: 'planning_prepopulate_data'});
        App.addItems('events', [{
            slugline: 'Original',
            name: 'Test',
            definition_short: 'Desc.',
            occur_status: {
                name: 'Planned, occurs certainly',
                label: 'Confirmed',
                qcode: 'eocstat:eos5',
            },
            dates: {
                start: '2045-12-11T13:00:00+0000',
                end: '2045-12-11T14:00:00+0000',
                tz: 'Australia/Sydney',
            },
            anpa_category: [{is_active: true, name: 'Finance', qcode: 'f', subject: '04000000'}],
            subject: [{parent: '15000000', name: 'sports awards', qcode: '15103000'}],
            ednote: 'Ed. Note',
        }]);

        cy.visit('/#/planning');
        App.login();

        UI.waitForPageLoad();
    });

    it('can create from the list', () => {
        UI.ListPanel.clickAction(0, 'Create Planning Item');
        expectListItemText();
        doubleClickPlanningItem();
        expectEditorValues();
    });

    it('can create and open from the list', () => {
        UI.ListPanel.clickAction(0, 'Create and Open Planning Item');
        expectEditorValues();
        expectListItemText();
    });

    it('can create from preview', () => {
        createFromPreview(false);
        expectListItemText();
        doubleClickPlanningItem();
        expectEditorValues();
    });

    it('can create and open from preview', () => {
        createFromPreview(true);
        expectEditorValues();
        expectListItemText();
    });

    it('can create from the editor', () => {
        createFromEditor(false);
        editors.planning.closeButton.click();
        editors.planning.waitTillClosed();
        expectListItemText();
        doubleClickPlanningItem();
        expectEditorValues();
    });

    it('can create and open from the editor', () => {
        createFromEditor(true);
        expectListItemText();
        expectEditorValues();
    });
});
