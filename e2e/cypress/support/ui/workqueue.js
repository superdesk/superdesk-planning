
class Workqueue {
    get panel() {
        return cy.get('.opened-articles');
    }

    get items() {
        return this.panel.find('.workqueue-item');
    }

    expectItemCount(count) {
        this.items.should('have.length', count);
    }

    getItem(index) {
        return this.items.eq(index);
    }

    expectTitle(index, title) {
        this.getItem(index)
            .find('.item-label')
            .should('contain.text', title);
    }
}

export default new Workqueue();
