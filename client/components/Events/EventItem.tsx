import React from 'react';
import {connect} from 'react-redux';
import {get} from 'lodash';
import {Menu} from 'superdesk-ui-framework/react';
import {superdeskApi} from '../../superdeskApi';
import {IEventListItemProps, LIST_VIEW_TYPE, PLANNING_VIEW, SORT_FIELD} from '../../interfaces';

import {EVENTS, ICON_COLORS, WORKFLOW_STATE} from '../../constants';

import {Label} from '../';
import {Border, Column, Item, ItemType, PubStatus, Row} from '../UI/List';
import {
    eventUtils,
    getItemWorkflowState,
    isItemDifferent,
    isItemExpired,
    isItemPosted,
    onEventCapture,
} from '../../utils';
import {renderFields} from '../fields';
import {CreatedUpdatedColumn} from '../UI/List/CreatedUpdatedColumn';
import {EventDateTimeColumn} from './EventDateTimeColumn';
import * as actions from '../../actions';

interface IState {
    hover: boolean;
}

interface IProps extends IEventListItemProps {
    dispatch(action: any): void;
}

class EventItemComponent extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);
        this.state = {hover: false};
        this.onItemHoverOn = this.onItemHoverOn.bind(this);
        this.onItemHoverOff = this.onItemHoverOff.bind(this);
        this.renderItemActions = this.renderItemActions.bind(this);
    }

    shouldComponentUpdate(nextProps: Readonly<IProps>, nextState: Readonly<IState>) {
        return isItemDifferent(this.props, nextProps) ||
            this.state.hover !== nextState.hover ||
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
        const {session, privileges, item, lockedItems, calendars} = this.props;
        const callBacks = {
            [EVENTS.ITEM_ACTIONS.PREVIEW.actionName]:
                () => {
                    this.props.dispatch(actions.main.openPreview(item, true));
                },
            [EVENTS.ITEM_ACTIONS.EDIT_EVENT.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.EDIT_EVENT.actionName].bind(null, item, true),
            [EVENTS.ITEM_ACTIONS.EDIT_EVENT_MODAL.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.EDIT_EVENT_MODAL.actionName].bind(null, item, false, true),
            [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.DUPLICATE.actionName].bind(null, item),
            [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName],
            [EVENTS.ITEM_ACTIONS.CREATE_AND_OPEN_PLANNING.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.CREATE_AND_OPEN_PLANNING.actionName],
            [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.UNSPIKE.actionName].bind(null, item),
            [EVENTS.ITEM_ACTIONS.SPIKE.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.SPIKE.actionName].bind(null, item),
            [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName].bind(null, item),
            [EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.POSTPONE_EVENT.actionName].bind(null, item),
            [EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.UPDATE_TIME.actionName].bind(null, item),
            [EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.RESCHEDULE_EVENT.actionName].bind(null, item),
            [EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.CONVERT_TO_RECURRING.actionName].bind(null, item),
            [EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.UPDATE_REPETITIONS.actionName].bind(null, item),
            [EVENTS.ITEM_ACTIONS.ASSIGN_TO_CALENDAR.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.ASSIGN_TO_CALENDAR.actionName],
            [EVENTS.ITEM_ACTIONS.SAVE_AS_TEMPLATE.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.SAVE_AS_TEMPLATE.actionName],
            [EVENTS.ITEM_ACTIONS.MARK_AS_COMPLETED.actionName]:
                this.props[EVENTS.ITEM_ACTIONS.MARK_AS_COMPLETED.actionName].bind(null, item),
        };
        const itemActions = eventUtils.getEventActionsForUiFrameworkMenu({
            item,
            session,
            privileges,
            lockedItems,
            callBacks,
            calendars,
        });

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
        const {gettext} = superdeskApi.localization;
        const {querySelectorParent} = superdeskApi.utilities;

        const {
            item,
            onItemClick,
            lockedItems,
            activeFilter,
            toggleRelatedPlanning,
            onMultiSelectClick,
            calendars,
            listFields,
            active,
            refNode,
            listViewType,
        } = this.props;

        if (!item) {
            return null;
        }

        const hasPlanning = eventUtils.eventHasPlanning(item);
        const isItemLocked = eventUtils.isEventLocked(item, lockedItems);
        const showRelatedPlanningLink = activeFilter === PLANNING_VIEW.COMBINED && hasPlanning;
        let borderState: 'locked' | 'active' | false = false;

        if (isItemLocked) {
            borderState = 'locked';
        } else if (hasPlanning) {
            borderState = 'active';
        }


        const isExpired = isItemExpired(item);

        const secondaryFields = get(listFields, 'event.secondary_fields', EVENTS.LIST.SECONDARY_FIELDS);

        return (
            <Item
                shadow={1}
                activated={this.props.multiSelected || active}
                onClick={(e) => {
                    // don't trigger preview if click went to a three dot menu or other button inside the list item
                    if (e.target instanceof HTMLElement && querySelectorParent(e.target, 'button', {self: true})) {
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
                    hasCheck={activeFilter !== PLANNING_VIEW.COMBINED}
                    checked={this.props.multiSelected}
                    onCheckToggle={onMultiSelectClick.bind(null, item)}
                    color={!isExpired && ICON_COLORS.DARK_BLUE_GREY}
                />
                <PubStatus
                    item={item}
                    isPublic={isItemPosted(item) &&
                        getItemWorkflowState(item) !== WORKFLOW_STATE.KILLED
                    }
                />
                <Column
                    grow={true}
                    border={false}
                >
                    <Row>
                        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                            {renderFields(get(listFields, 'event.primary_fields',
                                EVENTS.LIST.PRIMARY_FIELDS), item)}
                        </span>
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
                        {secondaryFields.includes('actionedState') &&
                            renderFields('actionedState', item, {
                                onClick: (e) => {
                                    onEventCapture(e);
                                    onItemClick({
                                        _id: item.reschedule_from,
                                        type: 'event',
                                    });
                                },
                            })
                        }
                        {eventUtils.isEventCompleted(item) && (
                            <Label
                                text={gettext('Event Completed')}
                                iconType="success"
                                isHollow={true}
                            />
                        )}
                        {secondaryFields.includes('calendars') && renderFields('calendars', item, {
                            calendars: calendars,
                        }) }

                        {secondaryFields.includes('files') && renderFields('files', item)}


                        {(showRelatedPlanningLink) && (
                            <span
                                className="sd-overflow-ellipsis sd-list-item__element-lm-10"
                            >
                                <a
                                    className="sd-line-input__input--related-item-link"
                                    onClick={toggleRelatedPlanning}
                                >
                                    <i className="icon-calendar" />
                                    <span className="sd-margin-l--0-5">
                                        {this.props.relatedPlanningText}
                                    </span>
                                </a>
                            </span>
                        )}

                        {secondaryFields.includes('location') && renderFields('location', item)}
                    </Row>
                </Column>
                <EventDateTimeColumn
                    item={item}
                    multiRow={listViewType === LIST_VIEW_TYPE.LIST}
                />
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
                {this.renderItemActions()}
            </Item>
        );
    }
}

export const EventItem = connect()(EventItemComponent);
