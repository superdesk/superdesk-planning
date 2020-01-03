import Input from './input';

export default class ToggleInput extends Input {
    expect(value) {
        this.element.should(
            value ? 'have.class' : 'not.have.class',
            'checked'
        );
    }

    type(value) {
        this.element
            .click()
            .should('have.class', 'checked');
    }
}
