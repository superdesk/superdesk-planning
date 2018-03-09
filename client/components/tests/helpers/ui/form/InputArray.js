import Input from './Input';

export default class InputArray {
    constructor(element, field, type = 'input', root = null) {
        this.root = root || element;
        this.field = field;
        this.type = type;
        this.element = element.findWhere((n) => n.length > 0 && n.props().field === this.field).first();
        this.isMounted = this.element.exists();

        if (this.isMounted) {
            this.addButton = this.element.find('.btn').first();
        } else {
            this.addButton = null;
        }
    }

    at(index) {
        if (this.isMounted) {
            return new Input(
                this.element,
                `${this.field}[${index}]`,
                this.type,
                this.root
            );
        }

        return null;
    }

    add() {
        if (this.isMounted) {
            this.addButton.simulate('click');
            this.root.update();
        }
    }

    update(index, value) {
        if (this.isMounted) {
            const input = this.at(index);

            if (input) {
                input.change(value);
            }
        }
    }

    value(index = null) {
        if (this.isMounted) {
            if (index === null) {
                return this.element.props().value;
            } else {
                const input = this.at(index);

                return !input ?
                    null :
                    input.value();
            }
        }

        return null;
    }

    remove(index) {
        if (this.isMounted) {
            const input = this.at(index);

            if (input) {
                input
                    .find('.sd-line-input__icon-right')
                    .first()
                    .simulate('click');
                this.root.update();
            }
        }
    }
}
