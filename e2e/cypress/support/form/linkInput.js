import Input from './input';

export default class LinkInput extends Input {
    get addButton() {
        return this.editor.element
            .find('.link-input__add-btn');
    }

    get inputs() {
        return this.editor.element.find('.link-input__input');
    }

    expect(values) {
        cy.wrap(values).each((value) => {
            this.inputs.should('contain.text', value);
        });
    }

    type(values, startingIndex = 0) {
        cy.wrap(values).each((value, index) => {
            this.addButton.click({force: true});
            const input = new Input(
                this.editor,
                `textarea[name="links[${startingIndex + index}]"]`
            );

            input.type(value);
        });
    }
}
