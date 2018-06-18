
export class UrgencyInput {
    constructor(form, field) {
        this.row = form.element(by.id(`form-row-${field}`));
        this.button = this.row.element(by.className('dropdown__toggle'));
        this.label = this.row.element(by.className('urgency-label'));
    }

    getValue() {
        return this.label.getAttribute('textContent');
    }

    setValue(value) {
        this.button.click();
        const keySequence = browser.actions();

        for (let i = 0; i < value; i++)
            keySequence.sendKeys(protractor.Key.DOWN);

        keySequence.sendKeys(protractor.Key.ENTER);
        return keySequence.perform();
    }
}
