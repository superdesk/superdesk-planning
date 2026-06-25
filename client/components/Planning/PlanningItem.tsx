import React from 'react';
import {connect} from 'react-redux';
import {get, isEqual} from 'lodash';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';
import {Menu} from 'superdesk-ui-framework/react';

import {superdeskApi, planningApi} from '../../superdeskApi';
import {
    IPlanningListItemProps,
    LIST_VIEW_TYPE,
    SORT_FIELD,
    IPlanningNewsCoverageStatus,
    IEventItem
} from '../../interfaces';
import {PLANNING, EVENTS, MAIN, ICON_COLORS, WORKFLOW_STATE} from '../../constants';

import {Label} from '../';
import {Item, Border, ItemType, PubStatus, Column, Row} from '../UI/List';
import {Button as NavButton} from '../UI/Nav';
import Icon from '../UI/IconMix';
import {EventDateTime} from '../Events';
import {CreatedUpdatedColumn} from '../UI/List/CreatedUpdatedColumn';
import {CoverageAddAdvancedModal} from '../Coverages/CoverageAddAdvancedModal';

import {
    eventUtils,
    planningUtils,
    lockUtils,
    onEventCapture,
    isItemPosted,
    getItemId,
    isItemExpired,
    isItemDifferent,
    getItemWorkflowState,
    gettext,
} from '../../utils';
import {renderFields} from '../fields';
import * as actions from '../../actions';
import * as selectors from '../../selectors';
import planningApis from '../../actions/planning/api';
import {getUserInterfaceLanguageFromCV} from '../../utils/users';

interface IState {
    hover: boolean;
    showCoverageModal: boolean;
    lockedItem: IPlanningListItemProps['item'] | null; // Store the locked item with updated _etag
}

interface IReduxStateProps {
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;
    coverageAddAdvancedMode: boolean;
    events: {[key: string]: IEventItem};
}

interface IProps extends IPlanningListItemProps, IReduxStateProps {
    dispatch(action: any): any;
}

