import moment from 'moment-timezone';

import {appConfig} from 'appConfig';
import {IEventItem} from '../interfaces';

import {TIME_COMPARISON_GRANULARITY} from '../constants';

/**
 * Returns the start date/time of next week
 * @param {moment} date - The datetime for week calculations (defaults to now())
 * @param {int} startOfWeek - Configured start of the week (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @return {moment} Cloned moment instance of the start date/time of next week
 */
function getStartOfNextWeek(date: moment.Moment = null, startOfWeek: number = 0): moment.Moment {
    let current = (date ? date.clone() : moment()).set({
        [TIME_COMPARISON_GRANULARITY.HOUR]: 0,
        [TIME_COMPARISON_GRANULARITY.MINUTE]: 0,
        [TIME_COMPARISON_GRANULARITY.SECOND]: 0,
        [TIME_COMPARISON_GRANULARITY.MILLISECOND]: 0,
    });
    let weekDay = current.isoWeekday();

    // If the day is Sunday, then change this to 0
    // This is the same format the startOfWeek config uses
    weekDay = weekDay === 7 ? 0 : weekDay;

    const diff = weekDay < startOfWeek ?
        // If the weekDay is before the start of the week,
        // then jump forward the difference of the two
        startOfWeek - weekDay :

        // Otherwise jump forward the remaining amount till next week
        7 - weekDay + startOfWeek;

    return current.add(diff, 'd');
}

/**
 * Returns the start date/time of the previous week.
 * If the day != startOfWeek, returns the beginning of the current week
 * Otherwise it returns the date/time of the start of the previous week
 * @param {moment} date - The date/time for week calculations (defaults to now())
 * @param {int} startOfWeek - Configured start of the week (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @return {moment} Cloned moment instance of the start date/time of the previous week
 */
function getStartOfPreviousWeek(date: moment.Moment = null, startOfWeek: number = 0): moment.Moment {
    let current = (date ? date.clone() : moment()).set({
        [TIME_COMPARISON_GRANULARITY.HOUR]: 0,
        [TIME_COMPARISON_GRANULARITY.MINUTE]: 0,
        [TIME_COMPARISON_GRANULARITY.SECOND]: 0,
        [TIME_COMPARISON_GRANULARITY.MILLISECOND]: 0,
    });
    let weekDay = current.isoWeekday();
    let diff = 7;

    // If the day is Sunday, then change this to 0
    // This is the same format the startOfWeek config uses
    weekDay = weekDay === 7 ? 0 : weekDay;

    if (weekDay > startOfWeek) {
        diff = weekDay - startOfWeek;
    } else if (weekDay < startOfWeek) {
        diff = 7 - startOfWeek + weekDay;
    }

    return current.subtract(diff, 'd');
}

/**
 *  Returns the start date/time of the next month.
 * @param {moment} date - The date/time to calculate the next month from
 * @return {moment} Cloned moment instance of the start date/time of the next month
 */
function getStartOfNextMonth(date: moment.Moment = null): moment.Moment {
    let current = (date ? date.clone() : moment()).set({
        [TIME_COMPARISON_GRANULARITY.HOUR]: 0,
        [TIME_COMPARISON_GRANULARITY.MINUTE]: 0,
        [TIME_COMPARISON_GRANULARITY.SECOND]: 0,
        [TIME_COMPARISON_GRANULARITY.MILLISECOND]: 0,
    });

    return current.add(1, 'M').date(1);
}

/**
 * Returns the start date/time of the previous month.
 * If the date is not the 1st, returns the beginning of the current month
 * Otherwise it returns the date/time of the start of the previous month
 * @param {moment} date - The date/time to calcualte the previous month from
 * @return {moment} Cloned moment instance of the start date/time of the previous month
 */
function getStartOfPreviousMonth(date: moment.Moment = null): moment.Moment {
    let current = (date ? date.clone() : moment()).set({
        [TIME_COMPARISON_GRANULARITY.HOUR]: 0,
        [TIME_COMPARISON_GRANULARITY.MINUTE]: 0,
        [TIME_COMPARISON_GRANULARITY.SECOND]: 0,
        [TIME_COMPARISON_GRANULARITY.MILLISECOND]: 0,
    });

    return current.date() > 1 ?
        current.date(1) :
        current.subtract(1, 'M').date(1);
}

function isEventInDifferentTimeZone(event: Partial<IEventItem>): boolean {
    const dateInEventTimeZone = getDateInRemoteTimeZone(event?.dates?.start, event?.dates?.tz);
    const dateInLocalTimeZone = getDateInRemoteTimeZone(event?.dates?.start);

    return dateInEventTimeZone.format('Z') !== dateInLocalTimeZone.format('Z');
}

function localTimeZone(): string {
    return moment.tz.guess();
}

function getDateInRemoteTimeZone(date: moment.Moment, tz: string = self.localTimeZone()): moment.Moment {
    let dateToCheck;

    if (!date) {
        dateToCheck = moment();
    } else {
        dateToCheck = moment.isMoment(date) ? date : moment(date);
    }

    return moment.tz(dateToCheck.clone().utc(), tz);
}

function getLocalDate(date: moment.Moment, tz: string): moment.Moment {
    const isRemoteTimeZone = self.isEventInDifferentTimeZone({dates: {start: date, tz: tz}});

    return self.getDateInRemoteTimeZone(
        date,
        isRemoteTimeZone ? self.localTimeZone() : tz
    );
}

/**
 * if only offset is available then prefix timezone string with GMT. GMT+04
 * @param timezone
 * @returns {*}
 */
function getTimeZoneAbbreviation(timezone: string): string {
    if (timezone.match(/[+-]\d{0,4}/)) {
        return `GMT${timezone}`;
    }
    return timezone;
}

function getDateForVersionInList(date: moment.Moment | string, tz?: string): string {
    const timezone = tz ?? localTimeZone();
    const localDate = moment.tz(date, timezone);
    const localNow = moment.tz(timezone);
    const shortTimeFormat = appConfig.shortTimeFormat || 'hh:mm';
    const shortDateFormat = appConfig.shortDateFormat || 'DD.MM';
    const dateFormat = appConfig.view.dateformat || 'DD.MM.YYYY';

    if (localDate.isSame(localNow, 'day')) {
        return localDate.format(shortTimeFormat);
    } else if (localDate.isSame(localNow, 'year')) {
        return localDate.format(shortDateFormat + ' @ ' + shortTimeFormat);
    }

    return localDate.format(dateFormat + ' @ ' + shortTimeFormat);
}

// eslint-disable-next-line consistent-this
const self = {
    getStartOfNextWeek,
    getStartOfPreviousWeek,
    getStartOfNextMonth,
    getStartOfPreviousMonth,
    isEventInDifferentTimeZone,
    localTimeZone,
    getDateInRemoteTimeZone,
    getLocalDate,
    getTimeZoneAbbreviation,
    getDateForVersionInList,
};

export default self;
