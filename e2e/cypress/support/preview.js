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
        this.actionMenu
            .open()
            .getAction(label)
            .click();
    }

    waitTillOpen() {
        this.element.should('exist');
    }

    waitTillClosed() {
        this.element.should('not.exist');
    }
}

export default new Preview();
