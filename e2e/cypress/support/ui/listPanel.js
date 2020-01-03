import ActionMenu from './actionMenu';

class ListPanel {
    get panel() {
        return cy.get('.sd-column-box__main-column__listpanel');
    }

    items(timeout = 40000) {
        return this.panel.find('.sd-list-item', {timeout: timeout});
    }

    item(index) {
        return this.items()
            .eq(index);
    }

    getActionMenu(index) {
        return new ActionMenu(
            () => this.item(index)
        );
    }

    clickAction(index, label) {
        this.item(index).click();
        this.getActionMenu(index)
            .open()
            .getAction(label)
            .click();
    }

    expectEmpty() {
        this.items(0)
            .should('not.exist');
    }

    expectItemCount(count) {
        // Use a greater timeout here to give the server and client time to finish the request
        this.items()
            .should('have.length', count);
    }

    expectItemText(index, text) {
        this.items()
            .eq(index)
            .should('contain.text', text);
    }
}

export default new ListPanel();
