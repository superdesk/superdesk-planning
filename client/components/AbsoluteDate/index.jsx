import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {DATE_FORMATS} from '../../constants';

/**
 * Display absolute date in <time> element
 *
 * Usage:
 * <AbsoluteDate date={historyItem._created} />
 *
 * Params:
 * param {object} date - datetime string in utc
 * param {string} noDateString - string to display if the date is not valid
 * param {string} className - The CSS class names to use in the parent time element
 */
export const AbsoluteDate = ({date, noDateString, className}) => {
    let momentDate = moment.utc(date);

    if (momentDate.isValid()) {
        const datetimeStr = momentDate.toISOString();

        let rday;
        let rdate;

        momentDate.local(); // switch to local time zone.

        if (moment().format(DATE_FORMATS.COMPARE_FORMAT) === momentDate.format(DATE_FORMATS.COMPARE_FORMAT)) {
            rday = momentDate.format(DATE_FORMATS.DISPLAY_TODAY_FORMAT);
        } else {
            rday = momentDate.format(DATE_FORMATS.DISPLAY_DAY_FORMAT);
        }

        if (moment().format('YYYY') === momentDate.format('YYYY')) {
            rdate = momentDate.format(DATE_FORMATS.DISPLAY_CDATE_FORMAT);
        } else {
            rdate = momentDate.format(DATE_FORMATS.DISPLAY_DATE_FORMAT);
        }

        return <time className={className} dateTime={datetimeStr}>
            <span>{rday + rdate}</span>
        </time>;
    }

    return <time className={className}>
        <span>{noDateString}</span>
    </time>;
};

AbsoluteDate.propTypes = {
    date: PropTypes.string,
    noDateString: PropTypes.string,
    className: PropTypes.string,
};
