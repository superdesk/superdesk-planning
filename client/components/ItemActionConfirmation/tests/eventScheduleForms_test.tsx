import React from 'react';
import {mount} from 'enzyme';
import {Provider} from 'react-redux';
import moment from 'moment-timezone';
import sinon from 'sinon';

import * as actions from '../../../actions';
import {createTestStore, timeUtils} from '../../../utils';
import {getTestActionStore} from '../../../utils/testUtils';
import {EditorFieldEventSchedule} from '../../fields/editor/EventSchedule';
import {
    ConvertToRecurringEventComponent,
    ConvertToRecurringEventForm,
} from '../forms/convertToRecurringEventForm';
import {RescheduleEventComponent, RescheduleEventForm} from '../forms/rescheduleEventForm';

describe('Event action forms with date-only schedules', () => {
    let wrapper;
    let original;
    let store;
    let enableSave;
    let disableSave;
    let localTimeZone;

    beforeEach(() => {
        moment.tz.setDefault('UTC');
        localTimeZone = sinon.stub(timeUtils, 'localTimeZone').returns('UTC');
        const actionStore = getTestActionStore();

        original = actionStore.data.events[1];
        original.dates.start = moment.utc('2040-01-02');
        original.dates.end = moment.utc('2040-01-02');
        original.dates.tz = 'America/Toronto';
        original.dates.all_day = true;
        original.dates.no_end_time = false;
        original._startTime = null;
        original._endTime = null;
        actionStore.init();
        store = createTestStore({initialState: actionStore.initialState});
        enableSave = sinon.spy();
        disableSave = sinon.spy();
    });

    afterEach(() => {
        wrapper?.unmount();
        localTimeZone.restore();
        moment.tz.setDefault('Australia/Sydney');
    });

    const mountForm = (Form: React.ElementType) => {
        wrapper = mount(
            <Provider store={store}>
                {React.createElement(Form, {
                    original: original,
                    enableSaveInModal: enableSave,
                    disableSaveInModal: disableSave,
                })}
            </Provider>
        );
    };

    const mountRecurringForm = () => {
        mountForm(ConvertToRecurringEventForm);
        wrapper.find('[data-test-id="dates.recurring_rule.count"]').at(1)
            .simulate('change', {target: {value: '3'}});
        enableSave.resetHistory();
        disableSave.resetHistory();
    };

    const changeTime = (field, value) => {
        wrapper.find(`[name="${field}"]`).simulate('change', {target: {value}});
        wrapper.update();
    };

    const getDiff = () => wrapper.find(EditorFieldEventSchedule).prop('item');

    const expectEmptyEndTime = () => {
        expect(getDiff().dates.end.toISOString()).toBe('2040-01-02T00:00:00.000Z');
        expect(getDiff().dates.all_day).toBe(false);
        expect(getDiff().dates.no_end_time).toBe(true);
        expect(getDiff()._endTime).toBeNull();
        expect(wrapper.find('[name="_endTime"]').prop('value')).toBe('');
        expect(wrapper.find('.sd-line-input--invalid').length).toBe(0);
        expect(enableSave.called).toBe(true);
        expect(disableSave.called).toBe(false);
    };

    it('reschedules an all-day event with a start time and no end time', () => {
        const save = sinon.stub(actions.events.ui, 'rescheduleEvent').returns(() => Promise.resolve());

        try {
            mountForm(RescheduleEventForm);
            expect(getDiff()._startTime).toBeNull();
            expect(getDiff()._endTime).toBeNull();
            changeTime('_startTime', '10:00');

            expectEmptyEndTime();
            expect(getDiff().dates.start.toISOString()).toBe('2040-01-02T15:00:00.000Z');
            wrapper.find(RescheduleEventComponent).instance()
                .submit();
            expect(save.calledOnce).toBe(true);
            expect(save.firstCall.args[1].dates.start.toISOString()).toBe('2040-01-02T15:00:00.000Z');
            expect(save.firstCall.args[1].dates.end.toISOString()).toBe('2040-01-02T00:00:00.000Z');
            expect(save.firstCall.args[1].dates.no_end_time).toBe(true);
        } finally {
            save.restore();
        }
    });

    it('converts an all-day event to recurring with a start time and no end time', () => {
        const save = sinon.stub(actions.main, 'save').returns(() => Promise.resolve());

        try {
            mountRecurringForm();
            expect(getDiff()._startTime).toBeNull();
            expect(getDiff()._endTime).toBeNull();
            changeTime('_startTime', '10:00');

            expectEmptyEndTime();
            expect(getDiff().dates.start.toISOString()).toBe('2040-01-02T15:00:00.000Z');
            wrapper.find(ConvertToRecurringEventComponent).instance()
                .submit();
            expect(save.calledOnce).toBe(true);
            expect(save.firstCall.args[1].dates.start.toISOString()).toBe('2040-01-02T15:00:00.000Z');
            expect(save.firstCall.args[1].dates.end.toISOString()).toBe('2040-01-02T00:00:00.000Z');
            expect(save.firstCall.args[1].dates.no_end_time).toBe(true);
        } finally {
            save.restore();
        }
    });

    it('preserves an existing date-only end when rescheduling in the local timezone', () => {
        original.dates.tz = 'UTC';
        original.dates.all_day = false;
        original.dates.no_end_time = true;
        original.dates.start = moment.utc('2040-01-02T09:00:00');
        mountForm(RescheduleEventForm);
        changeTime('_startTime', '10:00');

        expectEmptyEndTime();
    });

    it('preserves an existing date-only end when converting in a remote timezone', () => {
        original.dates.all_day = false;
        original.dates.no_end_time = true;
        original.dates.start = moment.tz('2040-01-02 09:00', original.dates.tz);
        mountRecurringForm();
        changeTime('_startTime', '10:00');

        expectEmptyEndTime();
    });

    it('validates an explicit end time when rescheduling', () => {
        mountForm(RescheduleEventForm);
        changeTime('_startTime', '10:00');
        changeTime('_endTime', '09:00');
        expect(wrapper.find('.sd-line-input--invalid').length).toBeGreaterThan(0);
        expect(disableSave.called).toBe(true);

        disableSave.resetHistory();
        changeTime('_endTime', '11:00');
        expect(getDiff().dates.no_end_time).toBe(false);
        expect(getDiff().dates.end.toISOString()).toBe('2040-01-02T16:00:00.000Z');
        expect(wrapper.find('.sd-line-input--invalid').length).toBe(0);
        expect(enableSave.called).toBe(true);
        expect(disableSave.called).toBe(false);
    });

    it('preserves an existing timed end when converting to recurring', () => {
        original.dates.all_day = false;
        original.dates.start = moment.tz('2040-01-02 09:00', original.dates.tz);
        original.dates.end = moment.tz('2040-01-02 11:00', original.dates.tz);
        mountRecurringForm();
        expect(wrapper.find('[name="_startTime"]').prop('value')).toBe('09:00');
        expect(wrapper.find('[name="_endTime"]').prop('value')).toBe('11:00');
        changeTime('_startTime', '10:00');

        expect(getDiff().dates.no_end_time).toBe(false);
        expect(getDiff().dates.end.toISOString()).toBe('2040-01-02T16:00:00.000Z');
        expect(enableSave.called).toBe(true);
        expect(disableSave.called).toBe(false);
    });
});
