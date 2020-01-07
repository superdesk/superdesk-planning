
class SubNavBar {
    get element() {
        return cy.get('.subnav')
            .first();
    }

    get plusBtn() {
        return this.element.find('.icon-plus-large');
    }

    get menu() {
        return this.element.find('ul.dropdown__menu');
    }

    createEvent() {
        cy.log('UI.SubNavBar.createEvent');
        this.plusBtn.click();
        this.menu.find('#create_event')
            .click();
    }

    createPlanning() {
        cy.log('UI.SubNavBar.createPlanning');
        this.plusBtn.click();
        this.menu.find('#create_planning')
            .click();
    }

    createContact() {
        cy.log('UI.SubNavBar.createContact');
        this.plusBtn.click();
    }
}

export default new SubNavBar();
