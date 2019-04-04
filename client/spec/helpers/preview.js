import {ActionMenu} from './actionMenu';
import {waitPresent} from './utils';


class Preview {
    constructor() {
        this.element = element.all(by.className('sd-preview-panel')).first();

        this.closeButton = this.element.element(by.className('icon-close-small'));

        this.actionMenu = new ActionMenu(this.element);
    }

    waitTillOpen() {
        return waitPresent(this.element);
    }
}

export const preview = new Preview();
