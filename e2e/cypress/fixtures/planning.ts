import {getDateStringFor, TIME_STRINGS} from '../support/utils/time';
import {IPlanningItem} from '../../../client/interfaces';

export const AGENDAS = {
    sports: {name: 'Sports'},
    politics: {name: 'Politics'},
};

const BASE_PLANNING = {
    type: 'planning',
    state: 'draft',
};

export const TEST_PLANNINGS = {
    draft: {
        ...BASE_PLANNING,
        slugline: 'Original',
        planning_date: '2045-12-11' + TIME_STRINGS[1],
        anpa_category: [
            {name: 'Overseas Sport', qcode: 's'},
            {name: 'International News', qcode: 'i'},
        ],
        subject: [
            {qcode: '01001000', name: 'archaeology', parent: '01000000'},
            {qcode: '01011000', name: 'music', parent: '01000000'},
        ],
    },
    spiked: {
        ...BASE_PLANNING,
        slugline: 'Spiker',
        planning_date: '2045-12-11' + TIME_STRINGS[1],
        state: 'spiked',
    },
    featured: {
        ...BASE_PLANNING,
        slugline: 'Featured Planning',
        planning_date: '2045-12-12' + TIME_STRINGS[1],
        featured: true,
    },
    plan_date_01_02_2045: {
        ...BASE_PLANNING,
        slugline: 'Plan Feb 1',
        planning_date: '2045-01-31' + TIME_STRINGS[1],
    },
    plan_date_02_02_2045: {
        ...BASE_PLANNING,
        slugline: 'Plan Feb 2',
        planning_date: '2045-02-01' + TIME_STRINGS[1],
    },
    plan_date_03_02_2045: {
        ...BASE_PLANNING,
        slugline: 'Plan Feb 3',
        planning_date: '2045-02-02' + TIME_STRINGS[1],
    },
    plan_date_04_02_2045: {
        ...BASE_PLANNING,
        slugline: 'Plan Feb 4',
        planning_date: '2045-02-03' + TIME_STRINGS[1],
    },
};

function getPlanningForDate(dateString: string, metadata: {[key: string]: any}) {
    return {
        ...BASE_PLANNING,
        planning_date: dateString + TIME_STRINGS[1],
        ...metadata,
    };
}

export const createPlanningFor = {
    today: (metadata: Partial<IPlanningItem> = {}) => getPlanningForDate(getDateStringFor.today(), metadata),
    tomorrow: (metadata: Partial<IPlanningItem> = {}) => getPlanningForDate(getDateStringFor.tomorrow(), metadata),
    yesterday: (metadata: Partial<IPlanningItem> = {}) => getPlanningForDate(getDateStringFor.yesterday(), metadata),
    next_week: (metadata: Partial<IPlanningItem> = {}) => getPlanningForDate(getDateStringFor.next_week(), metadata),
};
