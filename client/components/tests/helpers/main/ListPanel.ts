import {ListPanel as LP} from '../../../Main';

export default class ListPanel {
    constructor(element) {
        this.update(element);
    }

    update(element = null) {
        if (element !== null) {
            this.element = element.find(LP).first();
        }

        this.isMounted = this.element.exists();
    }
}
