export {PRIVILEGES} from './privileges';
export {PLANNING} from './planning';
export {AGENDA} from './agenda';
export {ASSIGNMENTS} from './assignments';
export {TOOLTIPS} from './tooltips';
export {LOCKS} from './locks';
export {WORKSPACE} from './workspace';
export {MODALS} from './modals';
export {UI} from './ui';
export {AUTOSAVE} from './autosave';
export {MAIN} from './main';
export {KEYCODES} from './keycodes';
export {EVENTS_PLANNING} from './eventsplanning';
export {COVERAGES} from './coverages';
export {MULTISELECT} from './multiselect';
export {CONTACTS} from './contacts';

export {EVENTS} from './events';

export const WS_NOTIFICATION = 'WS_NOTIFICATION';

export const DATE_FORMATS = {
    COMPARE_FORMAT: 'YYYY-M-D',
    DISPLAY_DATE_FORMAT: 'D. MMMM YYYY HH:mm',
    DISPLAY_CDATE_FORMAT: 'D. MMMM HH:mm',
    DISPLAY_DAY_FORMAT: 'dddd, ',
    DISPLAY_TODAY_FORMAT: '[Today], ',
};

export const WORKFLOW_STATE = {
    DRAFT: 'draft',
    INGESTED: 'ingested',
    SCHEDULED: 'scheduled',
    KILLED: 'killed',
    CANCELLED: 'cancelled',
    RESCHEDULED: 'rescheduled',
    POSTPONED: 'postponed',
    SPIKED: 'spiked',
};

export const POST_STATE = {
    USABLE: 'usable',
    CANCELLED: 'cancelled',
};

export const GENERIC_ITEM_ACTIONS = {
    DIVIDER: {label: 'Divider'},
    LABEL: {text: 'Label'},
};

export const SPIKED_STATE = {
    SPIKED: WORKFLOW_STATE.SPIKED,
    NOT_SPIKED: WORKFLOW_STATE.DRAFT,
    BOTH: 'both',
};

export const RESET_STORE = 'RESET_STORE';
export const INIT_STORE = 'INIT_STORE';
export const FORM_NAMES = {
    PlanningForm: 'planning',
    EventForm: 'event',
};

/*
 * Types of content
 */
export const ITEM_TYPE = {
    EVENT: 'event',
    PLANNING: 'planning',
    ASSIGNMENT: 'assignment',
    TEXT: 'text',
    PICTURE: 'picture',
    VIDEO: 'video',
    AUDIO: 'audio',
    GRAPHIC: 'graphic',
    COMPOSITE: 'composite',
    UNKNOWN: 'unknown',
};

export const TEMP_ID_PREFIX = 'tempId-';

// The delay in ms for use with single and double click detection
export const CLICK_DELAY = 250;

export const USER_ACTIONS = {
    RECEIVE_USER_PREFERENCES: 'RECEIVE_USER_PREFERENCES',
};

export const ICON_COLORS = {
    BLUE: 'icon--blue',
    DARK_BLUE_GREY: 'icon--dark-blue-grey',
    GRAY: 'icon--gray',
    GREEN: 'icon--green',
    LIGHT_BLUE: 'icon--light-blue',
    RED: 'icon--red',
    WHITE: 'icon--white',
    YELLOW: 'icon--yellow',
};
