import Popup from './popup';

export default class Modal extends Popup {
    constructor(selector = '.modal__dialog') {
        super(selector);
    }

    getFooterButton(label) {
        return this.element.find('.modal__footer')
            .contains(label);
    }
}
