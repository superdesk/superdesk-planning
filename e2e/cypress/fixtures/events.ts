import {getDateStringFor, TIME_STRINGS} from '../support/utils/time';

export const LOCATIONS = {
    sydney_opera_house: {
        guid: 'urn:newsml:localhost:5000:2021-02-12T15:32:23.084235:e7d57d5d-2b07-4937-9a1b-db81a3c5dcdc',
        name: 'Sydney Opera House',
        address: {
            area: 'Sydney',
            country: 'Australia',
            line: ['2 Macquarie Street'],
            locality: 'New South Wales',
            postal_code: '2000',
            type: 'arts_centre',
        },
        type: 'Unclassified',
        unique_name: 'Sydney Opera House 2 Macquarie Street, Sydney, New South Wales, 2000, Australia',
    },
    woy_woy_train_station: {
        guid: 'urn:newsml:localhost:5000:2021-02-12T15:43:25.134704:f20fb2e4-f44d-4cca-83cb-b11983678543',
        name: 'Woy Woy Train Station',
        address: {
            area: 'Woy Woy',
            country: 'Australia',
            line: ['Railway Street'],
            locality: 'New South Wales',
            postal_code: '2256',
            type: 'roof'
        },
        type: 'Unclassified',
        unique_name: 'Woy Woy Train Station, Railway Street, Woy Woy, New South Wales, 2256, Australia',
    },
};

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
            start: '2045-12-11' + TIME_STRINGS[0],
            end: '2045-12-11' + TIME_STRINGS[1],
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
        location: [{
            qcode: LOCATIONS.sydney_opera_house.guid,
            name: LOCATIONS.sydney_opera_house.name,
            address: LOCATIONS.sydney_opera_house.address,
        }],
    },
    spiked: {
        ...BASE_EVENT,
        dates: {
            start: '2045-12-11' + TIME_STRINGS[0],
            end: '2045-12-11' + TIME_STRINGS[1],
            tz: 'Australia/Sydney',
        },
        state: 'spiked',
        name: 'Spiker',
        slugline: 'Spiked',
    },
    date_01_02_2045: {
        ...BASE_EVENT,
        dates: {
            start: '2045-01-31' + TIME_STRINGS[0],
            end: '2045-01-31' + TIME_STRINGS[1],
            tz: 'Australia/Sydney',
        },
        name: 'February 1st 2045',
        slugline: 'Event Feb 1',
    },
    date_02_02_2045: {
        ...BASE_EVENT,
        dates: {
            start: '2045-02-01' + TIME_STRINGS[0],
            end: '2045-02-01' + TIME_STRINGS[1],
            tz: 'Australia/Sydney',
        },
        name: 'February 2nd 2045',
        slugline: 'Event Feb 2',
    },
    date_03_02_2045: {
        ...BASE_EVENT,
        dates: {
            start: '2045-02-02' + TIME_STRINGS[0],
            end: '2045-02-02' + TIME_STRINGS[1],
            tz: 'Australia/Sydney',
        },
        name: 'February 3rd 2045',
        slugline: 'Event Feb 3',
    },
    date_04_02_2045: {
        ...BASE_EVENT,
        dates: {
            start: '2045-02-03' + TIME_STRINGS[0],
            end: '2045-02-03' + TIME_STRINGS[1],
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
            start: dateString + TIME_STRINGS[0],
            end: dateString + TIME_STRINGS[1],
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
