import moment from 'moment-timezone';

import {setup, login, addItems, waitForPageLoad, CLIENT_FORMAT} from '../../support/common';
import {TIMEZONE} from '../../support/utils/time';
import {PlanningList, PlanningPreview, EventEditor, PlanningEditor} from '../../support/planning';

describe('Planning.Events: create planning action', () => {
    const editors = {
        event: new EventEditor(),
        planning: new PlanningEditor(),
    };

    const list = new PlanningList();
    const preview = new PlanningPreview();
    let menu;

    const start = moment();

    const expectedValues = {
        slugline: 'Original',
        'planning_date.date': start.format(CLIENT_FORMAT),
        'planning_date.time': start.format('HH:mm'),
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
                start: start.utc().format("YYYY-MM-DDTHH:mm:ss+0000"),
                end: start.clone().utc().add(1, 'h').format('YYYY-MM-DDTHH:mm:ss+0000'),
                tz: TIMEZONE,
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
            .contains('Show 1 planning item', {timeout: 30000})
            .should('exist');

        list.toggleAssociatedPlanning(0);

        list.nestedItem(0)
            .find('.sd-line-input__input--related-item-link')
            .contains('Hide 1 planning item', {timeout: 30000})
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
