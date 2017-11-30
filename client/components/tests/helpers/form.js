
export default class form {
    constructor(element) {
        this.element = element.find('form').first();
        this.isMounted = this.element.exists();
    }

    submit() {
        if (this.isMounted) {
            this.element.simulate('submit', {preventDefault: () => ({})});
        }
    }

    field(name) {
        return new field(this.element, name);
    }

    getValue(name) {
        return this.field(name).getValue();
    }

    setValue(name, value) {
        this.field(name).setValue(value);
    }
}

class field {
    constructor(element, name) {
        this.element = element.find(`Field [name="${name}"]`).first();
        this.isMounted = this.element.exists();
    }

    getValue() {
        return this.isMounted ? this.element.prop('value') : null;
    }

    setValue(value) {
        if (this.isMounted) {
            this.element.simulate('change', {target: {value}});
        }
    }
}
