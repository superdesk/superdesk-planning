
export default class Input {
    constructor(element, field, type = 'input', root = null) {
        this.root = root || element;
        this.field = field;
        this.type = type;
        this.element = element.findWhere((n) => n.props().field === this.field).first();
        this.isMounted = this.element.exists();
        this.input = null;

        if (this.isMounted) {
            this.input = this.element.find(type).first();
        }
    }

    change(value) {
        if (this.isMounted) {
            this.input.simulate('change', {target: {value: value}});
            this.root.update();
        }
    }

    value() {
        if (this.isMounted) {
            return this.input.props().value;
        }

        return null;
    }

    find(query) {
        if (this.isMounted) {
            return this.element.find(query);
        }

        return null;
    }
}