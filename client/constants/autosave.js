export const AUTOSAVE = {
    ACTIONS: {
        REMOVE: 'AUTOSAVE_REMOVE',
        RECEIVE: 'AUTOSAVE_RECEIVE',
        RECEIVE_ALL: 'AUTOSAVE_RECEIVE_ALL',
    },
    IGNORE_FIELDS: ['planning_ids', 'reason', 'update_method', 'expired', 'version', 'previous_recurrence_id',
        'versioncreated', 'event_lastmodified', 'relationships', 'expiry', 'duplicate_to', 'original_creator',
        'revert_state', 'version_creator', 'unique_id'],
};
