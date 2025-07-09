import React from 'react';
import {connect} from 'react-redux';
import {get, isEqual, partition} from 'lodash';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';
import {Menu, Spacer} from 'superdesk-ui-framework/react';

import {superdeskApi} from '../../superdeskApi';
import {appConfig} from 'appConfig';
import {
    IPlanningListItemProps,
    LIST_VIEW_TYPE,
    SORT_FIELD
} from '../../interfaces';
import {PLANNING, EVENTS, MAIN, ICON_COLORS, WORKFLOW_STATE} from '../../constants';

import {Item, Border, ItemType, PubStatus, Column, Row} from '../UI/List';
import {Button as NavButton} from '../UI/Nav';
import {CreatedUpdatedColumn} from '../UI/List/CreatedUpdatedColumn';

import {
    planningUtils,
    lockUtils,
    onEventCapture,
    isItemPosted,
    getItemId,
    isItemExpired,
    isItemDifferent,
    getItemWorkflowState,
} from '../../utils';
import {renderFields} from '../fields';
import * as actions from '../../actions';
import {getUserInterfaceLanguageFromCV} from '../../utils/users';
import {ILineConfig} from 'globals';

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
            this.props.minTimeWidth !== nextProps.minTimeWidth ||
            this.props.filterLanguage !== nextProps.filterLanguage ||
            this.props.isAgendaEnabled !== nextProps.isAgendaEnabled ||
            this.props.relatedEventsUI?.visible !== nextProps.relatedEventsUI?.visible;
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
                events: [event], // TAG: MULTIPLE_PRIMARY_EVENTS
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
            active,
            refNode,
            contentTypes,
            agendas,
            contacts,
            listViewType,
            filterLanguage,
            isAgendaEnabled,
        } = this.props;

        if (!item) {
            return null;
        }

        const {gettext} = superdeskApi.localization;
        const isItemLocked = lockUtils.isItemLocked(item, lockedItems);
        const borderState = isItemLocked ? 'locked' : false;
        const isExpired = isItemExpired(item);

        const firstLine: Array<ILineConfig> = appConfig.planning?.planning_list_item?.firstLine ?? firstLineDefaults;
        const secondLine: Array<ILineConfig> =
            (appConfig.planning?.planning_list_item?.secondLine ?? secondLineDefaults)
                .filter((fields) => isAgendaEnabled ? true : fields !== 'agendas');

        const [firstLineStart, firstLineEnd] = partitionLineItems(firstLine);
        const [secondLineStart, secondLineEnd] = partitionLineItems(secondLine);

        const renderFieldsWithProps = (fields: Array<string>) => renderFields(
            fields,
            item,
            {
                fieldsProps: {
                    agendas: {
                        agendas: planningUtils.getAgendaNames(item, agendas),
                        noGrow: true,
                    },
                    related_events: {
                        relatedEventsUI: this.props.relatedEventsUI,
                    },
                    coverages: {
                        date,
                        users,
                        desks,
                        activeFilter,
                        contentTypes,
                        contacts,
                        filterLanguage,
                    },
                },
            },
            language,
        );

        const {querySelectorParent} = superdeskApi.utilities;
        const language = filterLanguage || item.language || getUserInterfaceLanguageFromCV();

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
                draggable={!isItemLocked}
                onDragStart={(dragEvent) => {
                    dragEvent.dataTransfer.setData(
                        'application/superdesk.planning.planning_item',
                        JSON.stringify(item),
                    );
                    dragEvent.dataTransfer.effectAllowed = 'link';
                }}
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

const partitionLineItems = (items: Array<ILineConfig>) => partition(items, ({position = 'start'}) => {
    if (position === 'start') {
        return true;
    } else if (position === 'end') {
        return false;
    } else {
        return superdeskApi.helpers.assertNever(position);
    }
});

const firstLineDefaults: Array<ILineConfig> = [
    {fieldId: 'slugline'},
    {fieldId: 'internalnote'},
    {fieldId: 'description'},
];

const secondLineDefaults: Array<ILineConfig> = [
    {fieldId: 'expired'},
    {fieldId: 'state'},
    {fieldId: 'event_completed'},
    {fieldId: 'featured'},
    {fieldId: 'agendas'},
    {fieldId: 'related_events'},
    {fieldId: 'coverages', position: 'end'},
];

export const PlanningItem = connect()(PlanningItemComponent);
