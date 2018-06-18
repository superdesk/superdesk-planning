
export class Select {
    constructor(form, name) {
        this.row = form.element(by.id(`form-row-${name}`));
        this.input = this.row.element(by.tagName('select'));
    }

    getValue() {
        return this.input.getAttribute('value');
    }

    setValue(value) {
        return this.input.element(by.xpath(`option[@value="${value}"]`))
            .click();
    }
}
