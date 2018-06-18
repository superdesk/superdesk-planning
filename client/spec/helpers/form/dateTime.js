import {get} from 'lodash';
import {Input} from './input';

export class DateTime {
    constructor(form, name) {
        this.inputs = {
            date: new Input(form, `${name}.date`, 'input', false),
            time: new Input(form, `${name}.time`, 'input', false),
        };
    }

    getValue() {
        let value = {};

        return this.inputs.date.getValue()
            .then((date) => {
                value.date = date;
                return this.inputs.time.getValue();
            })
            .then((time) => {
                value.time = time;
                return value;
            });
    }

    setValue(value) {
        let promises = [];

        if (get(value, 'date')) {
            promises.push(
                this.inputs.date.setValue(value.date)
            );
        }

        if (get(value, 'time')) {
            promises.push(
                this.inputs.time.setValue(value.time)
            );
        }

        return Promise.all(promises);
    }
}
