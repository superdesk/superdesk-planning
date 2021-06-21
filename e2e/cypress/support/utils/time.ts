import moment from 'moment-timezone';

export function getStartOfNextWeek(): moment.Moment {
    const startOfWeek = 0;
    let current = (moment.tz('Australia/Sydney')).set({
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0,
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

export const getDateStringFor = {
    today: () => moment
        .tz('Australia/Sydney')
        .set({hour: 0})
        .utc()
        .format('YYYY-MM-DD'),
    yesterday: () => moment
        .tz('Australia/Sydney')
        .set({hour: 0})
        .utc()
        .subtract(1, 'd')
        .format('YYYY-MM-DD'),
    tomorrow: () => moment
        .tz('Australia/Sydney')
        .set({hour: 0})
        .utc()
        .add(1, 'd')
        .format('YYYY-MM-DD'),
    next_week: () => getStartOfNextWeek()
        .format('YYYY-MM-DD'),
};

export function getTimeStringForHour(hour: number): string {
    return moment()
        .tz('Australia/Sydney')
        .set({hour: hour})
        .utc()
        .format('THH:00:00+0000');
}

export const TIME_STRINGS = {
    0: getTimeStringForHour(0),
    1: getTimeStringForHour(1),
    2: getTimeStringForHour(2),
};
