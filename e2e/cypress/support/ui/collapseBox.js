
export default class CollapseBox {
    constructor(selector) {
        this.selector = selector;
    }

    get element() {
        return cy.get(this.selector);
    }

    toggle() {
        this.element.click();
    }

    waitTillOpen() {
        this.element.should('have.class', 'sd-collapse-box--open');
    }

    waitTillClose() {
        this.element.should('not.have.class', 'sd-collapse-box--open');
    }
}
