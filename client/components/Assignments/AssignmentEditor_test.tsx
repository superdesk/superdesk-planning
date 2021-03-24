import React from 'react';
import {mount} from 'enzyme';
import {Provider} from 'react-redux';
import sinon from 'sinon';

import {getTestActionStore} from '../../utils/testUtils';
import {createTestStore} from '../../utils';

import {AssignmentEditor} from './';

describe('<AssignmentEditor />', () => {
    let store;
    let astore;
    let data;
    let assignment;
    const onChange = sinon.spy(() => (Promise.resolve()));
    const setValid = sinon.spy(() => true);
    const desks = [{_id: 'desk1', name: 'desk1'}];

    beforeEach(() => {
        astore = getTestActionStore();
        data = astore.data;
        assignment = data.assignments[0];
    });

    const initStore = () => {
        astore.init();
        store = createTestStore({initialState: astore.initialState});
        return store;
    };

    const getWrapper = () => mount(
        <Provider store={initStore()}>
            <AssignmentEditor
                value={assignment}
                onChange={onChange}
                setValid={setValid}
                desks={desks}
                users={[]}
                coverageProviders={[]}
                priorities={[]}
            />
        </Provider>
    );

    it('shows validation errors', () => {
        const wrapper = getWrapper();
        const deskFieldBeforeError = wrapper.find('.form__row').first();

        expect(deskFieldBeforeError.find('label').text()).toBe('Desk');
        expect(deskFieldBeforeError.find('.sd-line-input__message').length).toBe(0);
        const deskSelectInput = deskFieldBeforeError.find('select');

        deskSelectInput.simulate('change', {target: ''});
        const deskFieldAfterError = wrapper.find('.form__row').first();

        expect(deskFieldAfterError.find('.sd-line-input__message').length).toBe(1);
        expect(deskFieldAfterError.find('.sd-line-input__message').text()).toBe('This field is required');
    });
});
