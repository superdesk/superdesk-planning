import React from 'react';
import {shallow} from 'enzyme';
import {EventScheduleInput} from './index';
import sinon from 'sinon';
import moment from 'moment';
import {cloneDeep} from 'lodash';

describe('<EventScheduleInput />', () => {
    let item;
    let diff;
    let onChange;
    let readOnly;
    let pristine;
    let showRepeat;
    let showRepeatSummary;

    beforeEach(() => {
        item = {dates: {}};
        diff = null;

        readOnly = pristine = false;
        showRepeat = showRepeatSummary = true;

        onChange = sinon.spy((field, value) => diff[field] = value);
    });

    const getShallowWrapper = () => shallow(
        <EventScheduleInput
            item={item}
            diff={diff || cloneDeep(item)}
            onChange={onChange}
            readOnly={readOnly}
            pristine={pristine}
            showRepeat={showRepeat}
            showRepeatSummary={showRepeatSummary}
            timeFormat="HH:mm"
            dateFormat="DD/MM/YYYY"
        />
    );

    it('detects a non recurring event', () => {
        item.dates = {
            start: '2016-10-15T13:01:11',
            end: '2016-10-15T14:01:11',
        };

        const wrapper = getShallowWrapper();

        expect(wrapper.state().doesRepeat).toBe(false);
    });

    it('detects a recurring event', () => {
        item.dates = {
            start: '2016-10-15T13:01:11',
            end: '2016-10-15T14:01:11',
            recurring_rule: {frequency: 'DAILY'},
        };

        const wrapper = getShallowWrapper();

        expect(wrapper.state().doesRepeat).toBe(true);
    });

    it('detects a non all day event', () => {
        item.dates = {
            start: '2016-10-15T13:01:11',
            end: '2016-10-15T14:01:11',
        };

        const wrapper = getShallowWrapper();

        expect(wrapper.state().isAllDay).toBe(false);
    });

    it('detects an all day event', () => {
        item.dates = {
            start: moment('2099-06-16T00:00'),
            end: moment('2099-06-16T23:59'),
        };

        const wrapper = getShallowWrapper();

        expect(wrapper.state().isAllDay).toBe(true);
    });
});
