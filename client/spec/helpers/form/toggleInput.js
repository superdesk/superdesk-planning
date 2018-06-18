import {hasClass} from '../utils';

export class ToggleInput {
    constructor(form, field) {
        this.toggle = form.element(by.xpath(`//button[@name="${field}"]`));
    }

    getValue() {
        return hasClass(this.toggle, 'checked');
    }

    setValue(value) {
        return this.getValue()
            .then((checked) => {
                if (checked !== value) {
                    this.toggle.click();
                }
            });
    }
}
