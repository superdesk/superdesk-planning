import {get} from 'lodash';

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
            return this.getValue().then((value) => {
                for (var i = 0; i < get(value, 'length', 0); i++) {
                    this.input.sendKeys('\b');
                }
            })
                .then(() => (
                    this.input.sendKeys(value)
                ));
        }

        return this.input
            .click()
            .sendKeys(
                protractor.Key.HOME,
                protractor.Key.SHIFT,
                protractor.Key.END,
                protractor.Key.BACK_SPACE
            )
            .sendKeys(value);
    }
}
