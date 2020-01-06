

export default class Popup {
    constructor(selector = '.popup') {
        this.selector = selector;
    }

    get element() {
        return cy.get(this.selector);
    }

    waitTillOpen(timeout = 4000) {
        cy.log('UI.Popup.waitTillOpen');
        cy.get(this.selector, {timeout: timeout})
            .should('exist');
    }

    waitTillClosed(timeout = 4000) {
        cy.log('UI.Popup.waitTillClosed');
        cy.get(this.selector, {timeout: timeout})
            .should('not.exist');
    }
}
