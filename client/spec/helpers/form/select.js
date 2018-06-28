
export class Select {
    constructor(form, name) {
        this.row = form.element(by.id(`form-row-${name}`));
        this.input = this.row.element(by.tagName('select'));
    }

    getValue() {
        return this.input.getAttribute('value');
    }

    setValue(value, byLabel = false) {
        return !byLabel ? this.input.element(by.xpath(`option[@value="${value}"]`))
            .click() : this.input.element(by.cssContainingText('option', value)).click();
    }
}
