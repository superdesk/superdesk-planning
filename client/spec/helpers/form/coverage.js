import {set, map} from 'lodash';

import {getCoverageInputHelper} from './index';
import {CollapseBox} from '../collapseBox';

export class Coverage {
    constructor(parent, index) {
        this.parent = parent;
        this.index = index;
        this.collapseBox = new CollapseBox(parent);
    }

    getValue(values) {
        this.collapseBox.expand();
        this.collapseBox.waitOpen();
        const coverage = {};

        // Iterate over all expected values to get their form values
        const promise = Promise.all(map(
            values,
            (value, field) => {
                let promise = field === 'planning' ?
                    this.getPlanningValues(value) :
                    getCoverageInputHelper(this.parent, this.index, field, '')
                        .getValue();

                return promise.then((formValue) => set(coverage, field, formValue));
            }
        ));

        // Wait for all the values to be populated
        browser.wait(promise, 7500);

        return Promise.resolve(coverage);
    }

    getPlanningValues(values) {
        const planning = {};

        return Promise.all(map(
            values,
            (value, field) => (
                getCoverageInputHelper(this.parent, this.index, field)
                    .getValue()
                    .then((formValue) => set(planning, field, formValue))
            )
        ))
            .then(() => planning);
    }

    setValue(coverage) {
        this.collapseBox.expand();
        this.collapseBox.waitOpen();

        let promise = Promise.all(
            map(
                coverage,
                (value, field) => (
                    field === 'planning' ?
                        this.setPlanningValues(value) :
                        getCoverageInputHelper(this.parent, this.index, field, '')
                            .setValue(value)
                )
            )
        );

        // Wait for all the coverage values to be entered into the form
        browser.wait(promise, 7500);

        return Promise.resolve();
    }

    setPlanningValues(values) {
        return Promise.all(map(
            values,
            (value, field) => (
                getCoverageInputHelper(this.parent, this.index, field)
                    .setValue(value)
            )
        ));
    }
}
