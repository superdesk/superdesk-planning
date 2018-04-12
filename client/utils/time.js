import moment from 'moment';

/**
 * Returns the start date/time of next week
 * @param {moment} date - The datetime for week calculations (defaults to now())
 * @param {int} startOfWeek - Configured start of the week (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @return {moment} Cloned moment instance of the start date/time of next week
 */
const getStartOfNextWeek = (date = null, startOfWeek = 0) => {
    let current = (date ? date.clone() : moment()).set({hour: 0, minute: 0, second: 0, millisecond: 0});
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
};

/**
 * Returns the start date/time of the previous week.
 * If the day != startOfWeek, returns the beginning of the current week
 * Otherwise it returns the date/time of the start of the previous week
 * @param {moment} date - The date/time for week calculations (defaults to now())
 * @param {int} startOfWeek - Configured start of the week (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @return {moment} Cloned moment instance of the start date/time of the previous week
 */
const getStartOfPreviousWeek = (date = null, startOfWeek = 0) => {
    let current = (date ? date.clone() : moment()).set({hour: 0, minute: 0, second: 0, millisecond: 0});
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
};

/**
 *  Returns the start date/time of the next month.
 * @param {moment} date - The date/time to calculate the next month from
 * @return {moment} Cloned moment instance of the start date/time of the next month
 */
const getStartOfNextMonth = (date = null) => {
    let current = (date ? date.clone() : moment()).set({hour: 0, minute: 0, second: 0, millisecond: 0});

    return current.add(1, 'M').date(1);
};

/**
 * Returns the start date/time of the previous month.
 * If the date is not the 1st, returns the beginning of the current month
 * Otherwise it returns the date/time of the start of the previous month
 * @param {moment} date - The date/time to calcualte the previous month from
 * @return {moment} Cloned moment instance of the start date/time of the previous month
 */
const getStartOfPreviousMonth = (date = null) => {
    let current = (date ? date.clone() : moment()).set({hour: 0, minute: 0, second: 0, millisecond: 0});

    return current.date() > 1 ?
        current.date(1) :
        current.subtract(1, 'M').date(1);
};

// eslint-disable-next-line consistent-this
const self = {
    getStartOfNextWeek,
    getStartOfPreviousWeek,
    getStartOfNextMonth,
    getStartOfPreviousMonth,
};

export default self;
