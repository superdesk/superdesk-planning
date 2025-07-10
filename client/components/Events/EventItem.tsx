import React from 'react';
import {connect} from 'react-redux';
import {get} from 'lodash';
import {Menu, Spacer} from 'superdesk-ui-framework/react';
import {superdeskApi} from '../../superdeskApi';
import {appConfig} from 'appConfig';
import {IEventListItemProps, LIST_VIEW_TYPE, PLANNING_VIEW, SORT_FIELD} from '../../interfaces';

import {EVENTS, ICON_COLORS, WORKFLOW_STATE} from '../../constants';

import {Border, Column, Item, ItemType, PubStatus, Row} from '../UI/List';
import {
    eventUtils,
    getItemWorkflowState,
    isItemDifferent,
    isItemExpired,
    isItemPosted,
    onEventCapture,
    lockUtils,
} from '../../utils';
import {renderFields} from '../fields';
import {CreatedUpdatedColumn} from '../UI/List/CreatedUpdatedColumn';
import {EventDateTimeColumn} from './EventDateTimeColumn';
import * as actions from '../../actions';
import {getUserInterfaceLanguageFromCV} from '../../utils/users';
import {ILineConfig} from 'globals';
import {partitionLineItems} from '../../helpers';

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
            this.props.minTimeWidth !== nextProps.minTimeWidth ||
            this.props.lockedItems != nextProps.lockedItems ||
            (this.props.relatedEventsUI && this.props.relatedEventsUI.visible != nextProps.relatedEventsUI.visible) ||
            this.props.filterLanguage !== nextProps.filterLanguage;
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
            <div>
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
            </div>
        );
    }

    render() {
        const {gettext, gettextPlural} = superdeskApi.localization;
        const {querySelectorParent} = superdeskApi.utilities;

        const {
            item,
            onItemClick,
            lockedItems,
            activeFilter,
            onMultiSelectClick,
            calendars,
            active,
            refNode,
            listViewType,
            filterLanguage
        } = this.props;

        if (!item) {
            return null;
        }

        const hasPlanning = eventUtils.eventHasPlanning(item);
        const isItemLocked = lockUtils.isItemLocked(item, lockedItems);
        let borderState: 'locked' | 'active' | false = false;

        if (isItemLocked) {
            borderState = 'locked';
        } else if (hasPlanning) {
            borderState = 'active';
        }


        const isExpired = isItemExpired(item);

        const firstLineDefaults: Array<ILineConfig> = [
            {fieldId: 'slugline'},
            {fieldId: 'internalnote'},
            {fieldId: 'name'},
        ];

        const secondLineDefaults: Array<ILineConfig> = [
            {fieldId: 'expired'},
            {fieldId: 'state'},
            {fieldId: 'actionedState'},
            {fieldId: 'event_completed'},
            {fieldId: 'calendars'},
            {fieldId: 'related_plannings'},
            {fieldId: 'location'},
        ];

        const renderFieldsWithProps = (fields: Array<string>) => renderFields(
            fields,
            item,
            {
                fieldsProps: {
                    actionedState: {
                        onClick: (e) => {
                            onEventCapture(e);
                            onItemClick({
                                _id: item.reschedule_from,
                                type: 'event',
                            });
                        },
                    },
                    calendars: {
                        calendars: calendars,
                        language: language,
                    },
                    related_plannings: {
                        relatedEventsUI: this.props.relatedEventsUI,
                        relatedPlanningsCount: this.props.relatedPlanningsCount,
                    },
                },
            },
            language,
        );

        const firstLine = appConfig.planning?.event_list_item?.firstLine ?? firstLineDefaults;
        const secondLine = appConfig.planning?.event_list_item?.secondLine ?? secondLineDefaults;

        const [firstLineStart, firstLineEnd] = partitionLineItems(firstLine);
        const [secondLineStart, secondLineEnd] = partitionLineItems(secondLine);

        const language = filterLanguage || item.language || getUserInterfaceLanguageFromCV();

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
                draggable={!isItemLocked}
                onDragStart={(dragEvent) => {
                    dragEvent.dataTransfer.setData('application/superdesk.planning.event', JSON.stringify(item));
                    dragEvent.dataTransfer.effectAllowed = 'link';
                }}
            >
                <Border state={borderState} />

                <ItemType
                    item={item}
                    hasCheck={this.props.multiSelectDisabled !== true && activeFilter !== PLANNING_VIEW.COMBINED}
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
                    <Spacer h gap="8" justifyContent="space-between" noWrap noGrow>
                        <Spacer h gap="8" justifyContent="start" noWrap noGrow>
                            {renderFieldsWithProps(firstLineStart.map(({fieldId}) => fieldId))}
                        </Spacer>

                        <Spacer h gap="8" justifyContent="start" noWrap noGrow>
                            {renderFieldsWithProps(firstLineEnd.map(({fieldId}) => fieldId))}
                        </Spacer>
                    </Spacer>


                    <Spacer h gap="8" justifyContent="space-between" noWrap noGrow>
                        <Spacer h gap="8" justifyContent="start" noWrap noGrow>
                            {renderFieldsWithProps(secondLineStart.map(({fieldId}) => fieldId))}
                        </Spacer>

                        <Spacer h gap="8" justifyContent="start" noWrap noGrow>
                            {renderFieldsWithProps(secondLineEnd.map(({fieldId}) => fieldId))}
                        </Spacer>
                    </Spacer>
                </Column>

                <EventDateTimeColumn
                    item={item}
                    multiRow={listViewType === LIST_VIEW_TYPE.LIST}
                    planningProps={this.props.planningProps}
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
