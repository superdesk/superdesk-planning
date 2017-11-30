import React from 'react';
import {mount} from 'enzyme';
import {AbsoluteDate} from '../index';
import {createTestStore} from '../../utils';
import {Provider} from 'react-redux';
import moment from 'moment';
import {DATE_FORMATS} from '../../constants';

describe('<AbsoluteDate />', () => {
    // Decides day format for matcher toBe use
    function getDayFormat(date) {
        let dayFormat;

        if (moment.utc().format(DATE_FORMATS.COMPARE_FORMAT) === moment.utc(date).format(DATE_FORMATS.COMPARE_FORMAT)) {
            dayFormat = DATE_FORMATS.DISPLAY_TODAY_FORMAT;
        } else {
            dayFormat = DATE_FORMATS.DISPLAY_DAY_FORMAT;
        }

        return dayFormat;
    }

    // Decides date format for matcher toBe use
    function getDateFormat(date) {
        let dateFormat;

        if (moment().format('YYYY') === moment.utc(date).format('YYYY')) {
            dateFormat = DATE_FORMATS.DISPLAY_CDATE_FORMAT;
        } else {
            dateFormat = DATE_FORMATS.DISPLAY_DATE_FORMAT;
        }

        return dateFormat;
    }

    function renderAbsoluteDateToText(date) {
        const store = createTestStore();
        const wrapper = mount(
            <Provider store={store}>
                <AbsoluteDate date={date}/>
            </Provider>
        );

        return wrapper.text();
    }

    it('renders a absolute date for Given date', () => {
        const date = '2017-06-27T01:40:36+0000';

        expect(renderAbsoluteDateToText(date))
            .toBe(
                moment.utc(date).local()
                    .format(getDayFormat(date)) +
            moment.utc(date).local()
                .format(getDateFormat(date))
            );
    });

    it('renders a absolute date for Today date', () => {
        const date = moment.utc().format();

        expect(renderAbsoluteDateToText(date))
            .toBe(
                moment.utc(date).local()
                    .format(getDayFormat(date)) +
            moment.utc(date).local()
                .format(getDateFormat(date))
            );
    });
});
