import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {DATE_FORMATS} from '../../constants';
import {TextInput} from '../UI/Form';

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
export const AbsoluteDate = ({date, noDateString, className, asTextInput, ...props}) => {
    let momentDate = moment.utc(date);
    let timeStr = '';
    let spanStr = noDateString;

    if (momentDate.isValid()) {
        timeStr = momentDate.toISOString();
        momentDate.local(); // switch to local time zone.

        if (moment().format(DATE_FORMATS.COMPARE_FORMAT) === momentDate.format(DATE_FORMATS.COMPARE_FORMAT)) {
            spanStr = momentDate.format(DATE_FORMATS.DISPLAY_TODAY_FORMAT);
        } else {
            spanStr = momentDate.format(DATE_FORMATS.DISPLAY_DAY_FORMAT);
        }

        if (moment().format('YYYY') === momentDate.format('YYYY')) {
            spanStr += momentDate.format(DATE_FORMATS.DISPLAY_CDATE_FORMAT);
        } else {
            spanStr += momentDate.format(DATE_FORMATS.DISPLAY_DATE_FORMAT);
        }
    }

    return !asTextInput ? (
        <time className={className} dateTime={timeStr}>
            <span>{spanStr}</span>
        </time>
    ) : (
        <TextInput className={className} value={spanStr} {...props}/>
    );
};

AbsoluteDate.propTypes = {
    date: PropTypes.string,
    noDateString: PropTypes.string,
    className: PropTypes.string,
    asTextInput: PropTypes.bool,
};

AbsoluteDate.defaultProps = {asTextInput: false};
