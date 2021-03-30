import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import classNames from 'classnames';

import {appConfig} from 'appConfig';

import {timeUtils} from '../../utils';
import './style.scss';

function Datetime({date, withTime, withDate, withYear, darkText, tz, isRemoteTimeZone}) {
    let format = withYear ? appConfig.planning.dateformat : appConfig.planning.dateformat.replace(/y/gi, '');
    let dateTimeFormat = [
        withDate ? format : null,
        withTime ? appConfig.planning.timeformat : null,
    ].filter((d) => d).join('\u00a0'); // &nbsp;
    const localTz = timeUtils.localTimeZone();
    const momentDate = moment(date);
    const newDate = timeUtils.getDateInRemoteTimeZone(momentDate, tz || localTz);
    const newDateString = isRemoteTimeZone ? `(${moment.tz(tz).format('z')}) ${newDate.format(dateTimeFormat)}` : '';

    return (
        <p>
            <time
                title={date.toString()}
                className={classNames(
                    'Datetime',
                    {'Datetime--dark-text': darkText}
                )}
            >
                {momentDate.format(dateTimeFormat)}
            </time>
            {isRemoteTimeZone && (
                <time
                    title={newDateString}
                    className={classNames(
                        'Datetime',
                        {'Datetime--dark-text': darkText}
                    )}
                >
                    <br />
                    {newDateString}
                </time>
            )}
        </p>
    );
}

Datetime.propTypes = {
    date: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.string,
    ]).isRequired,
    withTime: PropTypes.bool,
    withYear: PropTypes.bool,
    withDate: PropTypes.bool,
    darkText: PropTypes.bool,
    tz: PropTypes.string,
    isRemoteTimeZone: PropTypes.bool,
};

Datetime.defaultProps = {
    withTime: true,
    withDate: true,
    withYear: true,
    darkText: false,
    isRemoteTimeZone: false,
};

export default Datetime;
