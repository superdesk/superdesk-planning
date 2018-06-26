/* eslint-disable camelcase */
import React from 'react';
import {mount} from 'enzyme';
import moment from 'moment';
import {Provider} from 'react-redux';
import {
    ConvertToRecurringEventForm,
    UpdateTimeForm,
    RescheduleEventForm,
    UpdateEventRepetitionsForm,
} from '../index';
import {getTestActionStore} from '../../../utils/testUtils';
import {createTestStore} from '../../../utils';
import sinon from 'sinon';

describe('form validations', () => {
    let store;
    let astore;
    let data;
    const enableSaveInModal = sinon.spy(() => true);
    const disableSaveInModal = sinon.spy(() => true);

    beforeEach(() => {
        astore = getTestActionStore();
        data = astore.data;
        data.events[1].dates.start = moment(data.events[1].dates.start);
        data.events[1].dates.end = moment(data.events[1].dates.end);

        astore.init();

        store = createTestStore({initialState: astore.initialState});
    });

    const getWrapper = (component) => (
        mount(
            <Provider store={store}>
                {React.createElement(component, {
                    initialValues: data.events[1],
                    enableSaveInModal: enableSaveInModal,
                    disableSaveInModal: disableSaveInModal,
                })}
            </Provider>
        )
    );

    // Excluding this as this will change during refactoring
    it('forms with validation shows validation errors', () => {
        let wrapper = getWrapper(ConvertToRecurringEventForm);
        const countField_convertToRecurringEventForm = wrapper.find('[name="count"]');

        expect(wrapper.find('.sd-line-input--invalid').length).toBe(0);
        countField_convertToRecurringEventForm.simulate('change', {target: {value: 300}});
        expect(wrapper.find('.sd-line-input--invalid').length > 0).toBe(true);

        wrapper = getWrapper(UpdateTimeForm);
        const endDateField_updateTimeForm = wrapper.find('[name="dates.end.time"]');

        expect(wrapper.find('.sd-line-input--invalid').length).toBe(0);
        endDateField_updateTimeForm.simulate('change', {target: {value: '00:00'}});
        expect(wrapper.find('.sd-line-input--invalid').length > 0).toBe(true);

        wrapper = getWrapper(RescheduleEventForm);
        const endDateField_rescheduleEventForm = wrapper.find('[name="dates.end.time"]');

        expect(wrapper.find('.sd-line-input--invalid').length).toBe(0);
        endDateField_rescheduleEventForm.simulate('change', {target: {value: '00:00'}});
        expect(wrapper.find('.sd-line-input--invalid').length > 0).toBe(true);

        const recurrence_rule = {
            endRepeatMode: 'count',
            frequency: 'DAILY',
            interval: 3,
            count: 1,
        };

        data.events[0].dates.start = moment(data.events[1].dates.start);
        data.events[0].dates.end = moment(data.events[1].dates.end);
        data.events[0].dates.recurring_rule = recurrence_rule;
        data.events[0].dates.recurrence_id = 'r1';
        data.events[1].dates.recurring_rule = recurrence_rule;
        data.events[1].dates.recurrence_id = 'r1';
        data.events[1]._recurring = [data.events[0]];

        wrapper = getWrapper(UpdateEventRepetitionsForm);
        const countField_updateEventRepetitionsForm = wrapper.find('[name="count"]');

        expect(wrapper.find('.sd-line-input--invalid').length).toBe(0);
        countField_updateEventRepetitionsForm.simulate('change', {target: {value: 300}});
        expect(wrapper.find('.sd-line-input--invalid').length > 0).toBe(true);
    });
});
