import React from 'react';
import {connect} from 'react-redux';
import {get, isEqual} from 'lodash';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';
import {Menu} from 'superdesk-ui-framework/react';

import {superdeskApi} from '../../superdeskApi';
import {
    IPlanningListItemProps,
    LIST_VIEW_TYPE,
    SORT_FIELD
} from '../../interfaces';
import {PLANNING, EVENTS, MAIN, ICON_COLORS, WORKFLOW_STATE} from '../../constants';

import {Label} from '../';
import {Item, Border, ItemType, PubStatus, Column, Row} from '../UI/List';
import {Button as NavButton} from '../UI/Nav';
import Icon from '../UI/IconMix';
import {EventDateTime} from '../Events';
import {CreatedUpdatedColumn} from '../UI/List/CreatedUpdatedColumn';

import {
    eventUtils,
    planningUtils,
    onEventCapture,
    isItemPosted,
    getItemId,
    isItemExpired,
    isItemDifferent,
    getItemWorkflowState,
} from '../../utils';
import {renderFields} from '../fields';
import * as actions from '../../actions';

interface IState {
    hover: boolean;
}

interface IProps extends IPlanningListItemProps {
    dispatch(action: any): void;
}

class PlanningItemComponent extends React.Component<IProps, IState> {
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

    shouldComponentUpdate(nextProps: Readonly<IProps>, nextState: Readonly<IState>) {
        return isItemDifferent(this.props, nextProps) ||
            this.state.hover !== nextState.hover ||
            !isEqual(
                planningUtils.getAgendaNames(this.props.item, this.props.agendas),
                planningUtils.getAgendaNames(nextProps.item, nextProps.agendas)
            ) ||
            this.props.minTimeWidth !== nextProps.minTimeWidth;
    }

    onItemHoverOn() {
        this.setState({hover: true});
    }

    onItemHoverOff() {
        this.setState({hover: false});
    }

    renderItemActions() {
        if (!this.state.hover && !this.props.active) {
            return null;
        }

        const {gettext} = superdeskApi.localization;
        const {session, privileges, item, lockedItems, hideItemActions, agendas, contentTypes} = this.props;
        const itemActionsCallBack = {
            [PLANNING.ITEM_ACTIONS.PREVIEW.actionName]:
                () => {
                    this.props.dispatch(actions.main.openPreview(item, true));
                },
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
            [PLANNING.ITEM_ACTIONS.ADD_COVERAGE_FROM_LIST.actionName]:
                this.props[PLANNING.ITEM_ACTIONS.ADD_COVERAGE_FROM_LIST.actionName],
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
            planningUtils.getPlanningActionsForUiFrameworkMenu({
                item: item,
                event: event,
                session: session,
                privileges: privileges,
                lockedItems: lockedItems,
                agendas: agendas,
                contentTypes: contentTypes,
                callBacks: itemActionsCallBack});

        if (get(itemActions, 'length', 0) === 0) {
            return null;
        }

        return (
            <Menu items={itemActions}>
                {
                    (toggle) => (
                        <div
                            style={{display: 'flex', height: '100%'}}
                            className="sd-list-item__action-menu sd-list-item__action-menu--direction-row"
                        >
                            <button
                                className="icn-btn dropdown__toggle actions-menu-button"
                                aria-label={gettext('Actions')}
                                onClick={(e) => {
                                    toggle(e);
                                }}
                                data-test-id="menu-button"
                            >
                                <i className="icon-dots-vertical" />
                            </button>
                        </div>
                    )
                }
            </Menu>
        );
    }

    render() {
        const {
            item,
            onItemClick,
            lockedItems,
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
            contentTypes,
            agendas,
            contacts,
            listViewType,
        } = this.props;

        if (!item) {
            return null;
        }

        const {gettext} = superdeskApi.localization;
        const isItemLocked = planningUtils.isPlanningLocked(item, lockedItems);
        const event = get(item, 'event');
        const borderState = isItemLocked ? 'locked' : false;
        const isExpired = isItemExpired(item);
        const secondaryFields = get(listFields, 'planning.secondary_fields', PLANNING.LIST.SECONDARY_FIELDS);
        const {querySelectorParent} = superdeskApi.utilities;

        return (
            <Item
                shadow={1}
                activated={multiSelected || active}
                onClick={(e) => {
                    // don't trigger preview if click went to a three dot menu or other button inside the list item
                    if (querySelectorParent(e.target, 'button', {self: true})) {
                        return;
                    }

                    onItemClick(item);
                }}
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
                <PubStatus
                    item={item}
                    isPublic={isItemPosted(item) &&
                    getItemWorkflowState(item) !== WORKFLOW_STATE.KILLED}
                />
                <Column
                    grow={true}
                    border={false}
                >
                    <Row>
                        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                            {renderFields(get(listFields, 'planning.primary_fields',
                                PLANNING.LIST.PRIMARY_FIELDS), item)}
                        </span>

                        {event && (
                            <span className="sd-no-wrap">
                                <Icon className="icon-event" color={ICON_COLORS.DARK_BLUE_GREY} />&nbsp;
                                <EventDateTime item={event} />
                            </span>
                        )}
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
                        {eventUtils.isEventCompleted(event) && (
                            <Label
                                text={gettext('Event Completed')}
                                iconType="success"
                                isHollow={true}
                            />
                        )}
                        {secondaryFields.includes('featured') &&
                            renderFields('featured', item, {tooltipFlowDirection: 'right'})}
                        {secondaryFields.includes('agendas') &&
                            renderFields('agendas', item, {
                                fieldsProps: {
                                    agendas: {
                                        agendas: planningUtils.getAgendaNames(item, agendas),
                                    },
                                },
                            })}
                        {secondaryFields.includes('coverages') && renderFields('coverages', item, {
                            date,
                            users,
                            desks,
                            activeFilter,
                            contentTypes,
                            contacts,
                        })}
                    </Row>
                </Column>
                {listViewType === LIST_VIEW_TYPE.SCHEDULE ? null : (
                    <CreatedUpdatedColumn
                        item={item}
                        field={this.props.sortField === SORT_FIELD.CREATED ?
                            'firstcreated' :
                            'versioncreated'
                        }
                        minTimeWidth={this.props.minTimeWidth}
                    />
                )}
                {showAddCoverage && !isItemLocked && (
                    <Column border={false}>
                        <OverlayTrigger
                            placement="left"
                            overlay={(
                                <Tooltip id={getItemId(item)}>
                                    {gettext('Add as coverage')}
                                </Tooltip>
                            )}
                        >
                            <NavButton
                                className="dropdown sd-create-btn"
                                aria-label={gettext('Add as coverage')}
                                onClick={this.onAddCoverageButtonClick}
                                icon="icon-plus-large"
                            >
                                <span className="circle" />
                            </NavButton>
                        </OverlayTrigger>
                    </Column>
                )}
                {this.renderItemActions()}
            </Item>
        );
    }
}

export const PlanningItem = connect()(PlanningItemComponent);
