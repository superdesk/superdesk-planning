import {Popup, Input, SelectInput} from '../../common';

export class NewLocationPopup extends Popup {
    fields: {
        name: Input,
        address: Input,
        area: Input,
        suburb: Input,
        city: Input,
        locality: Input,
        state: SelectInput,
        postal_code: Input,
        country: SelectInput,
        notes: Input,
    }

    constructor() {
        super('[data-test-id="editor-popup-form"]');

        const getParent = () => this.element;

        this.fields = {
            name: new Input(getParent, '[data-test-id="field-location.name"] input'),
            address: new Input(getParent, '[data-test-id="field-location.address"] input'),
            area: new Input(getParent, '[data-test-id="field-location.area"] input'),
            suburb: new Input(getParent, '[data-test-id="field-location.suburb"] input'),
            city: new Input(getParent, '[data-test-id="field-location.city"] input'),
            locality: new Input(getParent, '[data-test-id="field-location.locality"] input'),
            state: new SelectInput(getParent, '[data-test-id="field-location.region"] select'),
            postal_code: new Input(getParent, '[data-test-id="field-location.postal_code"] input'),
            country: new SelectInput(getParent, '[data-test-id="field-location.country"] select'),
            notes: new Input(getParent, '[data-test-id="field-location.notes"] textarea'),
        };
    }

    get cancelButton() {
        return this.element.find('[data-test-id="location-form__cancel-button"]')
            .should('exist');
    }

    get createButton() {
        return this.element.find('[data-test-id="location-form__create-button"]')
            .should('exist');
    }
}
