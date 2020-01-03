

export default class Popup {
    constructor(selector = '.popup') {
        this.selector = selector;
    }

    get element() {
        return cy.get(this.selector);
    }

    wait(timeout = 4000) {
        cy.get(this.selector, {timeout: timeout})
            .should('exist');
    }

    waitForClose(timeout = 4000) {
        cy.get(this.selector, {timeout: timeout})
            .should('not.exist');
    }
}
