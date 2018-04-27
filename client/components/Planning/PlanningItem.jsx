import React from 'react';
import PropTypes from 'prop-types';

import {get} from 'lodash';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';

import {Label, InternalNoteLabel} from '../';
import {Item, Border, ItemType, PubStatus, Column, Row, ActionMenu} from '../UI/List';
import {Button as NavButton} from '../UI/Nav';
import {EventDateTime} from '../Events';
import {PlanningDateTime} from './';
import {ItemActionsMenu} from '../index';
import {PLANNING, EVENTS, MAIN, ICON_COLORS} from '../../constants';

import {planningUtils, getItemWorkflowStateLabel, onEventCapture} from '../../utils';
import {AgendaNameList} from '../Agendas';

export class PlanningItem extends React.PureComponent {
    constructor(props) {
        super(props);

        this.onAddCoverageButtonClick = this.onAddCoverageButtonClick.bind(this);
    }

    onAddCoverageButtonClick(event) {
        onEventCapture(event);
        this.props.onAddCoverageClick();
    }

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
            onMultiSelectClick,
            multiSelected,
            activeFilter,
            users,
            desks,
            showAddCoverage,
            hideItemActions,
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
            .filter((agenda) => agenda);

        const itemActionsCallBack = {
            [PLANNING.ITEM_ACTIONS.EDIT_PLANNING.actionName]:
                this.props[PLANNING.ITEM_ACTIONS.EDIT_PLANNING.actionName],
            [PLANNING.ITEM_ACTIONS.EDIT_PLANNING_MODAL.actionName]:
                this.props[PLANNING.ITEM_ACTIONS.EDIT_PLANNING_MODAL.actionName],
            [PLANNING.ITEM_ACTIONS.DUPLICATE.actionName]: this.props[PLANNING.ITEM_ACTIONS.DUPLICATE.actionName],
            [PLANNING.ITEM_ACTIONS.UNSPIKE.actionName]: this.props[PLANNING.ITEM_ACTIONS.UNSPIKE.actionName],
            [PLANNING.ITEM_ACTIONS.SPIKE.actionName]: this.props[PLANNING.ITEM_ACTIONS.SPIKE.actionName],
            [PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName]:
                this.props[PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName],
            [PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName]:
                this.props[PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName],
            [PLANNING.ITEM_ACTIONS.ADD_AS_EVENT.actionName]:
                this.props[PLANNING.ITEM_ACTIONS.ADD_AS_EVENT.actionName],
            [PLANNING.ITEM_ACTIONS.ASSIGN_TO_AGENDA.actionName]:
                this.props[PLANNING.ITEM_ACTIONS.ASSIGN_TO_AGENDA.actionName],
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

        const itemActions = hideItemActions ? [] :
            planningUtils.getPlanningActions({
                item: item,
                event: event,
                session: session,
                privileges: privileges,
                lockedItems: lockedItems,
                agendas: agendas,
                callBacks: itemActionsCallBack});

        return (
            <Item shadow={1} activated={multiSelected} onClick={() => onItemClick(item)}>
                <Border state={borderState} />
                <ItemType
                    item={item}
                    hasCheck={activeFilter !== MAIN.FILTERS.COMBINED}
                    checked={multiSelected}
                    onCheckToggle={onMultiSelectClick.bind(null, item)}
                    color={ICON_COLORS.LIGHT_BLUE}
                />
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
                        <InternalNoteLabel item={item} />
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
                            <AgendaNameList agendas={agendaNames}/>
                        </span>
                        <PlanningDateTime
                            item={item}
                            date={date}
                            timeFormat={timeFormat}
                            dateFormat={dateFormat}
                            users={users}
                            desks={desks}
                            activeFilter={activeFilter}
                        />
                    </Row>
                </Column>
                {showAddCoverage &&
                    <Column border={false}>
                        <OverlayTrigger placement="left"
                            overlay={
                                <Tooltip id={get(item, '_id')}>
                                    {gettext('Add as coverage')}
                                </Tooltip>
                            }
                        >
                            <NavButton
                                className="dropdown sd-create-btn"
                                onClick={this.onAddCoverageButtonClick}
                                icon="icon-plus-large"
                            >
                                <span className="circle" />
                            </NavButton>
                        </OverlayTrigger>
                    </Column>
                }
                {get(itemActions, 'length', 0) > 0 &&
                    <ActionMenu>
                        <ItemActionsMenu actions={itemActions} />
                    </ActionMenu>
                }
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
    onAddCoverageClick: PropTypes.func,
    onMultiSelectClick: PropTypes.func,
    multiSelected: PropTypes.bool,
    activeFilter: PropTypes.string,
    users: PropTypes.array,
    desks: PropTypes.array,
    showUnlock: PropTypes.bool,
    hideItemActions: PropTypes.bool,
    showAddCoverage: PropTypes.bool,
    [PLANNING.ITEM_ACTIONS.DUPLICATE.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.SPIKE.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.UNSPIKE.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.ADD_AS_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName]: PropTypes.func,
};
