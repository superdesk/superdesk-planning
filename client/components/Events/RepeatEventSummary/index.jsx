import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {gettext} from '../../../utils';

import {Label, LineInput} from '../../UI/Form';

export const RepeatEventSummary = ({
    byDay,
    interval,
    frequency,
    endRepeatMode,
    until,
    count,
    startDate,
    noMargin,
    forUpdating,
}) => {
    const getDaysFromByDays = () => {
        let byDays = '';

        if (byDay && byDay.length > 0) {
            byDays = byDay;
        } else if (startDate) {
            byDays = startDate.format('dd').toUpperCase();
        }

        if (byDays) {
            const days = {
                MO: gettext('Monday'),
                TU: gettext('Tuesday'),
                WE: gettext('Wednesday'),
                TH: gettext('Thursday'),
                FR: gettext('Friday'),
                SA: gettext('Saturday'),
                SU: gettext('Sunday'),
            };

            let dayNames = [];

            byDays.split(' ').forEach((day) => {
                dayNames.push(days[day]);
            });
            return dayNames;
        }
    };

    const getPrefix = () => {
        let prefix = '';

        if (interval > 1) {
            let duration = '';

            switch (frequency) {
            case 'DAILY':
                duration = gettext('days');
                break;

            case 'WEEKLY':
                duration = gettext('weeks');
                break;

            case 'MONTHLY':
                duration = gettext('months');
                break;

            case 'YEARLY':
                duration = gettext('years');
                break;
            }

            prefix = gettext('Every') + ' ' + interval + ' ' + duration;
        } else if (frequency) {
            switch (frequency) {
            case 'DAILY':
                prefix = gettext('Daily');
                break;

            case 'WEEKLY':
                prefix = gettext('Weekly');
                break;

            case 'MONTHLY':
                prefix = gettext('Monthly');
                break;

            case 'YEARLY':
                prefix = gettext('Annualy');
                break;
            }
        }

        return prefix;
    };

    const getStemText = () => {
        let stemText = '';
        const days = getDaysFromByDays();

        switch (frequency) {
        case 'WEEKLY':
            stemText = days && days.length > 0 ? (gettext('on') + ' ' + days.join(', ')) : '';
            break;
        case 'MONTHLY':
            stemText = startDate ? (gettext('on day') + ' ' + startDate.format('D')) : '';
            break;
        case 'YEARLY':
            stemText = startDate ? (gettext('on') + ' ' + startDate.format('MMM D')) : '';
            break;
        }
        return stemText;
    };

    const getSuffix = () => {
        let suffix = '';

        if (endRepeatMode === 'count' && parseInt(count, 10) > 0) {
            suffix = ', ' + count + ' ' + gettext('times');
        } else if (endRepeatMode === 'until' && until && until.isValid()) {
            suffix = ', ' + gettext('until') + ' ' + until.format('D MMM YYYY');
        }

        return suffix;
    };

    const getRepeatSummary = () => {
        const stemText = getStemText();

        return getPrefix() + (stemText !== '' ? (' ' + stemText) : '') + getSuffix();
    };

    return (
        <LineInput noMargin={noMargin}>
            <Label text={forUpdating ? gettext('Current Repeat Summary') :
                gettext('Repeat Summary')} row={true} light={true} />
            <p className="sd-text__strong">{getRepeatSummary()}</p>
        </LineInput>
    );
};

RepeatEventSummary.propTypes = {
    byDay: PropTypes.string,
    interval: PropTypes.number,
    frequency: PropTypes.string,
    endRepeatMode: PropTypes.string,
    until: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.instanceOf(moment),
    ]),
    count: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
    ]),
    startDate: PropTypes.object,
    noMargin: PropTypes.bool,
    forUpdating: PropTypes.bool,
};

RepeatEventSummary.defaultProps = {
    noMargin: false,
};
