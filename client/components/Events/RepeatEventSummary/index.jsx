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
                MO: 'Monday',
                TU: 'Tuesday',
                WE: 'Wednesday',
                TH: 'Thursday',
                FR: 'Friday',
                SA: 'Saturday',
                SU: 'Sunday',
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
            const duration = frequency === 'DAILY' ? 'days' :
                frequency.replace('LY', 's').toLowerCase();

            prefix = 'Every ' + interval + ' ' + duration;
        } else if (frequency) {
            const f = frequency;

            prefix = f === 'YEARLY' ? 'Annualy' : (f.charAt(0).toUpperCase() + f.slice(1).toLowerCase());
        }

        return prefix;
    };

    const getStemText = () => {
        let stemText = '';
        const days = getDaysFromByDays();

        switch (frequency) {
        case 'WEEKLY':
            stemText = days && days.length > 0 ? ('on ' + days.join(', ')) : '';
            break;
        case 'MONTHLY':
            stemText = startDate ? ('on day ' + startDate.format('D')) : '';
            break;
        case 'YEARLY':
            stemText = startDate ? ('on ' + startDate.format('MMM D')) : '';
            break;
        }
        return stemText;
    };

    const getSuffix = () => {
        let suffix = '';

        if (endRepeatMode === 'count' && parseInt(count, 10) > 0) {
            suffix = ', ' + count + ' times';
        } else if (endRepeatMode === 'until' && until && until.isValid()) {
            suffix = ', until ' + until.format('D MMM YYYY');
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
    noMargin: false
};
