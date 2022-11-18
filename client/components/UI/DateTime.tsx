import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import {appConfig} from 'appConfig';
import {superdeskApi} from '../../superdeskApi';

import './style.scss';

/**
 * @ngdoc react
 * @name DateTime
 * @description DateTime component to display text formatted date and time
 */
function DateTime({
    date,
    withTime,
    withDate,
    withYear,
    padLeft,
    toBeConfirmed,
    allDay,
    isEndEventDateTime,
    noEndTime,
    setHideDash,
    multiDay,
}) {
    const {gettext} = superdeskApi.localization;
    const dateFormat = appConfig.planning.dateformat;
    const timeFormat = appConfig.planning.timeformat;
    const newTimeFormat = toBeConfirmed
        ? `[${gettext(`Time ${gettext('TBC')}`)}]`
        : timeFormat;
    let format = withYear
        ? dateFormat
        : dateFormat.replace(/([\/\#.-]y+)|(y+[\/\#.-])/gi, '');
    let dateTimeFormat = [
        withDate ? format : null,
        withTime ? newTimeFormat : null,
    ]
        .filter((d) => d)
        .join('\u00a0'); // &nbsp;

    let eventEndDate;

    if (noEndTime && !multiDay) {
        eventEndDate = null;
        setHideDash && setHideDash(true);
    } else if (allDay && multiDay) {
        eventEndDate = moment(date).format(dateTimeFormat)
            .slice(0, 5) || '';
    } else if (noEndTime && multiDay) {
        eventEndDate = moment(date).format(dateTimeFormat)
            .slice(0, 5) || '';
    } else if (allDay && !multiDay) {
        setHideDash && setHideDash(true);
    }

    let eventStartDate;

    if (allDay && multiDay) {
        eventStartDate = moment(date).format(dateTimeFormat)
            .slice(0, -5);
    } else {
        eventStartDate = moment(date).format(dateTimeFormat);
    }

    return (
        <time className={!padLeft ? 'Datetime' : null} title={'date.toString()'}>
            {!isEndEventDateTime && eventStartDate}
            {isEndEventDateTime && (eventEndDate || eventEndDate == null)
                ? eventEndDate
                : ''}
        </time>
    );
}

DateTime.propTypes = {
    date: PropTypes.oneOfType([PropTypes.object, PropTypes.string]).isRequired,
    withTime: PropTypes.bool,
    withYear: PropTypes.bool,
    withDate: PropTypes.bool,
    padLeft: PropTypes.bool,
    toBeConfirmed: PropTypes.bool,
    allDay: PropTypes.bool,
    isEndEventDateTime: PropTypes.bool,
    noEndTime: PropTypes.bool,
    setHideDash: PropTypes.func,
    multiDay: PropTypes.bool,
};

DateTime.defaultProps = {
    withTime: true,
    withDate: true,
    withYear: true,
    padLeft: false,
};

export default DateTime;
