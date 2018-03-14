import React from 'react';
import PropTypes from 'prop-types';
import {ItemActionsMenu} from '../../index';
import {Button} from '../../UI/Nav';
import {ITEM_TYPE, EVENTS, PLANNING, WORKSPACE} from '../../../constants';
import {getItemType, eventUtils, planningUtils} from '../../../utils';

export const EditorItemActions = ({
    item,
    event,
    session,
    privileges,
    lockedItems,
    currentWorkspace,
    itemActions
}) => {
    const itemType = getItemType(item);

    let itemActionsCallBack = {
        [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName]: itemActions[EVENTS.ITEM_ACTIONS.DUPLICATE.actionName],
        [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]:
            itemActions[EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName],
        [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]: itemActions[EVENTS.ITEM_ACTIONS.UNSPIKE.actionName],
        [EVENTS.ITEM_ACTIONS.SPIKE.actionName]: itemActions[EVENTS.ITEM_ACTIONS.SPIKE.actionName],
        [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]: itemActions[EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName],
        [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]: itemActions[EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName],
        [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]: itemActions[EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName],
        [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]:
            itemActions[EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName],
        [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName]:
            itemActions[EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName],
    };
    let actions = eventUtils.getEventActions(item, session, privileges, lockedItems, itemActionsCallBack, true);

    if (itemType === ITEM_TYPE.PLANNING) {
        itemActionsCallBack = {
            [PLANNING.ITEM_ACTIONS.DUPLICATE.actionName]: itemActions[PLANNING.ITEM_ACTIONS.DUPLICATE.actionName],
            [PLANNING.ITEM_ACTIONS.UNSPIKE.actionName]: itemActions[PLANNING.ITEM_ACTIONS.UNSPIKE.actionName],
            [PLANNING.ITEM_ACTIONS.SPIKE.actionName]: itemActions[PLANNING.ITEM_ACTIONS.SPIKE.actionName],
            [PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName]:
                itemActions[PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName],
            [PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName]:
                itemActions[PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName],
            [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]:
                itemActions[EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName],
            [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]:
                    itemActions[EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName],
            [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]:
                itemActions[EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName],
            [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]:
                itemActions[EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName],
            [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName]:
                itemActions[EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName],
        };

        actions = currentWorkspace === WORKSPACE.PLANNING ?
            planningUtils.getPlanningActions(item, event, session, privileges, lockedItems, itemActionsCallBack) :
            [];
    }

    if (actions.length === 0) {
        return null;
    }

    return (<Button>
        <ItemActionsMenu
            className="side-panel__top-tools-right"
            actions={actions} />
    </Button>);
};

EditorItemActions.propTypes = {
    item: PropTypes.object,
    event: PropTypes.object,
    session: PropTypes.object,
    privileges: PropTypes.object,
    lockedItems: PropTypes.object,
    itemActions: PropTypes.object,
    currentWorkspace: PropTypes.string,
};
