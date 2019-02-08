import React from 'react';
import PropTypes from 'prop-types';

import {get, isEqual} from 'lodash';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';

import {Label} from '../';
import {Item, Border, ItemType, PubStatus, Column, Row, ActionMenu} from '../UI/List';
import {Button as NavButton} from '../UI/Nav';
import Icon from '../UI/IconMix';
import {EventDateTime} from '../Events';
import {ItemActionsMenu} from '../index';
import {PLANNING, EVENTS, MAIN, ICON_COLORS, WORKFLOW_STATE} from '../../constants';

import {
    planningUtils,
    onEventCapture,
    isItemPosted,
    getItemId,
    isItemExpired,
    isItemDifferent,
    getItemWorkflowState,
} from '../../utils';
import {gettext} from '../../utils/gettext';
import {renderFields} from '../fields';

const PRIMARY_FIELDS = ['slugline', 'internalnote', 'description'];
const SECONDARY_FIELDS = ['state', 'featured', 'agendas', 'coverages'];

export class PlanningItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {hover: false};

        this.onAddCoverageButtonClick = this.onAddCoverageButtonClick.bind(this);
        this.onItemHoverOn = this.onItemHoverOn.bind(this);
        this.onItemHoverOff = this.onItemHoverOff.bind(this);
        this.renderItemActions = this.renderItemActions.bind(this);
    }

    onAddCoverageButtonClick(event) {
        onEventCapture(event);
        this.props.onAddCoverageClick();
    }

    shouldComponentUpdate(nextProps, nextState) {
        return isItemDifferent(this.props, nextProps) ||
            this.state.hover !== nextState.hover ||
            !isEqual(this.getAgendaNames(this.props), this.getAgendaNames(nextProps));
    }

    onItemHoverOn() {
        this.setState({hover: true});
    }

    onItemHoverOff() {
        this.setState({hover: false});
    }

    renderItemActions() {
        if (!this.state.hover) {
            return null;
        }

        const {session, privileges, item, lockedItems, hideItemActions, agendas} = this.props;
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
            [PLANNING.ITEM_ACTIONS.ADD_TO_FEATURED.actionName]:
                this.props[PLANNING.ITEM_ACTIONS.ADD_TO_FEATURED.actionName],
            [PLANNING.ITEM_ACTIONS.REMOVE_FROM_FEATURED.actionName]:
                this.props[PLANNING.ITEM_ACTIONS.REMOVE_FROM_FEATURED.actionName],
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
                this.props[EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName],
        };
        const event = get(item, 'event');

        const itemActions = hideItemActions ? [] :
            planningUtils.getPlanningActions({
                item: item,
                event: event,
                session: session,
                privileges: privileges,
                lockedItems: lockedItems,
                agendas: agendas,
                callBacks: itemActionsCallBack});

        if (get(itemActions, 'length', 0) === 0) {
            return null;
        }

        return (
            <ActionMenu>
                <ItemActionsMenu actions={itemActions} />
            </ActionMenu>
        );
    }

    getAgendaNames(props) {
        return get(props.item, 'agendas', [])
            .map((agendaId) => props.agendas.find((agenda) => agenda._id === agendaId))
            .filter((agenda) => agenda);
    }

    render() {
        const {
            item,
            onItemClick,
            lockedItems,
            dateFormat,
            timeFormat,
            date,
            onMultiSelectClick,
            multiSelected,
            activeFilter,
            users,
            desks,
            showAddCoverage,
            listFields,
            active,
            refNode,
        } = this.props;

        if (!item) {
            return null;
        }

        const isItemLocked = planningUtils.isPlanningLocked(item, lockedItems);
        const event = get(item, 'event');

        let borderState = false;

        if (isItemLocked)
            borderState = 'locked';

        const isExpired = isItemExpired(item);
        const secondaryFields = get(listFields, 'planning.secondary_fields', SECONDARY_FIELDS);

        return (
            <Item
                shadow={1}
                activated={multiSelected || active}
                onClick={() => onItemClick(item)}
                disabled={isExpired}
                onMouseLeave={this.onItemHoverOff}
                onMouseEnter={this.onItemHoverOn}
                refNode={refNode}
            >
                <Border state={borderState} />
                <ItemType
                    item={item}
                    hasCheck={activeFilter !== MAIN.FILTERS.COMBINED}
                    checked={multiSelected}
                    onCheckToggle={onMultiSelectClick.bind(null, item)}
                    color={!isExpired && ICON_COLORS.LIGHT_BLUE}
                />
                <PubStatus item={item} isPublic={isItemPosted(item) &&
                    getItemWorkflowState(item) !== WORKFLOW_STATE.KILLED}/>
                <Column
                    grow={true}
                    border={false}
                >
                    <Row>
                        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                            {renderFields(get(listFields, 'planning.primary_fields', PRIMARY_FIELDS), item)}
                        </span>

                        {event &&
                            <span className="sd-no-wrap">
                                <Icon className="icon-event" color={ICON_COLORS.DARK_BLUE_GREY}/>&nbsp;
                                <EventDateTime
                                    item={event}
                                    dateFormat={dateFormat}
                                    timeFormat={timeFormat}
                                />
                            </span>
                        }
                    </Row>
                    <Row>
                        {isExpired && (
                            <Label
                                text={gettext('Expired')}
                                iconType="alert"
                                isHollow={true}
                            />
                        )}
                        {secondaryFields.includes('state') && renderFields('state', item) }
                        {secondaryFields.includes('featured') &&
                            renderFields('featured', item, {tooltipFlowDirection: 'right'})}
                        {secondaryFields.includes('agendas') &&
                            renderFields('agendas', item, {agendas: this.getAgendaNames(this.props)})}
                        {secondaryFields.includes('coverages') && renderFields('coverages', item, {
                            date,
                            timeFormat,
                            dateFormat,
                            users,
                            desks,
                            activeFilter,
                        })}
                    </Row>
                </Column>
                {showAddCoverage && !isItemLocked &&
                    <Column border={false}>
                        <OverlayTrigger placement="left"
                            overlay={
                                <Tooltip id={getItemId(item)}>
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
                {this.renderItemActions()}
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
    listFields: PropTypes.object,
    refNode: PropTypes.func,
    active: PropTypes.bool,
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
