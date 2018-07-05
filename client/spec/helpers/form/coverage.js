import {set, map} from 'lodash';

import {getCoverageInputHelper, getInputHelper, getLabelHelper} from './index';
import {CollapseBox} from '../collapseBox';
import {waitAndClick} from '../utils';
import {Popup} from '../popup';

export class Coverage {
    constructor(parent, index) {
        this.parent = parent;
        this.index = index;
        this.collapseBox = new CollapseBox(parent);
        this.editAssignmentButton = this.parent.element(by.xpath('//button[@id="editAssignment"]'));
        this.submitAssignmentButton = this.parent.element(by.xpath('//button[@id="submitAssignment"]'));
    }

    getValue(values) {
        this.collapseBox.expand();
        this.collapseBox.waitOpen();
        const coverage = {};

        // Iterate over all expected values to get their form values
        const promise = Promise.all(map(
            values,
            (value, field) => {
                let promise;

                if (field === 'assigned_to') {
                    promise = this.getAssignmentValues(value);
                } else {
                    promise = field === 'planning' ?
                        this.getPlanningValues(value) :
                        getCoverageInputHelper(this.parent, this.index, field, '')
                            .getValue();
                }
                return promise.then((formValue) => set(coverage, field, formValue));
            }
        ));

        // Wait for all the values to be populated
        browser.wait(
            promise,
            7500,
            'Timeout while getting Coverage values'
        );

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

    getAssignmentValues(values) {
        const assignedTo = {};
        const assignmentFieldPrefix = `coverages[${this.index}].assigned_to.`;

        return Promise.all(map(
            values,
            (value, field) => (
                getLabelHelper(this.parent, assignmentFieldPrefix + field, 'span')
                    .getValue()
                    .then((formValue) => set(assignedTo, field, formValue))
            )
        )).then(() => assignedTo);
    }

    setValue(coverage) {
        this.collapseBox.expand();
        this.collapseBox.waitOpen();

        let promise = Promise.all(
            map(
                coverage,
                (value, field) => {
                    if (field === 'assigned_to') {
                        return this.setAssignmentValues(value);
                    } else {
                        return field === 'planning' ?
                            this.setPlanningValues(value) :
                            getCoverageInputHelper(this.parent, this.index, field, '')
                                .setValue(value);
                    }
                }
            )
        );

        // Wait for all the coverage values to be entered into the form
        browser.wait(
            promise,
            7500,
            'Timeout while setting Coverage values'
        );

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

    setAssignmentValues(values) {
        waitAndClick(this.editAssignmentButton);
        Popup.wait('assignment-popup');
        const assignmentPopup = new Popup('assignment-popup');

        return Promise.all(map(
            values,
            (value, field) => (
                getInputHelper(assignmentPopup.element, field)
                    .setValue(value, true)
            )
        )).then(() => waitAndClick(this.submitAssignmentButton));
    }
}
