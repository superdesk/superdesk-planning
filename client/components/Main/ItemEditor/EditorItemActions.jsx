import React from 'react';
import PropTypes from 'prop-types';
import {connectServices} from 'superdesk-core/scripts/core/helpers/ReactRenderAsync';

import {ITEM_TYPE, EVENTS, PLANNING} from '../../../constants';
import {getItemType, eventUtils, planningUtils} from '../../../utils';

import {ItemActionsMenu} from '../../index';

const EditorItemActionsComponent = ({
    item,
    event,
    session,
    privileges,
    lockedItems,
    itemActions,
    contentTypes,
    itemManager,
    autoSave,
    modal,
}) => {
    const itemType = getItemType(item);
    const withMultiPlanningDate = true;
    let actions = [], callBacks;

    if (itemType === ITEM_TYPE.EVENT) {
        callBacks = {
            [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName]:
                itemActions[EVENTS.ITEM_ACTIONS.DUPLICATE.actionName].bind(null, item),
            [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]:
                itemActions[EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName],
            [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]:
                itemActions[EVENTS.ITEM_ACTIONS.UNSPIKE.actionName].bind(null, item),
            [EVENTS.ITEM_ACTIONS.SPIKE.actionName]:
                itemActions[EVENTS.ITEM_ACTIONS.SPIKE.actionName].bind(null, item),
            [EVENTS.ITEM_ACTIONS.CREATE_AND_OPEN_PLANNING.actionName]:
                (...args) => (
                    autoSave.flushAutosave()
                        .then(() => (
                            itemActions[
                                EVENTS.ITEM_ACTIONS.CREATE_AND_OPEN_PLANNING.actionName
                            ](...args)
                        ))
                ),
            [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]:
                () => (
                    autoSave.flushAutosave()
                        .then(() => (
                            itemActions[EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName](item)
                        ))

                ),
            [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]:
                () => (
                    autoSave.flushAutosave()
                        .then(() => (
                            itemActions[EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName](item)
                        ))
                ),
            [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]:
                () => (
                    autoSave.flushAutosave()
                        .then(() => (
                            itemActions[EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName](item)
                        ))
                ),
            [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]:
                () => (
                    autoSave.flushAutosave()
                        .then(() => (
                            itemActions[EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName](item)
                        ))
                ),
            [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName]:
                itemActions[EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName].bind(null, item),
            [EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName]:
                () => (
                    autoSave.flushAutosave()
                        .then(() => (
                            itemActions[EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName](item)
                        ))
                ),
            [EVENTS.ITEM_ACTIONS.SAVE_AS_TEMPLATE.actionName]:
                () => (
                    autoSave.flushAutosave()
                        .then(() => {
                            if (itemManager.editor.state.dirty) {
                                modal.alert({
                                    headerText: gettext('Warning'),
                                    bodyText: gettext('Save changes before saving as a template.'),
                                });
                            } else {
                                modal.prompt(gettext('Template name')).then((templateName) => {
                                    console.log('item', item);
                                    // send to server
                                    debugger;
                                });
                            }
                        })
                ),
        };
        actions = eventUtils.getEventActions({
            item,
            session,
            privileges,
            lockedItems,
            callBacks,
            withMultiPlanningDate,
        });
    }

    if (itemType === ITEM_TYPE.PLANNING) {
        callBacks = {
            [PLANNING.ITEM_ACTIONS.ADD_COVERAGE.actionName]: itemManager.addCoverage,
            [PLANNING.ITEM_ACTIONS.DUPLICATE.actionName]: itemActions[PLANNING.ITEM_ACTIONS.DUPLICATE.actionName],
            [PLANNING.ITEM_ACTIONS.UNSPIKE.actionName]: itemActions[PLANNING.ITEM_ACTIONS.UNSPIKE.actionName],
            [PLANNING.ITEM_ACTIONS.SPIKE.actionName]: itemActions[PLANNING.ITEM_ACTIONS.SPIKE.actionName],
            [PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName]:
                itemActions[PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName],
            [PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName]:
                itemActions[PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName],
            [PLANNING.ITEM_ACTIONS.ADD_TO_FEATURED.actionName]:
                (item, remove) => (
                    autoSave.flushAutosave()
                        .then(() => (
                            itemActions[PLANNING.ITEM_ACTIONS.ADD_TO_FEATURED.actionName](item, remove)
                        ))
                ),
            [PLANNING.ITEM_ACTIONS.REMOVE_FROM_FEATURED.actionName]:
                (item, remove) => (
                    autoSave.flushAutosave()
                        .then(() => (
                            itemActions[PLANNING.ITEM_ACTIONS.REMOVE_FROM_FEATURED.actionName](item, remove)
                        ))
                ),
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
        actions = planningUtils.getPlanningActions({
            item,
            event,
            session,
            privileges,
            lockedItems,
            callBacks,
            contentTypes,
        });
    }


    return actions.length === 0 ? null : (<ItemActionsMenu
        className="navbtn"
        actions={actions}
        wide={itemType === ITEM_TYPE.EVENT}
    />);
};

EditorItemActionsComponent.propTypes = {
    item: PropTypes.object,
    event: PropTypes.object,
    session: PropTypes.object,
    privileges: PropTypes.object,
    lockedItems: PropTypes.object,
    itemActions: PropTypes.object,
    contentTypes: PropTypes.array,
    itemManager: PropTypes.object,
    autoSave: PropTypes.object,
    modal: PropTypes.object,
};

export const EditorItemActions = connectServices(
    EditorItemActionsComponent,
    ['modal']
);
