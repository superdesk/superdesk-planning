import {superdeskApi} from '../superdeskApi';

export const PLANNING = {
    ACTIONS: {
        SPIKE_PLANNING: 'SPIKE_PLANNING',
        UNSPIKE_PLANNING: 'UNSPIKE_PLANNING',
        RECEIVE_PLANNINGS: 'RECEIVE_PLANNINGS',
        RECEIVE_PLANNING_HISTORY: 'RECEIVE_PLANNING_HISTORY',
        SET_LIST: 'SET_PLANNING_LIST',
        ADD_TO_LIST: 'ADD_TO_PLANNING_LIST',
        CLEAR_LIST: 'CLEAR_PLANNING_LIST',
        MARK_PLANNING_CANCELLED: 'MARK_PLANNING_CANCELLED',
        MARK_COVERAGE_CANCELLED: 'MARK_COVERAGE_CANCELLED',
        MARK_PLANNING_POSTPONED: 'MARK_PLANNING_POSTPONED',
        LOCK_PLANNING: 'LOCK_PLANNING',
        UNLOCK_PLANNING: 'UNLOCK_PLANNING',
        EXPIRE_PLANNING: 'EXPIRE_PLANNING',
    },
    // Number of ids to look for by single request
    // because url length must stay short
    // chunk size must be lower than page limit (25)
    FETCH_IDS_CHUNK_SIZE: 25,
    ITEM_ACTIONS: {
        SPIKE: {
            label: 'Spike planning',
            icon: 'icon-trash',
            actionName: 'onSpikePlanning',
        },
        UNSPIKE: {
            label: 'Unspike planning',
            icon: 'icon-unspike',
            actionName: 'onUnspikePlanning',
        },
        DUPLICATE: {
            label: 'Duplicate',
            icon: 'icon-copy',
            actionName: 'onDuplicatePlanning',
        },
        CANCEL_PLANNING: {
            label: 'Cancel Planning',
            icon: 'icon-close-small',
            actionName: 'onCancelPlanning',
            lock_action: 'planning_cancel',
        },
        CANCEL_ALL_COVERAGE: {
            label: 'Cancel all Coverage(s)',
            icon: 'icon-close-small',
            actionName: 'onCancelAllCoverage',
            lock_action: 'cancel_all_coverage',
        },
        ADD_TO_PLANNING: {
            lock_action: 'add_to_planning',
            actionName: 'onAddToPlanning',
        },
        ADD_AS_EVENT: {
            label: 'Add As Event',
            icon: 'icon-calendar',
            actionName: 'onAddAsEvent',
        },
        EDIT_PLANNING: {
            label: 'Edit',
            icon: 'icon-pencil',
            actionName: 'onEditPlanning',
            lock_action: 'edit',
        },
        EDIT_PLANNING_MODAL: {
            label: 'Edit in popup',
            icon: 'icon-external',
            actionName: 'onEditPlanningModal',
            lock_action: 'edit',
        },
        ASSIGN_TO_AGENDA: {
            label: 'Assign to agenda',
            icon: 'icon-list-plus',
            actionName: 'onAssignToAgenda',
        },
        ADD_COVERAGE: {
            label: 'Add coverage',
            icon: 'icon-plus-small',
            actionName: 'onAddCoverage',
        },
        ADD_TO_FEATURED: {
            label: 'Add to featured stories',
            icon: 'icon-list-plus',
            actionName: 'onAddFeatured',
        },
        REMOVE_FROM_FEATURED: {
            label: 'Remove from featured stories',
            icon: 'icon-revert',
            actionName: 'onRemoveFeatured',
        },
        ADD_COVERAGE_FROM_LIST: {
            label: 'Add coverage',
            icon: 'icon-plus-small',
            actionName: 'onAddNewCoverageToPlanning',
        },
        PREVIEW: {
            label: 'Preview',
            icon: 'icon-preview-mode',
            actionName: 'onPlanningPreview',
        },
    },
    NEWS_COVERAGE_CANCELLED_STATUS: {
        qcode: 'ncostat:notint',
        name: 'coverage not intended',
        label: 'Not planned',
    },
    G2_CONTENT_TYPE: {
        TEXT: 'text',
        VIDEO: 'video',
        LIVE_VIDEO: 'live_video',
        AUDIO: 'audio',
        PICTURE: 'picture',
        GRAPHIC: 'graphic',
        LIVE_BLOG: 'live_blog',
        VIDEO_EXPLAINER: 'video_explainer',
    },
    HISTORY_OPERATIONS: {
        ASSIGN_AGENDA: 'assign_agenda',
        PLANNING_CANCEL: 'planning_cancel',
        ADD_FEATURED: 'add_featured',
        REMOVE_FEATURED: 'remove_featured',
        CREATE_EVENT: 'create_event',
    },
    LIST: {
        PRIMARY_FIELDS: ['slugline', 'internalnote', 'description'],
        SECONDARY_FIELDS: ['state', 'featured', 'agendas', 'coverages'],
    },
    EXPORT_LIST: {
        PRIMARY_FIELDS: ['slugline', 'description'],
        SECONDARY_FIELDS: ['agendas'],
    },
};

export function assignPlanningConstantTranslations() {
    const {gettext} = superdeskApi.localization;

    PLANNING.ITEM_ACTIONS.SPIKE.label = gettext('Spike planning');
    PLANNING.ITEM_ACTIONS.UNSPIKE.label = gettext('Unspike planning');
    PLANNING.ITEM_ACTIONS.DUPLICATE.label = gettext('Duplicate');
    PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.label = gettext('Cancel Planning');
    PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.label = gettext('Cancel all Coverage(s)');
    PLANNING.ITEM_ACTIONS.ADD_AS_EVENT.label = gettext('Add As Event');
    PLANNING.ITEM_ACTIONS.EDIT_PLANNING.label = gettext('Edit');
    PLANNING.ITEM_ACTIONS.EDIT_PLANNING_MODAL.label = gettext('Edit in popup');
    PLANNING.ITEM_ACTIONS.ASSIGN_TO_AGENDA.label = gettext('Assign to agenda');
    PLANNING.ITEM_ACTIONS.ADD_COVERAGE.label = gettext('Add coverage');
    PLANNING.ITEM_ACTIONS.ADD_TO_FEATURED.label = gettext('Add to featured stories');
    PLANNING.ITEM_ACTIONS.REMOVE_FROM_FEATURED.label = gettext('Remove from featured stories');
    PLANNING.ITEM_ACTIONS.ADD_COVERAGE_FROM_LIST.label = gettext('Add coverage');
    PLANNING.ITEM_ACTIONS.PREVIEW.label = gettext('Preview');
}
