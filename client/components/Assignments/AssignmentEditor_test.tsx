import React from 'react';
import {mount} from 'enzyme';
import sinon from 'sinon';
import {set, cloneDeep} from 'lodash';

import {assignments, desks} from '../../utils/testData';

import {AssignmentEditorComponent} from './AssignmentEditor';

describe('<AssignmentEditor />', () => {
    let assignment;
    const onChange = sinon.spy((updates) => {
        for (const [field, value] of Object.entries(updates)) {
            set(assignment, field, value);
        }
    });

    beforeEach(() => {
        assignment = cloneDeep(assignments[0]);
    });

    const getWrapper = () => mount(
        <AssignmentEditorComponent
            value={assignment}
            onChange={onChange}
            desks={cloneDeep(desks)}
            users={[]}
            coverageProviders={[]}
            priorities={[]}
            contactTypes={[]}
        />
    );

    it('shows validation errors', () => {
        const wrapper = getWrapper();
        const deskFieldBeforeError = wrapper.find('.form__row').first();

        expect(deskFieldBeforeError.find('label').text()).toBe('Desk');
        expect(deskFieldBeforeError.find('.sd-line-input__message').length).toBe(0);
        const deskSelectInput = deskFieldBeforeError.find('select');

        deskSelectInput.simulate('change', {target: ''});
        wrapper.setProps({value: {...assignment}});
        const deskFieldAfterError = wrapper.find('.form__row').first();

        expect(deskFieldAfterError.find('.sd-line-input__message').length).toBe(1);
        expect(deskFieldAfterError.find('.sd-line-input__message').text()).toBe('This field is required');
    });
});
