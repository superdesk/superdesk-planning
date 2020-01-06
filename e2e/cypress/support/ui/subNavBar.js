
class SubNavBar {
    createEvent() {
        cy.log('UI.SubNavBar.createEvent');
        cy.get('.icon-plus-large')
            .click();
        cy.get('#create_event')
            .click();
    }

    createPlanning() {
        cy.log('UI.SubNavBar.createPlanning');
        cy.get('.icon-plus-large')
            .click();
        cy.get('#create_planning')
            .click();
    }
}

export default new SubNavBar();
