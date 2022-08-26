import {setup, login, addItems, waitForPageLoad} from '../../support/common';
import {TIME_STRINGS} from '../../support/utils/time';
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
        'planning_date.date': '12/12/2045',
        'planning_date.time': '01:00',
        description_text: 'Desc.',
        ednote: 'Ed. Note',
        anpa_category: ['Finance'],
        subject: ['sports awards'],
    };

    beforeEach(() => {
        setup({fixture_profile: 'planning_prepopulate_data'}, '/#/planning');
        addItems('events', [{
            slugline: 'Original',
            definition_short: 'Desc.',
            occur_status: {
                name: 'Planned, occurs certainly',
                label: 'Confirmed',
                qcode: 'eocstat:eos5',
            },
            dates: {
                start: '2045-12-11' + TIME_STRINGS[0],
                end: '2045-12-11' + TIME_STRINGS[1],
                tz: 'Australia/Sydney',
            },
            anpa_category: [{is_active: true, name: 'Finance', qcode: 'f', subject: '04000000'}],
            subject: [{parent: '15000000', name: 'sports awards', qcode: '15103000'}],
            ednote: 'Ed. Note',
        }]);

        login();

        waitForPageLoad.planning();
    });

    function expectListItemText() {
        list.nestedItem(0)
            .find('.sd-line-input__input--related-item-link')
            .contains('(1) Show planning item(s)', {timeout: 30000})
            .should('exist');

        list.toggleAssociatedPlanning(0);

        list.nestedItem(0)
            .find('.sd-line-input__input--related-item-link')
            .contains('(1) Hide planning item(s)', {timeout: 30000})
            .should('exist');
    }

    function expectEditorValues() {
        editors.planning.waitTillOpen();
        editors.planning.waitLoadingComplete();
        editors.planning.openAllToggleBoxes();
        editors.planning.expect(expectedValues);
    }

    function canEditPlanningAfterwards() {
        // Test that we can edit the Planning item
        editors.planning.type({
            internal_note: 'Created from Event',
        });

        // Test that we can save the Planning item
        editors.planning.waitForAutosave();
        editors.planning.saveButton
            .should('exist')
            .should('be.enabled')
            .click();

        // Wait for save to be completed
        editors.planning.closeButton
            .should('exist')
            .should('be.enabled');
        editors.planning.waitForAutosave();

        editors.planning.closeButton
            .should('exist')
            .should('be.enabled')
            .click();
        editors.planning.waitTillClosed();
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
        canEditPlanningAfterwards();
    });

    it('can create and open from the list', () => {
        list.clickAction(0, 'Create and Open Planning Item');
        expectEditorValues();
        expectListItemText();
        canEditPlanningAfterwards();
    });

    it('can create from preview', () => {
        createFromPreview(false);
        expectListItemText();
        doubleClickPlanningItem();
        expectEditorValues();
        canEditPlanningAfterwards();
    });

    it('can create and open from preview', () => {
        createFromPreview(true);
        expectEditorValues();
        expectListItemText();
        canEditPlanningAfterwards();
    });

    it('can create from the editor', () => {
        createFromEditor(false);
        editors.planning.closeButton
            .should('exist')
            .click();
        editors.planning.waitTillClosed();
        expectListItemText();
        doubleClickPlanningItem();
        expectEditorValues();
        canEditPlanningAfterwards();
    });

    it('can create and open from the editor', () => {
        createFromEditor(true);
        expectListItemText();
        expectEditorValues();
        canEditPlanningAfterwards();
    });
});
