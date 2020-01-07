import ActionMenu from './actionMenu';

class ListPanel {
    get panel() {
        return cy.get('.sd-column-box__main-column__listpanel');
    }

    items(timeout = 40000) {
        return this.panel.find('.sd-list-item', {timeout: timeout});
    }

    item(index, timeout = 40000) {
        return this.items(timeout)
            .eq(index);
    }

    nestedItems(timeout = 40000) {
        return this.panel.find('.sd-list-item-nested', {timeout: timeout});
    }

    nestedItem(index, timeout = 40000) {
        return this.nestedItems(timeout)
            .eq(index);
    }

    getActionMenu(index) {
        return new ActionMenu(
            () => this.item(index)
        );
    }

    clickAction(index, label) {
        cy.log('UI.ListPanel.clickAction');
        this.item(index).click();
        this.getActionMenu(index)
            .open()
            .getAction(label)
            .click();
    }

    expectEmpty() {
        cy.log('UI.ListPanel.expectEmpty');
        this.items()
            .should('not.exist');
    }

    expectItemCount(count) {
        cy.log('UI.ListPanel.expectItemCount');
        // Use a greater timeout here to give the server and client time to finish the request
        this.items()
            .should('have.length', count);
    }

    expectItemText(index, text, options = {}) {
        cy.log('UI.ListPanel.expectItemText');
        this.item(0, options)
            .should('contain.text', text);
    }

    toggleAssociatedPlanning(index) {
        cy.log('UI.ListPanel.toggleAssociatedPlanning');
        this.nestedItem(index)
            .find('.icon-calendar')
            .click();
    }
}

export default new ListPanel();
