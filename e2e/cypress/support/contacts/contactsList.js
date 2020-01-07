
class ContactsList {
    get list() {
        return cy.get('#content-list');
    }

    items() {
        return this.list.find('.sd-grid-item');
    }

    item(index) {
        return this.items()
            .eq(index);
    }

    expectEmpty() {
        cy.log('Contacts.List.expectEmpty');
        this.items()
            .should('not.exist');
    }

    expectItemCount(count) {
        cy.log('Contacts.List.expectItemCount');
        this.items()
            .should('have.length', count);
    }
}

export default new ContactsList();
