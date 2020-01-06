import ActionMenu from './ui/actionMenu';

class Preview {
    get element() {
        return cy.get('.sd-preview-panel');
    }

    get closeButton() {
        return this.element.find('.icon-close-small');
    }

    get actionMenu() {
        return new ActionMenu(() => this.element);
    }

    clickAction(label) {
        cy.log('Preview.clickAction');
        this.actionMenu
            .open()
            .getAction(label)
            .click();
    }

    waitTillOpen() {
        cy.log('Preview.waitTillOpen');
        this.element.should('exist');
    }

    waitTillClosed() {
        cy.log('Preview.waitTillClosed');
        this.element.should('not.exist');
    }
}

export default new Preview();
