import {Editor as ED} from '../../../Main';

export default class Editor {
    constructor(element) {
        this.update(element);
    }

    update(element = null) {
        if (element !== null) {
            this.element = element.find(ED).first();
        }

        this.isMounted = this.element.exists();
    }
}
