import {SubNavBar as SNB} from '../../../Main';
import {MultiSelectActionsComponent} from '../../../MultiSelectActions';

export default class SubNavBar {
    constructor(element) {
        this.update(element);
    }

    update(element = null) {
        if (element !== null) {
            this.element = element.find(SNB).first();
        }
        this.isMounted = this.element.exists();

        if (this.isMounted) {
            const multiActionBar = this.element.find(MultiSelectActionsComponent).first();

            this.multiActionBarHidden = multiActionBar.find('.ng-hide').length > 0;
        }
    }
}
