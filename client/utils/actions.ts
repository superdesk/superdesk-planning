import {forEach, get} from 'lodash';

import * as actions from '../actions';
import {EVENTS, PLANNING} from '../constants';

interface IArgs {
    dispatch: any;
    eventOnly?: boolean;
    planningOnly?: boolean;
}

const getActionDispatches = ({
    dispatch,
    eventOnly = false,
    planningOnly = false,
}: IArgs) => {
    const dispatches = {
        // Event Actions
        [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName]:
            actions.events.ui.duplicate,
        [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]:
            actions.addEventToCurrentAgenda,
        [EVENTS.ITEM_ACTIONS.CREATE_AND_OPEN_PLANNING.actionName]:
            actions.events.ui.creatAndOpenPlanning,
        [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]:
            actions.events.ui.openUnspikeModal,
        [EVENTS.ITEM_ACTIONS.SPIKE.actionName]:
            actions.main.spikeItem,
        [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]:
            actions.events.ui.openCancelModal,
        [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]:
            actions.events.ui.openPostponeModal,
        [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]:
            actions.events.ui.openUpdateTimeModal,
        [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]:
            actions.events.ui.openRescheduleModal,
        [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName]:
            actions.events.ui.convertToRecurringEvent,
        [EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName]:
            actions.events.ui.openRepetitionsModal,
        [EVENTS.ITEM_ACTIONS.EDIT_EVENT.actionName]:
            actions.main.openForEdit,
        [EVENTS.ITEM_ACTIONS.EDIT_EVENT_MODAL.actionName]:
            actions.main.openForEdit,
        [EVENTS.ITEM_ACTIONS.ASSIGN_TO_CALENDAR.actionName]:
            actions.events.ui.assignToCalendar,
        [EVENTS.ITEM_ACTIONS.MARK_AS_COMPLETED.actionName]:
            actions.events.ui.onMarkEventCompleted,

        // Planning Item Actions
        [PLANNING.ITEM_ACTIONS.DUPLICATE.actionName]:
            actions.planning.ui.duplicate,
        [PLANNING.ITEM_ACTIONS.SPIKE.actionName]:
            actions.main.spikeItem,
        [PLANNING.ITEM_ACTIONS.UNSPIKE.actionName]:
            actions.planning.ui.openUnspikeModal,
        [PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName]:
            actions.planning.ui.openCancelPlanningModal,
        [PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName]:
            actions.planning.ui.openCancelAllCoverageModal,
        [PLANNING.ITEM_ACTIONS.ADD_AS_EVENT.actionName]:
            actions.events.ui.createEventFromPlanning,
        [PLANNING.ITEM_ACTIONS.EDIT_PLANNING.actionName]:
            actions.main.openForEdit,
        [PLANNING.ITEM_ACTIONS.EDIT_PLANNING_MODAL.actionName]:
            actions.main.openForEdit,
        [PLANNING.ITEM_ACTIONS.ASSIGN_TO_AGENDA.actionName]:
            actions.planning.ui.assignToAgenda,
        [PLANNING.ITEM_ACTIONS.ADD_TO_FEATURED.actionName]:
            actions.planning.featuredPlanning.modifyPlanningFeatured,
        [PLANNING.ITEM_ACTIONS.REMOVE_FROM_FEATURED.actionName]:
            actions.planning.featuredPlanning.modifyPlanningFeatured,
        [PLANNING.ITEM_ACTIONS.ADD_COVERAGE_FROM_LIST.actionName]:
            actions.planning.ui.addNewCoverageToPlanning,
    };
    const props = {};
    const addAction = (action) => {
        const func = get(dispatches, get(action, 'actionName', ''));

        if (func)
            props[action.actionName] = (...args) => dispatch(func(...args));
    };

    if (!planningOnly) {
        forEach(EVENTS.ITEM_ACTIONS, addAction);
    }

    if (!eventOnly) {
        forEach(PLANNING.ITEM_ACTIONS, addAction);
    }

    return props;
};

// eslint-disable-next-line consistent-this
const self = {getActionDispatches};

export default self;
