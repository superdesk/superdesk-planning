import Input from './input';

export default class SelectInput extends Input {
    type(value) {
        this.element
            .select(value)
            .find(':checked')
            .should('contain.text', value);
    }

    expect(value) {
        this.element
            .find(':checked')
            .should('contain.text', value);
    }
}
