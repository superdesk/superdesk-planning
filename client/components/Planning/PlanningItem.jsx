import React from 'react';
import PropTypes from 'prop-types';

import {get} from 'lodash';

import {Label} from '../';
import {Item, Border, ItemType, PubStatus, Column, Row, ActionMenu} from '../UI/List';
import {EventDateTime} from '../Events';
import {PlanningDateTime} from './';
import {ItemActionsMenu} from '../index';
import {PLANNING, EVENTS} from '../../constants';

import {planningUtils, getItemWorkflowStateLabel} from '../../utils';

export class PlanningItem extends React.PureComponent {
    render() {
        const {
            item,
            onItemClick,
            lockedItems,
            dateFormat,
            timeFormat,
            agendas,
            date,
            session,
            privileges,
        } = this.props;

        if (!item) {
            return null;
        }

        const isItemLocked = planningUtils.isPlanningLocked(item, lockedItems);
        const state = getItemWorkflowStateLabel(item);
        const event = get(item, 'event');

        let borderState = false;

        if (isItemLocked)
            borderState = 'locked';

        const agendaNames = get(item, 'agendas', [])
            .map((agendaId) => agendas.find((agenda) => agenda._id === agendaId))
            .filter((agenda) => agenda)
            .map((agenda) => agenda.name)
            .join(', ');

        const itemActionsCallBack = {
            [PLANNING.ITEM_ACTIONS.DUPLICATE.actionName]: this.props[PLANNING.ITEM_ACTIONS.DUPLICATE.actionName],
            [PLANNING.ITEM_ACTIONS.UNSPIKE.actionName]: this.props[PLANNING.ITEM_ACTIONS.UNSPIKE.actionName],
            [PLANNING.ITEM_ACTIONS.SPIKE.actionName]: this.props[PLANNING.ITEM_ACTIONS.SPIKE.actionName],
            [PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName]:
                this.props[PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName],
            [PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName]:
                this.props[PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName],
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
        };
        const itemActions = planningUtils.getPlanningActions(item, event, session,
            privileges, lockedItems, itemActionsCallBack);

        return (
            <Item shadow={1} onClick={() => onItemClick(item)}>
                <Border state={borderState} />
                <ItemType item={item} onCheckToggle={() => { /* no-op */ }}/>
                <PubStatus item={item} />
                <Column
                    grow={true}
                    border={false}
                >
                    <Row>
                        <Label
                            text={state.label}
                            iconType={state.iconType}
                        />
                        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                            {item.slugline &&
                                <span className="sd-list-item__slugline">{item.slugline}</span>
                            }
                            {item.description_text}
                        </span>

                        {event &&
                            <span className="sd-no-wrap">
                                <i className="icon-calendar-list sd-list-item__inline-icon"/>
                                <EventDateTime
                                    item={event}
                                    dateFormat={dateFormat}
                                    timeFormat={timeFormat}
                                />
                            </span>
                        }
                    </Row>
                    <Row>
                        <span className="sd-list-item__text-label">agenda:</span>
                        <span className="sd-overflow-ellipsis sd-list-item__text-strong sd-list-item--element-grow">
                            {agendaNames}
                        </span>
                        <PlanningDateTime
                            item={item}
                            date={date}
                            timeFormat={timeFormat}
                        />
                    </Row>
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

PlanningItem.propTypes = {
    item: PropTypes.object.isRequired,
    date: PropTypes.string.isRequired,
    onItemClick: PropTypes.func.isRequired,
    lockedItems: PropTypes.object.isRequired,
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
    agendas: PropTypes.array.isRequired,
    session: PropTypes.object,
    privileges: PropTypes.object,
    [PLANNING.ITEM_ACTIONS.DUPLICATE.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.SPIKE.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.UNSPIKE.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName]: PropTypes.func,
};
