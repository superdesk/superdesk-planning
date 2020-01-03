
class SubNavBar {
    createEvent() {
        cy.get('.icon-plus-large')
            .click();
        cy.get('#create_event')
            .click();
        // editor.waitTillOpen();
    }

    createPlanning() {
        cy.get('.icon-plus-large')
            .click();
        cy.get('#create_planning')
            .click();
        // editor.waitTillOpen();
    }
}

export default new SubNavBar();
