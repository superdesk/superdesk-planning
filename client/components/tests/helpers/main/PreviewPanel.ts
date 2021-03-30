import {PreviewPanel as PP} from '../../../Main';

export default class PreviewPanel {
    constructor(element) {
        this.update(element);
    }

    update(element = null) {
        if (element !== null) {
            this.element = element.find(PP).first();
        }

        this.isMounted = this.element.exists();
    }
}
