import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {Label, InternalNoteLabel, Location} from '../';
import {EVENTS, MAIN} from '../../constants';
import {Item, Border, ItemType, PubStatus, Column, Row, ActionMenu} from '../UI/List';
import {EventDateTime} from './';
import {ItemActionsMenu} from '../index';
import {eventUtils, getItemWorkflowStateLabel, getItemActionedStateLabel, onEventCapture} from '../../utils';


export class EventItem extends React.PureComponent {
    render() {
        const {item, onItemClick, lockedItems, dateFormat, timeFormat,
            session, privileges, activeFilter, toggleRelatedPlanning} = this.props;

        if (!item) {
            return null;
        }

        const hasPlanning = eventUtils.eventHasPlanning(item);
        const isItemLocked = eventUtils.isEventLocked(item, lockedItems);
        const state = getItemWorkflowStateLabel(item);
        const actionedState = getItemActionedStateLabel(item);
        const hasLocation = !!get(item, 'location.name') ||
            !!get(item, 'location.formatted_address');
        const showRelatedPlanningLink = activeFilter === MAIN.FILTERS.COMBINED && hasPlanning;

        let borderState = false;

        if (isItemLocked)
            borderState = 'locked';
        else if (hasPlanning)
            borderState = 'active';

        const itemActionsCallBack = {
            [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName]: this.props[EVENTS.ITEM_ACTIONS.DUPLICATE.actionName],
            [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName],
            [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]: this.props[EVENTS.ITEM_ACTIONS.UNSPIKE.actionName],
            [EVENTS.ITEM_ACTIONS.SPIKE.actionName]: this.props[EVENTS.ITEM_ACTIONS.SPIKE.actionName],
            [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName],
            [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName],
            [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName],
            [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName],
            [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName],
            [EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName]
        };
        const itemActions = eventUtils.getEventActions(item, session, privileges, lockedItems, itemActionsCallBack);

        return (
            <Item shadow={1} activated={this.props.multiSelected} onClick={() => onItemClick(item)}>
                <Border state={borderState} />
                <ItemType item={item}
                    hasCheck={activeFilter !== MAIN.FILTERS.COMBINED}
                    checked={this.props.multiSelected}
                    onCheckToggle={(value) => {
                        this.props.onMultiSelectClick(item);
                    }} />
                <PubStatus item={item} />
                <Column
                    grow={true}
                    border={false}>
                    <Row>
                        <Label
                            text={state.label}
                            iconType={state.iconType}
                        />
                        {!!actionedState && <Label
                            onClick={(e) => {
                                onEventCapture(e);
                                onItemClick({
                                    _id: item.reschedule_from,
                                    type: 'event',
                                });
                            }}
                            text={actionedState.label}
                            iconType={actionedState.iconType}
                        />}
                        <InternalNoteLabel item={item} />
                        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                            {item.slugline &&
                                    <span className="sd-list-item__slugline">{item.slugline}</span>
                            }
                            {item.name}
                        </span>
                        <EventDateTime
                            item={item}
                            dateFormat={dateFormat}
                            timeFormat={timeFormat}
                        />
                    </Row>
                    {(showRelatedPlanningLink || hasLocation) && <Row>
                        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                            {showRelatedPlanningLink &&
                            <a
                                className="sd-line-input__input--related-item-link"
                                onClick={toggleRelatedPlanning}
                            >
                                <i className="icon-calendar" />
                                {this.props.relatedPlanningText}
                            </a>}
                            {hasLocation && <Location
                                name={get(item, 'location.name')}
                                address={get(item, 'location.formatted_address')}
                            />}
                        </span>
                    </Row>}
                </Column>
                {get(itemActions, 'length', 0) > 0 && <ActionMenu>
                    <ItemActionsMenu
                        className="side-panel__top-tools-right"
                        actions={itemActions} />
                </ActionMenu>}
            </Item>
        );
    }
}

EventItem.propTypes = {
    item: PropTypes.object.isRequired,
    onItemClick: PropTypes.func.isRequired,
    lockedItems: PropTypes.object.isRequired,
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
    session: PropTypes.object,
    privileges: PropTypes.object,
    activeFilter: PropTypes.string,
    toggleRelatedPlanning: PropTypes.func,
    relatedPlanningText: PropTypes.string,
    multiSelected: PropTypes.bool,
    onMultiSelectClick: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.SPIKE.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName]: PropTypes.func,
};

EventItem.defaultProps = {
    togglePlanningItem: () => { /* no-op */ }
};
