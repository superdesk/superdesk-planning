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
import {TIME_COMPARISON_GRANULARITY} from '../../../constants';
import sinon from 'sinon';

describe('form validations', () => {
    let store;
    let astore;
    let data;
    const enableSaveInModal = sinon.spy(() => true);
    const disableSaveInModal = sinon.spy(() => true);
    const startDate = moment().add(3, 'days')
        .set({
            [TIME_COMPARISON_GRANULARITY.HOUR]: 0,
            [TIME_COMPARISON_GRANULARITY.MINUTE]: 0,
        });
    const endDate = moment().add(3, 'days')
        .set({
            [TIME_COMPARISON_GRANULARITY.HOUR]: 23,
            [TIME_COMPARISON_GRANULARITY.MINUTE]: 50,
        });

    beforeEach(() => {
        astore = getTestActionStore();
        data = astore.data;
        data.events[1].dates.start = startDate;
        data.events[1].dates.end = endDate;

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

    it('forms with validation shows validation errors', () => {
        let wrapper = getWrapper(ConvertToRecurringEventForm);
        const endsField_convertToRecurringEventForm = wrapper.find('[name="dates.recurring_rule.endRepeatMode"]');

        expect(wrapper.find('.sd-line-input--invalid').length).toBe(3);
        endsField_convertToRecurringEventForm.simulate('change', {target: {value: 'count'}});
        const countField_convertToRecurringEventForm = wrapper.find('[name="dates.recurring_rule.count"]');

        countField_convertToRecurringEventForm.simulate('change', {target: {value: '3'}});
        expect(wrapper.find('.sd-line-input--invalid').length).toBe(2);
        countField_convertToRecurringEventForm.simulate('change', {target: {value: '300'}});
        expect(wrapper.find('.sd-line-input--invalid').length).toBeGreaterThan(0);

        wrapper.unmount();
        wrapper = getWrapper(UpdateTimeForm);
        const endDateField_updateTimeForm = wrapper.find('[name="_endTime"]');

        expect(wrapper.find('.sd-line-input--invalid').length).toBe(0);
        endDateField_updateTimeForm.simulate('change', {target: {value: '00:00'}});
        expect(wrapper.find('.sd-line-input--invalid').length).toBeGreaterThan(0);

        wrapper.unmount();
        wrapper = getWrapper(RescheduleEventForm);
        const endDateField_rescheduleEventForm = wrapper.find('[name="_endTime"]');

        expect(wrapper.find('.sd-line-input--invalid').length).toBe(0);
        endDateField_rescheduleEventForm.simulate('change', {target: {value: '00:00'}});
        expect(wrapper.find('.sd-line-input--invalid').length).toBeGreaterThan(0);

        const recurrence_rule = {
            endRepeatMode: 'count',
            frequency: 'DAILY',
            interval: 3,
            count: 1,
        };

        data.events[0].dates.start = startDate;
        data.events[0].dates.end = endDate;
        data.events[0].dates.recurring_rule = recurrence_rule;
        data.events[0].dates.recurrence_id = 'r1';
        data.events[1].dates.recurring_rule = recurrence_rule;
        data.events[1].dates.recurrence_id = 'r1';
        data.events[1]._recurring = [data.events[0]];

        wrapper = getWrapper(UpdateEventRepetitionsForm);
        expect(wrapper.find('.sd-line-input--invalid').length).toBe(0);
        endsField_convertToRecurringEventForm.simulate('change', {target: {value: 'count'}});
        const countField_updateEventRepetitionsForm = wrapper.find('[name="dates.recurring_rule.count"]');

        countField_updateEventRepetitionsForm.simulate('change', {target: {value: 300}});
        expect(wrapper.find('.sd-line-input--invalid').length).toBeGreaterThan(0);
    });
});
