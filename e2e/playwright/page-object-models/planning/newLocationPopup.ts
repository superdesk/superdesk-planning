import type {Page, Locator} from '@playwright/test';

import {Popup, Input, SelectInput} from '../../utils/common';

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

    constructor(page: Page) {
        super(page, '.modal__dialog');

        const getParent = () => this.element;

        this.fields = {
            name: new Input(page, getParent, '[data-test-id="field-location.name"] input'),
            address: new Input(page, getParent, '[data-test-id="field-location.address"] input'),
            area: new Input(page, getParent, '[data-test-id="field-location.area"] input'),
            suburb: new Input(page, getParent, '[data-test-id="field-location.suburb"] input'),
            city: new Input(page, getParent, '[data-test-id="field-location.city"] input'),
            locality: new Input(page, getParent, '[data-test-id="field-location.locality"] input'),
            state: new SelectInput(page, getParent, '[data-test-id="field-location.region"] select'),
            postal_code: new Input(page, getParent, '[data-test-id="field-location.postal_code"] input'),
            country: new SelectInput(page, getParent, '[data-test-id="field-location.country"] select'),
            notes: new Input(page, getParent, '[data-test-id="field-location.notes"] textarea'),
        };
    }

    get cancelButton(): Locator {
        return this.element.getByTestId('location-form__cancel-button');
    }

    get createButton(): Locator {
        return this.element.getByTestId('location-form__create-button');
    }
}
