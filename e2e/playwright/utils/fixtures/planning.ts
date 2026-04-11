import {getDateStringFor, TIME_STRINGS} from '../time';

export const AGENDAS = {
    sports: {name: 'Sports'},
    politics: {name: 'Politics'},
};

const BASE_PLANNING = {
    type: 'planning',
    state: 'draft',
};

export const TEST_PLANNINGS = {
    draft: getPlanningForDate(getDateStringFor.today(), {
        ...BASE_PLANNING,
        slugline: 'Original',
        anpa_category: [
            {name: 'Overseas Sport', qcode: 's'},
            {name: 'International News', qcode: 'i'},
        ],
        subject: [
            {qcode: '01001000', name: 'archaeology', parent: '01000000'},
            {qcode: '01011000', name: 'music', parent: '01000000'},
            {qcode: 'foo', name: 'Foo', scheme: 'event_types'},
            {qcode: 'bar', name: 'Bar'},
        ],
        description_text: 'description text',
        name: 'planning name',
        ednote: 'editorial note',
        headline: 'planning headline',
    }),
    spiked: getPlanningForDate(getDateStringFor.today(), {
        ...BASE_PLANNING,
        slugline: 'Spiker',
        state: 'spiked',
    }),
    featured: getPlanningForDate(getDateStringFor.today(), {
        ...BASE_PLANNING,
        slugline: 'Featured Planning',
        featured: true,
    }),
    plan_date_01_02_2045: {
        ...BASE_PLANNING,
        slugline: 'Plan Feb 1',
        planning_date: '2045-02-01T01:00:00+0000',
    },
    plan_date_02_02_2045: {
        ...BASE_PLANNING,
        slugline: 'Plan Feb 2',
        planning_date: '2045-02-02T01:00:00+0000',
    },
    plan_date_03_02_2045: {
        ...BASE_PLANNING,
        slugline: 'Plan Feb 3',
        planning_date: '2045-02-03T01:00:00+0000',
    },
    plan_date_04_02_2045: {
        ...BASE_PLANNING,
        slugline: 'Plan Feb 4',
        planning_date: '2045-02-04T01:00:00+0000',
    },
};

function getPlanningForDate(dateString: string, metadata: {[key: string]: any}, timeString: string = TIME_STRINGS[1]) {
    return {
        ...BASE_PLANNING,
        // planning_date: dateString + TIME_STRINGS[1],
        planning_date: dateString + timeString,
        ...metadata,
    };
}

export const createPlanningFor = {
    today: (metadata: {[key: string]: any} = {}, timeString: string = TIME_STRINGS[1]) => getPlanningForDate(getDateStringFor.today(), metadata, timeString),
    tomorrow: (metadata: {[key: string]: any} = {}, timeString: string = TIME_STRINGS[1]) => getPlanningForDate(getDateStringFor.tomorrow(), metadata, timeString),
    yesterday: (metadata: {[key: string]: any} = {}, timeString: string = TIME_STRINGS[1]) => getPlanningForDate(getDateStringFor.yesterday(), metadata, timeString),
    safe_next_week: (metadata: {[key: string]: any} = {}, timeString: string = TIME_STRINGS[1]) => getPlanningForDate(getDateStringFor.safe_next_week(), metadata, timeString),
    next_week: (metadata: {[key: string]: any} = {}, timeString: string = TIME_STRINGS[1]) => getPlanningForDate(getDateStringFor.next_week(), metadata, timeString),
};
