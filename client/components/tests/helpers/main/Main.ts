import {PlanningApp} from '../../../../apps';
import {
    SubNavBar,
    FiltersBox,
    ListPanel,
    PreviewPanel,
    Editor,
} from './';

export default class Main {
    constructor(element) {
        this.update(element);
    }

    update(element = null) {
        if (element !== null) {
            this.element = element.find(PlanningApp).first();
        }

        this.isMounted = this.element.exists();

        if (this.isMounted) {
            this.subNavBar = new SubNavBar(this.element);
            this.filters = new FiltersBox(this.element);
            this.list = new ListPanel(this.element);
            this.preview = new PreviewPanel(this.element);
            this.editor = new Editor(this.element);
        } else {
            this.filters = this.list = this.preview = this.editor = null;
        }
    }

    groups() {
        return this.isMounted ? this.element.props().groups : null;
    }
}
