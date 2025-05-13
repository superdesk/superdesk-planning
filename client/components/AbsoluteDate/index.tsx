import React from 'react';
import moment from 'moment';
import {DATE_FORMATS} from '../../constants';
import {TextInput} from '../UI/Form';

interface AbsoluteDateProps extends React.HTMLAttributes<HTMLElement> {
    date?: string;
    noDateString?: string;
    className?: string;
    asTextInput?: boolean;
    toBeConfirmed?: boolean;
}

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
export const AbsoluteDate: React.FC<AbsoluteDateProps> = ({
    date,
    noDateString = '',
    className,
    asTextInput = false,
    toBeConfirmed,
    ...props
}) => {
    let momentDate = moment.utc(date);
    let timeStr = '';
    let spanStr = noDateString;

    if (momentDate.isValid()) {
        timeStr = momentDate.toISOString();
        momentDate.local(); // switch to local time zone.

        if (
            moment().format(DATE_FORMATS.COMPARE_FORMAT) ===
            momentDate.format(DATE_FORMATS.COMPARE_FORMAT)
        ) {
            spanStr = momentDate.format(DATE_FORMATS.DISPLAY_TODAY_FORMAT);
        } else {
            spanStr = momentDate.format(DATE_FORMATS.DISPLAY_DAY_FORMAT);
        }

        if (moment().format('YYYY') === momentDate.format('YYYY')) {
            spanStr += toBeConfirmed
                ? momentDate.format(DATE_FORMATS.DISPLAY_CDATE_TBC_FORMAT)
                : momentDate.format(DATE_FORMATS.DISPLAY_CDATE_FORMAT);
        } else {
            spanStr += toBeConfirmed
                ? momentDate.format(DATE_FORMATS.DISPLAY_TBC_FORMAT)
                : momentDate.format(DATE_FORMATS.DISPLAY_DATE_FORMAT);
        }
    }

    if (!asTextInput) {
        return (
            <time className={className} dateTime={timeStr}>
                <span>{spanStr}</span>
            </time>
        );
    }

    return <TextInput className={className} value={spanStr} {...props} />;
};
