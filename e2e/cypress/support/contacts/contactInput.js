import Popup from '../ui/popup';
import Input from '../form/input';

export default class ContactInput extends Input{
    constructor(editor, selector) {
        super(editor, selector);

        this.popup = new Popup();
    }

    get container() {
        return this.editor.element.find(this.selector);
    }

    get element() {
        return this.container.find('.sd-line-input__input');
    }

    get list() {
        return this.container.find('.contact-metadata');
    }

    results() {
        this.popup.waitTillOpen();
        return this.popup.element.find('.Select__popup__item');
    }

    result(index) {
        return this.results()
            .eq(index);
    }

    remove(index) {
        this.list
            .eq(index)
            .find('.icon-trash')
            .click({force: true}); // icon is only shown on hover
    }

    search(text) {
        this.element
            .clear()
            .type(text);
    }

    editContact(index) {
        this.list
            .eq(index)
            .find('.icon-pencil')
            .click({force: true}); // icon is only show on hover
    }

    expectResults(contacts) {
        this.results()
            .should('have.length', contacts.length);

        cy.wrap(contacts).each((contact, index) => {
            this.result(index)
                .should('contain.text', contact[0]);
            this.result(index)
                .should('contain.text', contact[1]);
        });
    }

    expect(contacts) {
        cy.wrap(contacts).each(
            (contact, index) => {
                this.list.eq(index).should('contain.text', contact);
            }
        );
    }

    type(contacts) {
        cy.wrap(contacts).each(
            (contact) => {
                this.search(contact);
                this.result(0).click();
            }
        );
    }
}
