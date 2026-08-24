import React from 'react';
import {connect} from 'react-redux';
import {get, isEqual} from 'lodash';
import moment from 'moment';
import {Menu, Tooltip} from 'superdesk-ui-framework/react';

import {superdeskApi, planningApi} from '../../superdeskApi';
import {
    IPlanningListItemProps,
    GROUP_LIST_BY,
    SORT_FIELD,
    IPlanningNewsCoverageStatus,
} from '../../interfaces';
import {PLANNING, EVENTS, MAIN, ICON_COLORS, WORKFLOW_STATE} from '../../constants';

import {Item, Border, ItemType, PubStatus, Column, Row} from '../UI/List';
import {Button as NavButton} from '../UI/Nav';
import {CreatedUpdatedColumn} from '../UI/List/CreatedUpdatedColumn';
import {CoverageAddAdvancedModal} from '../Coverages/CoverageAddAdvancedModal';

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
import * as selectors from '../../selectors';
import planningApis from '../../actions/planning/api';
import {getUserInterfaceLanguageFromCV} from '../../utils/users';
import {LineItems} from '../../components/UI/List/LineItems';
import {getPlanningSecondLineConfig, planningFirstLineConfig} from '../../config';
import {getRelatedEventIdsForPlanning} from '../../utils/planning';
import {ILineConfig} from 'globals';

interface IState {
    hover: boolean;
    showCoverageModal: boolean;
    lockedItem: IPlanningListItemProps['item'] | null; // Store the locked item with updated _etag
}

interface IReduxStateProps {
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;
    coverageAddAdvancedMode: boolean;
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
        this.openCoverageModal = this.openCoverageModal.bind(this);
        this.closeCoverageModal = this.closeCoverageModal.bind(this);
        this.renderItemActions = this.renderItemActions.bind(this);
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
            this.props.isAgendaEnabled !== nextProps.isAgendaEnabled ||
            this.props.relatedEventsUI?.visible !== nextProps.relatedEventsUI?.visible;
    }

    onItemHoverOn() {
        this.setState({hover: true});
    }

    onItemHoverOff() {
        this.setState({hover: false});
    }

    openCoverageModal() {
        const {gettext} = superdeskApi.localization;
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
                events: [event], // TAG: MULTIPLE_PRIMARY_EVENTS
                session: session,
                privileges: privileges,
                lockedItems: lockedItems,
                agendas: agendas,
                contentTypes: contentTypes,
                callBacks: itemActionsCallBack,
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
        const {
            item,
            onItemClick,
            lockedItems,
            date,
            onMultiSelectClick,
            multiSelected,
            activeFilter,
            showAddCoverage,
            active,
            refNode,
            groupListBy,
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

        const renderFieldsWithProps = (fields: Array<ILineConfig>) => renderFields(
            fields,
            item,
            {
                fieldsProps: {
                    related_events: {
                        relatedEventsUI: this.props.relatedEventsUI,
                    },
                    coverages: {
                        prepare: (coverages) => { // removing coverages that do not match page filters
                            const coveragesMapped = planningUtils.mapCoverageByDate(coverages);
                            const hasAssociatedEvent = getRelatedEventIdsForPlanning(item).length > 0;

                            const isSameDay = (scheduled) =>
                                scheduled && (date == null || moment(scheduled).format('YYYY-MM-DD') === date);

                            const coverageToDisplay = coveragesMapped.filter((coverage) => {
                                const scheduled = get(coverage, 'planning.scheduled');

                                // Display only the coverages that match the active filter language
                                if (
                                    filterLanguage !== ''
                                    && filterLanguage != null
                                    && coverage.planning.language != filterLanguage
                                ) {
                                    return false;
                                }

                                if (activeFilter === MAIN.FILTERS.COMBINED) {
                                    // Display if it has an associated event
                                    // or if adhoc planning has coverage on that date
                                    if (hasAssociatedEvent || isSameDay(scheduled)) {
                                        return true;
                                    }
                                } else if (scheduled && isSameDay(scheduled)) {
                                    // Planning-only view - display only coverage of the particular date
                                    return true;
                                }

                                return false;
                            });

                            return coverageToDisplay;
                        },
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
                    hasCheck={this.props.hideItemActions === true ? false : activeFilter !== MAIN.FILTERS.COMBINED}
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
                    <LineItems
                        firstLine={this.props.customTemplate?.firstLine ?? planningFirstLineConfig}
                        secondLine={
                            this.props.customTemplate?.secondLine ?? getPlanningSecondLineConfig({isAgendaEnabled})
                        }
                        renderFieldsWithProps={renderFieldsWithProps}
                    />
                </Column>

                {groupListBy === GROUP_LIST_BY.DATE ? null : (
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
                        <Tooltip
                            content={gettext('Add as coverage')}
                            placement="left"
                        >
                            <NavButton
                                className="dropdown sd-create-btn"
                                aria-label={gettext('Add as coverage')}
                                onClick={this.onAddCoverageButtonClick}
                                icon="icon-plus-large"
                            >
                                <span className="circle" />
                            </NavButton>
                        </Tooltip>
                    </Column>
                )}
                {this.state.showCoverageModal && (
                    <div onClick={(e) => e.stopPropagation()}> {/* avoid opening preview on click in the modal */}
                        <CoverageAddAdvancedModal
                            onCancel={this.closeCoverageModal}
                            contentTypes={this.props.contentTypes}
                            newsCoverageStatus={this.props.newsCoverageStatus}
                            field="coverages"
                            value={get(item, 'coverages', [])}
                            onSave={this.onCoverageModalSave}
                            createCoverage={(qcode) => ({
                                planning: {
                                    g2_content_type: qcode,
                                    language: null,
                                },
                                workflow_status: 'draft',
                            })}
                            users={this.props.users}
                            desks={this.props.desks}
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
});

export const PlanningItem = connect(mapStateToProps)(PlanningItemComponent);
