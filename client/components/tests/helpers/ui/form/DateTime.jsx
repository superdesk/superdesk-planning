import Input from './Input';

export default class DateTime {
    constructor(element, field, type = 'input', root = null) {
        this.date = new Input(element, `${field}.date`, type, root);
        this.time = new Input(element, `${field}.time`, type, root);
    }
}
