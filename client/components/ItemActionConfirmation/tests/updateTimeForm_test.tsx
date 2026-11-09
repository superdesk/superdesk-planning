import React from 'react';
import {mount} from 'enzyme';
import moment from 'moment';
import {Provider} from 'react-redux';
import sinon from 'sinon';
import {cloneDeep} from 'lodash';

import * as actions from '../../../actions';
import {createTestStore, timeUtils} from '../../../utils';
import {convertEventDatesForTimezone} from '../../../utils/events';
import {getTestActionStore} from '../../../utils/testUtils';
import {UpdateTimeComponent, UpdateTimeForm} from '../forms/updateTimeForm';

describe('<UpdateTimeForm />', () => {
    let original;
    let wrapper;
    let enableSave;
    let disableSave;

    describe('<UpdateTimeForm /> recurring updates', () => {
        let wrapper;
        let enableSave;
        let disableSave;

        const mountForm = (allDay, noEndTime) => {
            const actionStore = getTestActionStore();
            const original = actionStore.data.events[1];

            original.dates.tz = 'Europe/Paris';
            original.dates.start = allDay ? moment.utc('2040-01-02') : moment.tz('2040-01-02 09:00', 'Europe/Paris');
            original.dates.end = allDay || noEndTime ?
                moment.utc('2040-01-02') : moment.tz('2040-01-02 15:00', 'Europe/Paris');
            original.dates.all_day = allDay;
            original.dates.no_end_time = noEndTime;
            original._startTime = allDay ? null : original.dates.start.clone();
            original._endTime = allDay || noEndTime ? null : original.dates.end.clone();
            original.recurrence_id = 'series-1';
            original._recurring = [{
                _id: 'summer-occurrence',
                dates: {
                    start: moment.tz('2040-07-02 09:00', 'Europe/Paris'),
                    end: noEndTime ? moment.utc('2040-07-02') : moment.tz('2040-07-02 15:00', 'Europe/Paris'),
                },
            }];
            actionStore.init();
            enableSave = sinon.spy();
            disableSave = sinon.spy();

            const getWrapper = (component) => mount(
                <Provider store={createTestStore({initialState: actionStore.initialState})}>
                    {React.createElement(component, {
                        original: original,
                        enableSaveInModal: enableSave,
                        disableSaveInModal: disableSave,
                    })}
                </Provider>
            );

            wrapper = getWrapper(UpdateTimeForm);
        };

        const selectMethod = (value) => {
            wrapper.find('select[name="update_method"]').simulate('change', {target: {value}});
            wrapper.update();
        };

        const changeRecurringTime = (field, value) => {
            wrapper.find(`[name="${field}"]`).simulate('change', {target: {value}});
            wrapper.update();
        };

        const expectBlocked = () => {
            expect(disableSave.called).toBe(true);
            expect(enableSave.called).toBe(false);
            expect(wrapper.text()).toContain(
                'Select "This event only" to update all-day events or events without an end time'
            );
        };

        afterEach(() => {
            wrapper.unmount();
        });

        it('blocks future and all updates for unchanged date-only ends, but allows a single event', () => {
            mountForm(false, true);
            changeRecurringTime('_startTime', '10:00');
            expect(enableSave.called).toBe(true);

            ['future', 'all'].forEach((method) => {
                enableSave.resetHistory();
                disableSave.resetHistory();
                selectMethod(method);
                expectBlocked();
            });

            enableSave.resetHistory();
            disableSave.resetHistory();
            changeRecurringTime('_startTime', '11:00');
            expectBlocked();

            enableSave.resetHistory();
            selectMethod('single');
            expect(enableSave.called).toBe(true);
            expect(wrapper.text()).not.toContain('Select "This event only"');
        });

        it('blocks unchanged all-day schedules for series updates', () => {
            mountForm(true, true);
            selectMethod('all');
            expectBlocked();
        });

        it('keeps blocking series updates when date-only flags change', () => {
            mountForm(false, false);
            selectMethod('future');
            enableSave.resetHistory();
            disableSave.resetHistory();
            wrapper.find('[name="_endTime"]').simulate('change', {target: {value: ''}});
            wrapper.find('[name="_endTime"]').simulate('blur');
            wrapper.update();
            expectBlocked();
        });

        it('blocks series updates when a date-only end becomes timed', () => {
            mountForm(false, true);
            selectMethod('all');
            enableSave.resetHistory();
            disableSave.resetHistory();
            changeRecurringTime('_endTime', '15:00');
            expectBlocked();
        });

        it('allows ordinary timed series updates', () => {
            mountForm(false, false);
            changeRecurringTime('_startTime', '10:00');
            enableSave.resetHistory();
            disableSave.resetHistory();
            selectMethod('all');
            expect(enableSave.called).toBe(true);
            expect(disableSave.called).toBe(false);
            expect(wrapper.text()).not.toContain('Select "This event only"');
        });

        it('does not re-enable a blocked series update when marking the time to be confirmed', () => {
            mountForm(false, true);
            selectMethod('future');
            enableSave.resetHistory();
            disableSave.resetHistory();
            wrapper.find(UpdateTimeComponent).instance()
                .handleToBeConfirmed();
            wrapper.update();
            expectBlocked();
        });
    });

    describe('all-day updates', () => {
        beforeEach(() => {
            const actionStore = getTestActionStore();

            original = actionStore.data.events[1];
            original.dates.start = moment.utc('2040-01-02');
            original.dates.end = moment.utc('2040-01-03');
            original.dates.all_day = true;
            original.dates.no_end_time = true;
            original._startTime = null;
            original._endTime = null;
            actionStore.init();

            enableSave = sinon.spy();
            disableSave = sinon.spy();
            const getWrapper = (component) => mount(
                <Provider store={createTestStore({initialState: actionStore.initialState})}>
                    {React.createElement(component, {
                        original: original,
                        enableSaveInModal: enableSave,
                        disableSaveInModal: disableSave,
                    })}
                </Provider>
            );

            wrapper = getWrapper(UpdateTimeForm);
        });

        afterEach(() => {
            wrapper.unmount();
        });

        const changeTime = (field, value) => {
            wrapper.find(`[name="${field}"]`).simulate('change', {target: {value}});
            wrapper.update();
        };

        const getDiff = () => wrapper.find(UpdateTimeComponent).instance().state.diff;

        it('displays a pending end time and submits it after the start time is entered', () => {
            changeTime('_endTime', '15:30');

            expect(wrapper.find('[name="_endTime"]').prop('value')).toBe('15:30');
            expect(getDiff().dates.all_day).toBe(true);
            expect(getDiff().dates.end.format('YYYY-MM-DD HH:mm')).toBe('2040-01-03 00:00');
            expect(getDiff()._endTime.format('HH:mm')).toBe('15:30');
            expect(disableSave.called).toBe(true);
            expect(wrapper.find(UpdateTimeComponent).instance().state.errors._startTime).toBeTruthy();

            changeTime('_endTime', '16:45');
            expect(wrapper.find('[name="_endTime"]').prop('value')).toBe('16:45');

            changeTime('_startTime', '09:15');
            const diff = getDiff();

            expect(diff.dates.all_day).toBe(false);
            expect(diff.dates.no_end_time).toBe(false);
            expect(diff.dates.start.format('YYYY-MM-DD HH:mm')).toBe('2040-01-02 09:15');
            expect(diff.dates.end.format('YYYY-MM-DD HH:mm')).toBe('2040-01-03 16:45');
            expect(wrapper.find('[name="_endTime"]').prop('value')).toBe('16:45');
            expect(enableSave.called).toBe(true);

            const updateEventTime = sinon.stub(actions.events.ui, 'updateEventTime')
                .returns(() => Promise.resolve());

            try {
                wrapper.find(UpdateTimeComponent).instance()
                    .submit();
                expect(updateEventTime.calledOnce).toBe(true);
                expect(updateEventTime.firstCall.args[0]).toBe(original);
                expect(updateEventTime.firstCall.args[1].dates).toEqual(diff.dates);
            } finally {
                updateEventTime.restore();
            }
        });

        it('clears a pending end time before transitioning out of all-day mode', () => {
            changeTime('_endTime', '15:30');
            wrapper.find('[name="_endTime"]').simulate('change', {target: {value: ''}});
            wrapper.find('[name="_endTime"]').simulate('blur');
            wrapper.update();

            expect(wrapper.find('[name="_endTime"]').prop('value')).toBe('');
            expect(getDiff()._endTime).toBeNull();

            changeTime('_startTime', '09:15');
            expect(getDiff().dates.all_day).toBe(false);
            expect(getDiff().dates.no_end_time).toBe(true);
            expect(getDiff().dates.end.format('YYYY-MM-DD HH:mm')).toBe('2040-01-03 00:00');
        });

        it('still supports entering the start time first', () => {
            changeTime('_startTime', '09:15');
            expect(getDiff().dates.no_end_time).toBe(true);

            changeTime('_endTime', '15:30');
            expect(getDiff().dates.all_day).toBe(false);
            expect(getDiff().dates.no_end_time).toBe(false);
            expect(getDiff().dates.end.format('YYYY-MM-DD HH:mm')).toBe('2040-01-03 15:30');
        });

        it('does not restore a pending end time after marking the time to be confirmed', () => {
            changeTime('_endTime', '15:30');
            wrapper.find(UpdateTimeComponent).instance()
                .handleToBeConfirmed();
            wrapper.update();

            expect(getDiff()._endTime).toBeNull();
            changeTime('_startTime', '09:15');
            expect(getDiff().dates.all_day).toBe(false);
            expect(getDiff().dates.no_end_time).toBe(true);
        });
    });

    describe('all-day updates in the event timezone', () => {
        let store;
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
            original.dates.no_end_time = true;
            original._startTime = null;
            original._endTime = null;
            actionStore.init();
            store = createTestStore({initialState: actionStore.initialState});
            enableSave = sinon.spy();
            disableSave = sinon.spy();
        });

        afterEach(() => {
            if (wrapper) {
                wrapper.unmount();
                wrapper = null;
            }
            localTimeZone.restore();
            moment.tz.setDefault('Australia/Sydney');
        });

        const mountEvent = (event) => {
            const getWrapper = (component) => mount(
                <Provider store={store}>
                    {React.createElement(component, {
                        original: event,
                        enableSaveInModal: enableSave,
                        disableSaveInModal: disableSave,
                    })}
                </Provider>
            );

            wrapper = getWrapper(UpdateTimeForm);
        };

        const enterTime = (field, value) => {
            wrapper.find(`[name="${field}"]`).simulate('change', {target: {value}});
            wrapper.update();
        };

        it('saves Toronto wall time as UTC and displays it on reopening', () => {
            mountEvent(original);
            enterTime('_startTime', '10:00');
            const diff = wrapper.find(UpdateTimeComponent).instance().state.diff;

            expect(diff.dates.start.toISOString()).toBe('2040-01-02T15:00:00.000Z');
            expect(diff.dates.end.toISOString()).toBe('2040-01-02T00:00:00.000Z');
            expect(diff.dates.no_end_time).toBe(true);
            expect(wrapper.find('[name="_startTime"]').prop('value')).toBe('10:00');
            expect(enableSave.called).toBe(true);

            const saved = cloneDeep(diff);

            convertEventDatesForTimezone(saved);
            wrapper.unmount();
            mountEvent(saved);
            expect(wrapper.find('[name="_startTime"]').prop('value')).toBe('10:00');
        });

        it('preserves pending end wall time when both inputs are entered before midnight', () => {
            mountEvent(original);
            enterTime('_endTime', '23:45');
            expect(wrapper.find('[name="_endTime"]').prop('value')).toBe('23:45');
            enterTime('_startTime', '23:30');
            const diff = wrapper.find(UpdateTimeComponent).instance().state.diff;

            expect(diff.dates.start.toISOString()).toBe('2040-01-03T04:30:00.000Z');
            expect(diff.dates.end.toISOString()).toBe('2040-01-03T04:45:00.000Z');
            expect(wrapper.find('[name="_endTime"]').prop('value')).toBe('23:45');
            expect(enableSave.called).toBe(true);
        });

        it('keeps the event-local day when changing a late start with a date-only end', () => {
            mountEvent(original);
            enterTime('_startTime', '23:30');
            enterTime('_startTime', '23:45');
            const diff = wrapper.find(UpdateTimeComponent).instance().state.diff;

            expect(diff.dates.start.toISOString()).toBe('2040-01-03T04:45:00.000Z');
            expect(diff.dates.start.clone().tz('America/Toronto')
                .format('YYYY-MM-DD')).toBe('2040-01-02');
            expect(diff.dates.end.toISOString()).toBe('2040-01-02T00:00:00.000Z');
            expect(diff.dates.no_end_time).toBe(true);
            expect(enableSave.called).toBe(true);
        });

        it('updates the displayed time even when it matches the previous UTC hour', () => {
            mountEvent(original);
            enterTime('_startTime', '10:00');
            enterTime('_startTime', '15:00');
            const diff = wrapper.find(UpdateTimeComponent).instance().state.diff;

            expect(diff.dates.start.toISOString()).toBe('2040-01-02T20:00:00.000Z');
            expect(wrapper.find('[name="_startTime"]').prop('value')).toBe('15:00');
        });

        it('uses the default timezone when the event has no timezone', () => {
            original.dates.tz = null;
            mountEvent(original);
            enterTime('_startTime', '10:00');
            const diff = wrapper.find(UpdateTimeComponent).instance().state.diff;

            expect(diff.dates.tz).toBe('Australia/Sydney');
            expect(diff.dates.start.toISOString()).toBe('2040-01-01T23:00:00.000Z');
            expect(diff.dates.end.toISOString()).toBe('2040-01-02T00:00:00.000Z');
            expect(wrapper.find('[name="_startTime"]').prop('value')).toBe('10:00');
        });
    });
});
