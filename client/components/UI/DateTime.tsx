import React from 'react';
import moment from 'moment';

import {appConfig} from 'appConfig';
import {superdeskApi} from '../../superdeskApi';
import {timeUtils} from '../../utils';

import './style.scss';
import {IDateTime} from 'interfaces';

interface IPropsDateTime {
    date: IDateTime,
    withTime?: boolean,
    withYear?: boolean,
    withDate?: boolean,
    padLeft?: boolean,
    toBeConfirmed?: boolean,
    isFullDay?: boolean,
    isEndEventDateTime?: boolean,
    noEndTime?: boolean,
    multiDay?: boolean,
}

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
}: IPropsDateTime) {
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
        eventStartDate = moment(date).format(dateFormat);
    } else if (noEndTime) {
        eventStartDate = moment(date).format(dateTimeFormat);
    } else {
        eventStartDate = moment(date).format(dateTimeFormat);
    }

    let eventEndDate;

    if ((noEndTime || isFullDay) && !multiDay) {
        eventEndDate = null;
    } else if ((noEndTime || isFullDay) && multiDay) {
        eventEndDate = moment(date).format(dateFormat);
    } else {
        eventEndDate = moment(date).format(dateTimeFormat);
    }

    const displayDate = !isEndEventDateTime ? eventStartDate : eventEndDate;
    const tz = timeUtils.getTimeZoneAbbreviation(date.format('z')) + ' ';

    return (
        <time className={!padLeft ? 'Datetime' : null} title={tz + displayDate}>
            {displayDate}
        </time>
    );
}

export default DateTime;
