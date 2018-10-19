import {get} from 'lodash';
import {isFieldEmpty} from '../utils';

export class Input {
    constructor(form, name, type = 'input', byRow = true) {
        const row = !byRow ? form :
            form.element(by.id(`form-row-${name}`));

        this.input = row.element(
            by.xpath(`//${type}[@name="${name}"]`)
        );
        this.name = name;
    }

    getValue() {
        return this.input.getAttribute('value');
    }

    setValue(value, clearByDeleteKey = false) {
        if (clearByDeleteKey) {
            this.getValue().then((value) => {
                for (var i = 0; i < get(value, 'length', 0); i++) {
                    this.input.sendKeys('\b');
                }
            });
        } else {
            this.input.clear();
        }
        browser.wait(
            () => isFieldEmpty(this.input),
            20000,
            `Timeout while waiting for input '${this.name}' to be cleared`
        );
        return this.input.sendKeys(value);
    }
}