class PlanningItemComponent extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);
        this.state = {hover: false, showCoverageModal: false, lockedItem: null};

        this.onAddCoverageButtonClick = this.onAddCoverageButtonClick.bind(this);
        this.onItemHoverOn = this.onItemHoverOn.bind(this);
        this.onItemHoverOff = this.onItemHoverOff.bind(this);
        this.renderItemActions = this.renderItemActions.bind(this);
        this.openCoverageModal = this.openCoverageModal.bind(this);
        this.closeCoverageModal = this.closeCoverageModal.bind(this);
    }

    // Attempt to unlock the item if the modal is open when the page is closing/reloading
    private handleBeforeUnload = () => {
        if (!this.state.showCoverageModal) return;

        const itemToUnlock = this.state.lockedItem || this.props.item;

        if (itemToUnlock) {
            try {
                planningApi.locks.unlockItem(itemToUnlock).catch(() => undefined);
            } catch (e) {
                // ignore
            }
        }
    };

    componentDidUpdate(prevProps: Readonly<IProps>, prevState: Readonly<IState>) {
        if (prevState.showCoverageModal !== this.state.showCoverageModal) {
            if (this.state.showCoverageModal) {
                window.addEventListener('beforeunload', this.handleBeforeUnload);
            } else {
                window.removeEventListener('beforeunload', this.handleBeforeUnload);
            }
        }
    }

    componentWillUnmount() {
        window.removeEventListener('beforeunload', this.handleBeforeUnload);

        // Also best-effort unlock if still open when unmounting
        if (this.state.showCoverageModal) {
            const itemToUnlock = this.state.lockedItem || this.props.item;

            if (itemToUnlock) {
                try {
                    planningApi.locks.unlockItem(itemToUnlock).catch(() => undefined);
                } catch (e) {
                    // ignore
                }
            }
        }
    }

    onAddCoverageButtonClick(event) {
        onEventCapture(event);
        this.props.onAddCoverageClick();
    }

    shouldComponentUpdate(nextProps: Readonly<IProps>, nextState: Readonly<IState>) {
        return isItemDifferent(this.props, nextProps) ||
            this.state.hover !== nextState.hover ||
            this.state.showCoverageModal !== nextState.showCoverageModal ||
            !isEqual(
                planningUtils.getAgendaNames(this.props.item, this.props.agendas),
                planningUtils.getAgendaNames(nextProps.item, nextProps.agendas)
            ) ||
            this.props.minTimeWidth !== nextProps.minTimeWidth ||
            this.props.filterLanguage !== nextProps.filterLanguage ||
            this.props.isAgendaEnabled !== nextProps.isAgendaEnabled;
    }

    onItemHoverOn() {
        this.setState({hover: true});
    }

    onItemHoverOff() {
        this.setState({hover: false});
    }

    openCoverageModal() {
        const {item} = this.props;

        // Lock the planning item before opening the modal
        planningApi.locks.lockItem(item, 'edit_coverages')
            .then((lockedItem) => {
                // Store the locked item with updated _etag
                this.setState({showCoverageModal: true, lockedItem: lockedItem});
            })
            .catch((error) => {
                console.error('Failed to lock planning item:', error);

                const message = gettext(
                    'Unable to edit coverages. This planning item is currently locked by another user. ' +
                    'Please try again later or contact the user to release the lock.'
                );

                superdeskApi.ui.alert(message);
            });
    }

    closeCoverageModal() {
        const {lockedItem} = this.state;
        const itemToUnlock = lockedItem || this.props.item;

        this.setState({showCoverageModal: false, lockedItem: null});

        // Unlock the planning item after closing the modal
        planningApi.locks.unlockItem(itemToUnlock)
            .catch((error) => {
                console.error('Failed to unlock planning item:', error);
            });
    }

    onCoverageModalSave = (field: string, value: any) => {
        // Use the locked item (with updated _etag) for saving
        const itemToSave = this.state.lockedItem || this.props.item;

        const coveragesToSave = Array.isArray(value)
            ? value.filter((coverage) => coverage.workflow_status !== WORKFLOW_STATE.SPIKED)
            : value;

        // Save the planning item with updated coverages
        this.props.dispatch(planningApis.save(itemToSave, {[field]: coveragesToSave}))
            .then((savedItem) => {
                // Update lockedItem with saved item for proper unlock
                this.setState({lockedItem: savedItem || itemToSave});
                // Refresh the planning item in the store so updated coverages are visible
                this.props.dispatch(planningApis.receivePlannings([savedItem]));
                // Use saved item (with updated _etag) to unlock
                return planningApi.locks.unlockItem(savedItem || itemToSave);
            })
            .then(() => {
                // Close modal after unlock is complete
                this.setState({showCoverageModal: false, lockedItem: null});
            })
            .catch((error) => {
                console.error('Failed to save coverages:', error);
                // Still try to unlock even if save failed
                const itemToUnlock = this.state.lockedItem || this.props.item;

                planningApi.locks.unlockItem(itemToUnlock)
                    .finally(() => {
                        this.setState({showCoverageModal: false, lockedItem: null});
                    });
            });
    };

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
            // Only add Edit Coverages action if item is not locked by someone else
            ...(!lockUtils.isLockRestricted(item, session, lockedItems) ? {
                [PLANNING.ITEM_ACTIONS.ADD_COVERAGE_ADVANCED.actionName]: this.openCoverageModal,
            } : {}),
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
            listFields,
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
        const event = get(item, 'event');
        const borderState = isItemLocked ? 'locked' : false;
        const isExpired = isItemExpired(item);
        const secondaryFields = get(listFields, 'planning.secondary_fields', PLANNING.LIST.SECONDARY_FIELDS)
            .filter((fields) => isAgendaEnabled ? true : fields !== 'agendas');

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
                                PLANNING.LIST.PRIMARY_FIELDS), item, {}, language)}
                        </span>

                        {event && (
                            <span className="sd-no-wrap">
                                <Icon className="icon-event" color={ICON_COLORS.DARK_BLUE_GREY} />&nbsp;
                                <EventDateTime item={event} />
                            </span>
                        )}
                    </Row>
                    <Row classes="sd-overflow--visible"> {/** overflow is needed for coverage icons */}
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
                            filterLanguage,
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
                {this.state.showCoverageModal && (
                    <div onClick={(e) => e.stopPropagation()}> {/* avoid opening preview on click in the modal */}
                        <CoverageAddAdvancedModal
                            onCancel={this.closeCoverageModal}
                            contentTypes={contentTypes}
                            newsCoverageStatus={this.props.newsCoverageStatus}
                            field="coverages"
                            value={get(item, 'coverages', [])}
                            onSave={this.onCoverageModalSave}
                            createCoverage={(qcode) => {
                                const eventItem = item.event_item ? this.props.events[item.event_item] : undefined;

                                return planningApi.planning.coverages.setDefaultValues(item, eventItem, qcode);
                            }}
                            users={users}
                            desks={desks}
                            coverageAddAdvancedMode={this.props.coverageAddAdvancedMode}
                        />
                    </div>
                )}
                {this.renderItemActions()}
            </Item>
        );
    }
}

const mapStateToProps = (state) => ({
    newsCoverageStatus: selectors.general.newsCoverageStatus(state),
    coverageAddAdvancedMode: selectors.general.coverageAddAdvancedMode(state),
    events: selectors.events.storedEvents(state),
});

export const PlanningItem = connect(mapStateToProps)(PlanningItemComponent);
