import {isFieldEmpty} from '../utils';

export class Input {
    constructor(form, name, type = 'input', byRow = true) {
        const row = !byRow ? form :
            form.element(by.id(`form-row-${name}`));

        this.input = row.element(
            by.xpath(`//${type}[@name="${name}"]`)
        );
    }

    getValue() {
        return this.input.getAttribute('value');
    }

    setValue(value) {
        this.input.clear();
        browser.wait(
            () => isFieldEmpty(this.input),
            7500
        );
        return this.input.sendKeys(value);
    }
}
