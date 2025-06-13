import React from 'react';
import moment from 'moment';
import {DATE_FORMATS} from '../../constants';
import {TextInput} from '../UI/Form';

interface AbsoluteDateProps extends React.HTMLAttributes<HTMLElement> {
    // datetime string in utc
    date?: string;

    // string to display if the date is not valid
    noDateString?: string;

    // The CSS class names to use in the parent time element
    className?: string;

    // show text input instead of time
    asTextInput?: boolean;

    // show to be confirmed text
    toBeConfirmed?: boolean;
}

export const AbsoluteDate: React.FC<AbsoluteDateProps> = ({
    date,
    noDateString = '',
    className,
    asTextInput = false,
    toBeConfirmed,
    ...props
}: AbsoluteDateProps) => {
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
