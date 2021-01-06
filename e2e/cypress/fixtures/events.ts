import {getDateStringFor} from '../support/utils/time';

const BASE_EVENT = {
    type: 'event',
    occur_status: {
        name: 'Planned, occurs certainly',
        label: 'Confirmed',
        qcode: 'eocstat:eos5',
    },
    state: 'draft',
};

export const TEST_EVENTS = {
    draft: {
        ...BASE_EVENT,
        dates: {
            start: '2045-12-11T13:00:00+0000',
            end: '2045-12-11T14:00:00+0000',
            tz: 'Australia/Sydney',
        },
        name: 'Test',
        slugline: 'Original',
        anpa_category: [
            {name: 'Overseas Sport', qcode: 's'},
            {name: 'International News', qcode: 'i'},
        ],
        subject: [
            {qcode: '01001000', name: 'archaeology', parent: '01000000'},
            {qcode: '01011000', name: 'music', parent: '01000000'},
        ],
        calendars: [
            {qcode: 'sport', name: 'Sport'},
        ],
    },
    spiked: {
        ...BASE_EVENT,
        dates: {
            start: '2045-12-11T13:00:00+0000',
            end: '2045-12-11T14:00:00+0000',
            tz: 'Australia/Sydney',
        },
        state: 'spiked',
        name: 'Spiker',
        slugline: 'Spiked',
    },
    date_01_02_2045: {
        ...BASE_EVENT,
        dates: {
            start: '2045-01-31T13:00:00+0000',
            end: '2045-01-31T14:00:00+0000',
            tz: 'Australia/Sydney',
        },
        name: 'February 1st 2045',
        slugline: 'Event Feb 1',
    },
    date_02_02_2045: {
        ...BASE_EVENT,
        dates: {
            start: '2045-02-01T13:00:00+0000',
            end: '2045-02-01T14:00:00+0000',
            tz: 'Australia/Sydney',
        },
        name: 'February 2nd 2045',
        slugline: 'Event Feb 2',
    },
    date_03_02_2045: {
        ...BASE_EVENT,
        dates: {
            start: '2045-02-02T13:00:00+0000',
            end: '2045-02-02T14:00:00+0000',
            tz: 'Australia/Sydney',
        },
        name: 'February 3rd 2045',
        slugline: 'Event Feb 3',
    },
    date_04_02_2045: {
        ...BASE_EVENT,
        dates: {
            start: '2045-02-03T13:00:00+0000',
            end: '2045-02-03T14:00:00+0000',
            tz: 'Australia/Sydney',
        },
        name: 'February 4th 2045',
        slugline: 'Event Feb 4',
    },
};

function getEventForDate(dateString: string, metadata: {[key: string]: any} = {}) {
    return {
        ...BASE_EVENT,
        dates: {
            start: dateString + 'T13:00:00+0000',
            end: dateString + 'T14:00:00+0000',
            tz: 'Australia/Sydney',
        },
        ...metadata,
    };
}

export const createEventFor = {
    today: (metadata = {}) => getEventForDate(getDateStringFor.today(), metadata),
    tomorrow: (metadata = {}) => getEventForDate(getDateStringFor.tomorrow(), metadata),
    yesterday: (metadata = {}) => getEventForDate(getDateStringFor.yesterday(), metadata),
    next_week: (metadata = {}) => getEventForDate(getDateStringFor.next_week(), metadata),
};
