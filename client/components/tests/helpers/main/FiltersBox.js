import {FiltersBox as FB} from '../../../Main';
import {Spacer} from '../../../UI/SubNav';
import {Checkbox} from '../ui/form';
import {Dropdown} from '../ui/subnav';

export default class FiltersBox {
    constructor(element) {
        this.update(element);
    }

    update(element = null) {
        if (element !== null) {
            this.element = element.find(FB).first();
        }

        this.isMounted = this.element.exists();

        if (this.isMounted) {
            this.combined = new Checkbox(this.element, 0);
            this.events = new Checkbox(this.element, 1);
            this.planning = new Checkbox(this.element, 2);

            this.spacer = this.element.find(Spacer).first();
            this.agendaDropdown = new Dropdown(this.element);
        } else {
            this.combined = this.events = this.planning = this.spacer = this.agendaDropdown = null;
        }
    }

    activeFilter() {
        if (this.isMounted) {
            return this.element.prop('activeFilter');
        }

        return null;
    }

    currentAgendaId() {
        if (this.isMounted) {
            return this.element.prop('currentAgendaId');
        }

        return null;
    }
}
