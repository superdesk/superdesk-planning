import {setup, login, waitForPageLoad, SubNavBar, Workqueue} from '../../support/common';
import {PlanningList, PlanningEditor} from '../../support/planning';

describe('Planning.Planning: list view accessibility', () => {
    const editor = new PlanningEditor();
    const subnav = new SubNavBar();
    const list = new PlanningList();

    function createPlanningItem(date, time, slugline) {
        subnav.createPlanning();
        editor.waitTillOpen();

        const plan = {
            slugline: slugline,
            'planning_date.date': date,
            'planning_date.time': time,
            description_text: 'desc 1',
        };

        editor.type(plan);
        editor.waitForAutosave();

        editor.createButton
            .should('exist')
            .click();

        editor.waitLoadingComplete();

        editor.closeButton.should('exist').click();

        editor.waitTillClosed();
    }

    beforeEach(() => {
        setup({fixture_profile: 'planning_prepopulate_data'}, '/#/planning');

        login();

        waitForPageLoad.planning();

        createPlanningItem('12/12/2045', '12:13', 'group 1, item 1');
        createPlanningItem('12/12/2045', '12:14', 'group 1, item 2');
        createPlanningItem('12/12/2045', '12:15', 'group 1, item 3');

        createPlanningItem('13/12/2045', '12:16', 'group 2, item 1');
        createPlanningItem('13/12/2045', '12:17', 'group 2, item 2');
        createPlanningItem('13/12/2045', '12:18', 'group 2, item 3');

        list.expectItemCount(6);
    });

    it('can navigate a list using arrow up/down keys', () => {
        cy.get('.sd-list-item-group')
            .first()
            .as('group');

        cy.get('@group').focus();

        cy.realPress('{downarrow}');
        cy.get('@group').should('have.attr', 'aria-activedescendant', 'list-panel-0--0');

        cy.realPress('{downarrow}');
        cy.get('@group').should('have.attr', 'aria-activedescendant', 'list-panel-0--1');

        cy.realPress('{downarrow}');
        cy.get('@group').should('have.attr', 'aria-activedescendant', 'list-panel-0--2');

        cy.realPress('{uparrow}');
        cy.get('@group').should('have.attr', 'aria-activedescendant', 'list-panel-0--1');

        cy.realPress('{uparrow}');
        cy.get('@group').should('have.attr', 'aria-activedescendant', 'list-panel-0--0');
    });

    it('can open an item for editing using a keyboard', () => {
        cy.get('.sd-list-item-group')
            .first()
            .as('group');

        cy.get('@group').focus();

        cy.realPress('{downarrow}'); // group 1, item 1
        cy.realPress('{downarrow}'); // group 1, item 2

        cy.realPress('{enter}'); // opens actions menu

        // select edit option (due to cypress issues it doesn't work to trigger it via keyboard)
        cy.focused().realClick();

        cy.get('[data-test-id="planning-editor"] [data-test-id="field-slugline"] input')
            .should('have.value', 'group 1, item 2');
    });

    it('maintains focus after quiting item actions menu', () => {
        cy.get('.sd-list-item-group')
            .first()
            .as('group');

        cy.get('@group').focus();

        cy.realPress('{downarrow}'); // group 1, item 1
        cy.realPress('{downarrow}'); // group 1, item 2

        cy.realPress('{enter}'); // opens actions menu
        cy.realPress('{esc}'); // closes actions menu

        cy.realPress('{downarrow}'); // group 1, item 3
        cy.get('@group').should('have.attr', 'aria-activedescendant', 'list-panel-0--2');
    });

    it('can switch groups using tab key when an item is selected', () => {
        cy.get('.sd-list-item-group')
            .eq(0)
            .as('group1');

        cy.get('.sd-list-item-group')
            .eq(1)
            .as('group2');

        cy.get('@group1').should('not.have.focus');
        cy.get('@group2').should('not.have.focus');

        cy.get('@group1').focus();

        cy.realPress('{downarrow}'); // group 1, item 1
        cy.realPress('{downarrow}'); // group 1, item 2

        cy.get('@group1').should('have.focus');
        cy.get('@group2').should('not.have.focus');

        cy.realPress('Tab'); // focus on menu
        cy.realPress('Tab'); // focus on next group

        cy.get('@group1').should('not.have.focus');
        cy.get('@group2').should('have.focus');

        cy.realPress('{downarrow}'); // group 2, item 1
        cy.realPress('{downarrow}'); // group 2, item 2

        cy.get('@group1').should('not.have.focus');
        cy.get('@group2').should('have.focus');

        cy.realPress(['Shift', 'Tab']); // focus on previous group
        cy.get('@group1').should('have.focus');
        cy.get('@group2').should('not.have.focus');

        cy.realPress('{downarrow}'); // group 1, item 1
        cy.realPress('{downarrow}'); // group 1, item 2

        cy.get('@group1').should('have.focus');
        cy.get('@group2').should('not.have.focus');
    });

    it('limits navigation with arrow up/down keys to selected group', () => {
        cy.get('.sd-list-item-group')
            .eq(0)
            .as('group1');

        cy.get('.sd-list-item-group')
            .eq(1)
            .as('group2');

        cy.get('@group1').should('not.have.focus');
        cy.get('@group2').should('not.have.focus');

        cy.get('@group1').focus();

        cy.realPress('{downarrow}'); // group 1, item 1

        cy.get('@group1').should('have.focus');
        cy.get('@group2').should('not.have.focus');

        cy.realPress('{downarrow}'); // group 1, item 2
        cy.realPress('{downarrow}'); // group 1, item 3
        cy.realPress('{downarrow}'); // group 1, item 3
        cy.realPress('{downarrow}'); // does nothing when triggred on last item
        cy.realPress('{downarrow}'); // does nothing when triggred on last item

        cy.get('@group1').should('have.focus');
        cy.get('@group2').should('not.have.focus');


        cy.realPress('Tab'); // focus on menu
        cy.realPress('Tab'); // focus on next group

        cy.get('@group1').should('not.have.focus');
        cy.get('@group2').should('have.focus');

        cy.realPress('{downarrow}'); // group 2, item 1
        cy.realPress('{downarrow}'); // group 2, item 2
        cy.realPress('{uparrow}'); // group 2, item 1
        cy.realPress('{uparrow}'); // does nothing when triggred on first item
        cy.realPress('{uparrow}'); // does nothing when triggred on first item

        cy.get('@group1').should('not.have.focus');
        cy.get('@group2').should('have.focus');
    });
});
