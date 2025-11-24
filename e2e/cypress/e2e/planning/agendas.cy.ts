import {setup, login, waitForPageLoad, SubNavBar, addItems} from '../../support/common';
import {UiFrameworkModal} from '../../support/common/ui/ui-framework-modal';
import {AGENDAS} from '../../fixtures/planning';

describe('Planning: manage agendas', () => {
    const subnav = new SubNavBar();
    const modal = new UiFrameworkModal();

    beforeEach(() => {
        setup({fixture_profile: 'planning_prepopulate_data'}, '/#/planning');

        addItems('agenda', [AGENDAS.sports, AGENDAS.politics]);

        login();
        waitForPageLoad.planning();
    });

    it('can show agendas in manage modal', () => {
        subnav.menuBtn.click();
        subnav.menu
            .contains('Manage agendas')
            .should('exist')
            .click();

        modal.waitTillOpen(30000);
        modal.element
            .find('[data-test-id=list-page--items]')
            .find('.sd-list-item')
            .should('have.length', 2);

        modal.element
            .find('.sd-list-item__border--active')
            .should('have.length', 2);

        modal.getFooterButton('Close')
            .click();
        modal.waitTillClosed(30000);
    });

    it('can edit an agenda', () => {
        subnav.menuBtn.click();
        subnav.menu
            .contains('Manage agendas')
            .should('exist')
            .click();

        modal.waitTillOpen(30000);

        modal.element
            .find('[data-test-id=list-page--items]')
            .find('.sd-list-item')
            .first()
            .find('.icon-pencil')
            .click({force: true});

        modal.element
            .find('[data-test-id=gform-input--name]')
            .should('be.visible')
            .should('have.value', 'Sports');

        modal.element
            .find('[data-test-id=gform-input--name]')
            .clear()
            .type('New Sports Name');

        modal.element
            .find('[data-test-id="list-page--view-edit"]')
            .find('[data-test-id="item-view-edit--save"]')
            .should('not.be.disabled')
            .click();

        cy.wait(1000);

        modal.element
            .find('[data-test-id=list-page--items]')
            .find('.sd-list-item')
            .first()
            .should('contain.text', 'New Sports Name');

        modal.getFooterButton('Close')
            .click();
    });

    it.only('validates required fields when editing agenda', () => {
        subnav.menuBtn.click();
        subnav.menu
            .contains('Manage agendas')
            .should('exist')
            .click();

        modal.waitTillOpen(30000);

        modal.element
            .find('[data-test-id=list-page--items]')
            .find('.sd-list-item')
            .first()
            .find('.icon-pencil')
            .click({force: true});

        modal.element
            .find('[data-test-id=gform-input--name]')
            .clear();

        // Field is required
        modal.element
            .find('[data-test-id="list-page--view-edit"]')
            .find('[data-test-id="item-view-edit--save"]')
            .click();

        modal.element
            .find('[data-test-id="list-page--view-edit"]')
            .find('.sd-line-input--invalid')
            .find('.sd-line-input__message')
            .should('be.visible')
            .should('contain.text', 'Field is required');

        modal.element
            .find('[data-test-id=gform-input--name]')
            .type('Valid Name');

        modal.element
            .find('[data-test-id="list-page--view-edit"]')
            .find('[data-test-id="item-view-edit--save"]')
            .should('not.be.disabled');

        modal.element
            .find('button')
            .contains('Cancel')
            .click();

        cy.get('[data-test-id="modal-confirm"]')
            .find('button')
            .contains('Cancel')
            .click();

        cy.get('[data-test-id="modal-confirm"]')
            .should('not.exist');

        modal.getFooterButton('Close')
            .click();
    });

    it('can create a new agenda', () => {
        subnav.menuBtn.click();
        subnav.menu
            .contains('Manage agendas')
            .should('exist')
            .click();

        modal.waitTillOpen(30000);

        modal.element
            .find('[data-test-id=list-page--items]')
            .find('.sd-list-item')
            .should('have.length', 2);

        modal.element
            .find('[data-test-id="list-page--add-item"]')
            .click();

        modal.element
            .find('[data-test-id=gform-input--name]')
            .type('New Test Agenda');

        modal.element
            .contains('label', 'Enabled')
            .parent()
            .find('.sd-checkbox')
            .click();

        modal.element
            .find('[data-test-id="list-page--view-edit"]')
            .find('[data-test-id="item-view-edit--save"]')
            .click();

        cy.wait(1000);

        modal.element
            .find('[data-test-id=list-page--items]')
            .find('.sd-list-item')
            .should('have.length', 3)
            .last()
            .should('contain.text', 'New Test Agenda');

        modal.getFooterButton('Close')
            .click();
    });
});
