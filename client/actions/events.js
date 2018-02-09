import * as selectors from '../selectors';
import {SubmissionError} from 'redux-form';
import {EVENTS} from '../constants';
import eventsUi from './events/ui';
import main from './main';

const duplicateEvent = (event) => (
    (dispatch) => (
        dispatch(createDuplicate(event))
            .then((dup) => {
                const duplicate = dup[0];

                // On duplicate, backend returns with just _ids for files
                // Replace them with file media information from original event to be used in editor
                duplicate.files = event.files;
                duplicate._type = 'events';

                dispatch(eventsUi.scheduleRefetch());
                dispatch(main.lockAndEdit(duplicate));
            })
    )
);

const toggleEventSelection = ({event, value}) => (
    {
        type: value ? EVENTS.ACTIONS.SELECT_EVENTS : EVENTS.ACTIONS.DESELECT_EVENT,
        payload: value ? [event] : event,
    }
);

const selectAllTheEventList = () => (
    (dispatch, getState) => {
        dispatch({
            type: EVENTS.ACTIONS.SELECT_EVENTS,
            payload: selectors.getEventsIdsToShowInList(getState()),
        });
    }
);

const deselectAllTheEventList = () => (
    {type: EVENTS.ACTIONS.DESELECT_ALL_EVENT}
);


/**
 * Action Dispatcher to create a duplicate of the passed event
 * This action is private to this module only.
 * @param {object} event
 * @return arrow function
 */
const createDuplicate = (event) => (
    (dispatch, getState, {api, notify}) => (
        api('events_duplicate', event).save({})
            .then((data) => {
                notify.success('The event has been duplicated');
                return data._items || [data];
            }, (error) => {
                notify.error('An error occured when duplicating the event');
                throw new SubmissionError({_error: error.statusText});
            })
    )
);

/**
 * Action to toggle the Events panel
 * @return object
 */
const toggleEventsList = () => (
    {type: EVENTS.ACTIONS.TOGGLE_EVENT_LIST}
);

export {
    duplicateEvent,
    toggleEventSelection,
    toggleEventsList,
    selectAllTheEventList,
    deselectAllTheEventList,
};
