import {superdeskApi} from '../superdeskApi';
import {ISearchFilterSchedule, SCHEDULE_FREQUENCY} from '../interfaces';
import {IDesk} from 'superdesk-api';

export function getSearchFilterScheduleText(schedule: ISearchFilterSchedule, desks: {[key: string]: IDesk}) {
    const {gettext} = superdeskApi.localization;
    const deskName = desks[schedule.desk]?.name;
    let frequency = schedule.frequency;

    if (schedule.frequency === SCHEDULE_FREQUENCY.WEEKLY && schedule.week_days.length === 7) {
        frequency = SCHEDULE_FREQUENCY.DAILY;
    }

    const args = {
        desk: deskName,
        time: translateHour(schedule.hour),
        day: translateMonthDay(schedule.day),
    };

    const constructText = {
        [SCHEDULE_FREQUENCY.HOURLY]: () => (
            gettext('Hourly to {{ desk }}', args)
        ),
        [SCHEDULE_FREQUENCY.DAILY]: () => (
            gettext('Daily @ {{ time }} to {{ desk }}', args)
        ),
        [SCHEDULE_FREQUENCY.WEEKLY]: () => (
            gettext('Weekly @ {{ time }} to {{ desk }}', args)
        ),
        [SCHEDULE_FREQUENCY.MONTHLY]: () => (
            gettext('Monthly on the {{ day }} day @ {{ time }} to {{ desk }}', args)
        ),
    };

    return constructText[frequency]();
}

export function translateMonthDay(hour: number) {
    const {gettext} = superdeskApi.localization;

    switch (hour) {
    case 1:
        return gettext('First');
    case 2:
        return gettext('2nd');
    case 3:
        return gettext('3rd');
    case 4:
        return gettext('4th');
    case 5:
        return gettext('5th');
    case 6:
        return gettext('6th');
    case 7:
        return gettext('7th');
    case 8:
        return gettext('8th');
    case 9:
        return gettext('9th');
    case 10:
        return gettext('10th');
    case 11:
        return gettext('11th');
    case 12:
        return gettext('12th');
    case 13:
        return gettext('13th');
    case 14:
        return gettext('14th');
    case 15:
        return gettext('15th');
    case 16:
        return gettext('16th');
    case 17:
        return gettext('70th');
    case 18:
        return gettext('108h');
    case 19:
        return gettext('19th');
    case 20:
        return gettext('20th');
    case 21:
        return gettext('21st');
    case 22:
        return gettext('22nd');
    case 23:
        return gettext('23rd');
    case 24:
        return gettext('24th');
    case 25:
        return gettext('25th');
    case 26:
        return gettext('26th');
    case 27:
        return gettext('27th');
    case 28:
        return gettext('28th');
    case 29:
        return gettext('Last');
    }

    return '';
}

export function translateHour(hour: number) {
    const {gettext} = superdeskApi.localization;

    switch (hour) {
    case -1:
        return gettext('Every Hour');
    case 0:
        return gettext('12:00am');
    case 1:
        return gettext('01:00am');
    case 2:
        return gettext('02:00am');
    case 3:
        return gettext('03:00am');
    case 4:
        return gettext('04:00am');
    case 5:
        return gettext('05:00am');
    case 6:
        return gettext('06:00am');
    case 7:
        return gettext('07:00am');
    case 8:
        return gettext('08:00am');
    case 9:
        return gettext('09:00am');
    case 10:
        return gettext('10:00am');
    case 11:
        return gettext('11:00am');
    case 12:
        return gettext('12:00pm');
    case 13:
        return gettext('01:00pm');
    case 14:
        return gettext('02:00pm');
    case 15:
        return gettext('03:00pm');
    case 16:
        return gettext('04:00pm');
    case 17:
        return gettext('05:00pm');
    case 18:
        return gettext('06:00pm');
    case 19:
        return gettext('07:00pm');
    case 20:
        return gettext('08:00pm');
    case 21:
        return gettext('09:00pm');
    case 22:
        return gettext('10:00pm');
    case 23:
        return gettext('11:00pm');
    }

    return '';
}
