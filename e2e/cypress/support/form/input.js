
export default class Input {
    constructor(editor, selector) {
        this.editor = editor;
        this.selector = selector;
    }

    get element() {
        return this.editor.element.find(this.selector);
    }

    expect(value) {
        this.element
            .should('have.value', value);
    }

    type(value) {
        this.element
            .clear()
            .type(value)
            .should('have.value', value);
    }
}
