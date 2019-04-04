import {Popup} from './popup';


export class ConfirmationModal extends Popup {
    constructor(className = 'modal__dialog') {
        super(className);

        this.ignore = this.element.element(by.xpath('.//button[text()="Ignore"]'));
        this.cancel = this.element.element(by.xpath('.//button[text()="Cancel"]'));
        this.save = this.element.element(by.xpath('.//button[text()="Save"]'));
        this.create = this.element.element(by.xpath('.//button[text()="Create"]'));
        this.ok = this.element.element(by.xpath('.//button[text()="OK"]'));
    }

    static wait(className = 'modal__dialog') {
        return super.wait(className)
            .then(() => new ConfirmationModal(className));
    }

    static waitForClose(className = 'modal__dialog') {
        return super.waitForClose(className);
    }
}
