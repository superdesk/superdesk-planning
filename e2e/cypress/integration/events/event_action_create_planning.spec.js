import {setup, login, addItems, waitForPageLoad} from '../../support/common';
import {PlanningList, PlanningPreview, EventEditor, PlanningEditor} from '../../support/planning';

describe('Planning.Events: create planning action', () => {
    const editors = {
        event: new EventEditor(),
        planning: new PlanningEditor(),
    };

    const list = new PlanningList();
    const preview = new PlanningPreview();
    let menu;

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

    beforeEach(() => {
        setup({fixture_profile: 'planning_prepopulate_data'}, '/#/planning');
        addItems('events', [{
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

        login();

        waitForPageLoad();
    });

    function expectListItemText() {
        list.nestedItem(0)
            .find('.sd-list-item')
            .eq(0)
            .should('contain.text', '(1) Show planning item(s)');

        list.toggleAssociatedPlanning(0);

        list.nestedItem(0)
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
        list.nestedItem(0)
            .find('.sd-list-item-nested__childs')
            .find('.sd-list-item')
            .eq(0)
            .dblclick();
    }

    function createFromPreview(open) {
        list.item(0)
            .click();

        menu = preview.actionMenu;
        menu.open();
        menu.getAction(open ?
            'Create and Open Planning Item' :
            'Create Planning Item'
        )
            .click();
    }

    function createFromEditor(open) {
        list.item(0)
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

    it('can create from the list', () => {
        list.clickAction(0, 'Create Planning Item');
        expectListItemText();
        doubleClickPlanningItem();
        expectEditorValues();
    });

    it('can create and open from the list', () => {
        list.clickAction(0, 'Create and Open Planning Item');
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
