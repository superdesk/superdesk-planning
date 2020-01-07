import Input from '../form/input';

export default class EmailInput extends Input {
    get element() {
        return this.editor.element
            .find('.form__row')
            .contains(this.selector)
            .parent();
    }

    get addButton() {
        return this.element
            .find('button');
    }

    getSelector(index) {
        return `input[name="contact_email[${index}]"]`;
    }

    expect(values, startingIndex = 0) {
        cy.wrap(values).each((value, index) => {
            this.element
                .find(this.getSelector(startingIndex + index))
                .should('have.value', value);
        });
    }

    type(values, startingIndex = 0) {
        cy.wrap(values).each((value, index) => {
            // this.addButton.click({force: true});
            this.addButton.click();
            const input = new Input(
                this.editor,
                this.getSelector(startingIndex + index)
            );

            input.type(value);
        });
    }

    replace(index, value) {
        const input = new Input(
            this.editor,
            this.getSelector(index)
        );

        input.type(value);
    }
}
