import Input from './input';
import Popup from '../ui/popup';

export default class UrgencyInput extends Input {
    expect(value) {
        this.element.should('contain.text', value);
    }

    type(value) {
        const popup = new Popup();

        this.element
            .find('button')
            .click();
        popup.waitTillOpen();
        popup.element
            .find('.popup__menu-content')
            .contains(value)
            .parent()
            .click();
        popup.waitTillClosed();
    }
}
