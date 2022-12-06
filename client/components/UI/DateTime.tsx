import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import {appConfig} from 'appConfig';
import {superdeskApi} from '../../superdeskApi';
import {timeUtils} from '../../utils';

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
    isFullDay,
    isEndEventDateTime,
    noEndTime,
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

    let eventStartDate;

    if (isFullDay) {
        eventStartDate = moment.utc(date).format(dateFormat);
    } else if (noEndTime) {
        eventStartDate = moment(date).format(dateTimeFormat);
    } else {
        eventStartDate = moment(date).format(dateTimeFormat);
    }

    let eventEndDate;

    if ((noEndTime || isFullDay) && !multiDay) {
        eventEndDate = null;
    } else if ((noEndTime || isFullDay) && multiDay) {
        eventEndDate = moment.utc(date).format(dateFormat);
    } else {
        eventEndDate = moment(date).format(dateTimeFormat);
    }

    const startDate = !isEndEventDateTime && eventStartDate;
    const endDate = isEndEventDateTime && eventEndDate;
    const tz = timeUtils.getTimeZoneAbbreviation(date.format('z')) + ' ';

    return (
        <time className={!padLeft ? 'Datetime' : null} title={tz + (startDate || endDate)}>
            {startDate}{endDate}
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
    isFullDay: PropTypes.bool,
    isEndEventDateTime: PropTypes.bool,
    noEndTime: PropTypes.bool,
    multiDay: PropTypes.bool,
};

DateTime.defaultProps = {
    withTime: true,
    withDate: true,
    withYear: true,
    padLeft: false,
};

export default DateTime;
