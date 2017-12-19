import {get} from 'lodash';
import * as selectors from '../../selectors';
import {SPIKED_STATE, EVENTS_PLANNING} from '../../constants';

const onPlanningSpiked = (_e, data) => (
    (dispatch, getState) => {
        if (data && data.item && selectors.main.isEventsPlanningView(getState())) {
            dispatch({
                type: EVENTS_PLANNING.ACTIONS.SPIKE_PLANNING,
                payload: {
                    id: data.item,
                    spikeState: get(
                        selectors.main.combinedSearch(getState()),
                        'spikeState',
                        SPIKED_STATE.NOT_SPIKED
                    )
                },
            });
        }

        return Promise.resolve();
    }
);


const onPlanningUnspiked = (_e, data) => (
    (dispatch, getState) => {
        if (data && data.item && selectors.main.isEventsPlanningView(getState())) {
            dispatch({
                type: EVENTS_PLANNING.ACTIONS.UNSPIKE_PLANNING,
                payload: {
                    id: data.item,
                    spikeState: get(
                        selectors.main.combinedSearch(getState()),
                        'spikeState',
                        SPIKED_STATE.NOT_SPIKED
                    )
                },
            });
        }

        return Promise.resolve();
    }
);

const onEventSpiked = (_e, data) => (
    (dispatch, getState) => {
        if (data && data.item && selectors.main.isEventsPlanningView(getState())) {
            dispatch({
                type: EVENTS_PLANNING.ACTIONS.SPIKE_EVENT,
                payload: {
                    id: data.item,
                    spikeState: get(
                        selectors.main.combinedSearch(getState()),
                        'spikeState',
                        SPIKED_STATE.NOT_SPIKED
                    )
                },
            });
        }

        return Promise.resolve();
    }
);

const onEventUnspiked = (_e, data) => (
    (dispatch, getState) => {
        if (data && data.item && selectors.main.isEventsPlanningView(getState())) {
            dispatch({
                type: EVENTS_PLANNING.ACTIONS.UNSPIKE_EVENT,
                payload: {
                    id: data.item,
                    spikeState: get(
                        selectors.main.combinedSearch(getState()),
                        'spikeState',
                        SPIKED_STATE.NOT_SPIKED
                    )
                },
            });
        }

        return Promise.resolve();
    }
);

const onRecurringEventSpiked = (e, data) => (
    (dispatch, getState) => {
        if (get(data, 'items') && selectors.main.isEventsPlanningView(getState())) {
            dispatch({
                type: EVENTS_PLANNING.ACTIONS.SPIKE_RECURRING_EVENTS,
                payload: {
                    ids: data.items.map((e) => e._id),
                    recurrence_id: data.recurrence_id,
                    spikeState: get(
                        selectors.main.combinedSearch(getState()),
                        'spikeState',
                        SPIKED_STATE.NOT_SPIKED
                    )
                },
            });

            return Promise.resolve(data.items);
        }

        return Promise.resolve([]);
    }
);


// eslint-disable-next-line consistent-this
const self = {
    onPlanningSpiked,
    onPlanningUnspiked,
    onEventSpiked,
    onEventUnspiked,
    onRecurringEventSpiked
};

export default self;
