import {get} from 'lodash';
import {DateTime} from './dateTime';

export class EventSchedule {
    constructor(form, name = 'dates') {
        this.inputs = {
            start: new DateTime(form, `${name}.start`),
            end: new DateTime(form, `${name}.end`),
        };
    }

    getValue() {
        let values = {};

        return this.inputs.start.getValue()
            .then((start) => {
                values.start = start;
                return this.inputs.end.getValue();
            })
            .then((end) => {
                values.end = end;
                return values;
            });
    }

    setValue(values) {
        let promises = [];

        if (get(values, 'start')) {
            promises.push(
                this.inputs.start.setValue(values.start)
            );
        }

        if (get(values, 'end')) {
            promises.push(
                this.inputs.end.setValue(values.end)
            );
        }

        return Promise.all(promises);
    }
}
