import eventsPlanningUi from './ui';
import * as selectors from '../../selectors';
import {gettext} from '../../utils';
import {EVENTS_PLANNING, MAIN} from '../../constants';

const onEventPlaningFilterCreatedOrUpdated = (_e, data) => (
    (dispatch, getState, {notify}) => {
        if (data && data.item) {
            return dispatch(eventsPlanningUi.fetchFilterById(data.item))
                .then(() => {
                    const currentFilter = selectors.eventsPlanning.currentFilter(getState());
                    const currentView = selectors.main.activeFilter(getState());

                    if (currentFilter === data.item && MAIN.FILTERS.COMBINED === currentView) {
                        notify.warning(
                            gettext('The Event and Planning filter you were viewing is modified!')
                        );
                        return dispatch(eventsPlanningUi.scheduleRefetch(true));
                    }
                    return Promise.resolve();
                });
        }
    }
);


const onEventPlaningFilterDeleted = (_e, data) => (
    (dispatch, getState, {notify}) => {
        if (data && data.item) {
            return dispatch(eventsPlanningUi.fetchFilters())
                .then(() => {
                    const currentFilter = selectors.eventsPlanning.currentFilter(getState());
                    const currentView = selectors.main.activeFilter(getState());

                    if (currentFilter === data.item && MAIN.FILTERS.COMBINED === currentView) {
                        dispatch(eventsPlanningUi.storeFilter(EVENTS_PLANNING.FILTER.ALL_EVENTS_PLANNING));

                        notify.warning(
                            gettext('The Event and Planning filter you were viewing is deleted!')
                        );

                        return dispatch(eventsPlanningUi.scheduleRefetch(true));
                    }
                    return Promise.resolve();
                });
        }
    }
);

// eslint-disable-next-line consistent-this
const self = {
    onEventPlaningFilterCreatedOrUpdated,
    onEventPlaningFilterDeleted,
};


// Map of notification name and Action Event to execute
self.events = {
    'event_planning_filters:created': () => (self.onEventPlaningFilterCreatedOrUpdated),
    'event_planning_filters:updated': () => (self.onEventPlaningFilterCreatedOrUpdated),
    'event_planning_filters:deleted': () => (self.onEventPlaningFilterDeleted),
};

export default self;