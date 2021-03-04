import React from 'react';
import {connect} from 'react-redux';
import {indexOf} from 'lodash';

import {IDesk, IUser} from 'superdesk-api';
import {
    FILTER_TYPE,
    IAgenda,
    ICalendar,
    IEventItem,
    ILockedItems,
    IPlanningItem,
    ISession,
    IEventOrPlanningItem,
    IG2ContentType,
    LIST_VIEW_TYPE,
    IContactItem,
    SORT_FIELD,
} from '../../interfaces';

import * as actions from '../../actions';
import * as selectors from '../../selectors';
import {getItemType} from '../../utils';
import actionUtils from '../../utils/actions';
import {ITEM_TYPE} from '../../constants';

import {ListPanel} from '../../components/Main';
import {PlanningListSubNav} from './PlanningListSubNav';

interface IProps {
    groups: Array<{
        date?: string;
        events: Array<IEventOrPlanningItem>;
    }>;
    previewOpen?: boolean;
    agendas: Array<IAgenda>;
    lockedItems: ILockedItems;
    session: ISession;
    privileges: {[key: string]: number};
    activeFilter: FILTER_TYPE;
    selectedEventIds?: Array<IEventItem['_id']>;
    selectedPlanningIds?: Array<IPlanningItem['_id']>;
    relatedPlanningsInList?: {[key: string]: Array<IPlanningItem>}; // Map Event Ids to Related Plannings
    loadingIndicator: boolean;
    desks: Array<IDesk>;
    users: Array<IUser>;
    itemActions: {[key: string]: () => void}; // List of item action dispatches (i.e. Cancel Event)
    hideItemActions?: boolean;
    showAddCoverage?: boolean;
    calendars: Array<ICalendar>;
    listFields?: {[key: string]: { // List fields from planning_types collection (i.e. Planning Profiles)
        primary_fields?: Array<string>;
        secondary_fields?: Array<string>;
    }};
    isAllListItemsLoaded: boolean;
    previewId: IEventOrPlanningItem['_id'];
    contentTypes: Array<IG2ContentType>;
    userInitiatedSearch?: boolean;
    contacts: {[key: string]: IContactItem};
    listViewType: LIST_VIEW_TYPE;
    sortField: SORT_FIELD;

    openPreview(item: IEventOrPlanningItem): void;
    edit(item: IEventOrPlanningItem): void;
    onAddCoverageClick(item: IPlanningItem): void;
    multiSelectEvent(eventId: IEventItem['_id'], deselect?: boolean, shiftKey?: boolean, name?: string): void;
    multiSelectPlanning(planId: IPlanningItem['_id'], deselect?: boolean, shiftKey?: boolean, name?: string): void;
    showRelatedPlannings(item: IEventItem): void;
    loadMore(viewType: FILTER_TYPE): Promise<any>;
    filter(viewType: FILTER_TYPE): Promise<any>;
}

const mapStateToProps = (state) => ({
    groups: selectors.main.itemGroups(state),
    agendas: selectors.general.agendas(state),
    lockedItems: selectors.locks.getLockedItems(state),
    session: selectors.general.session(state),
    privileges: selectors.general.privileges(state),
    activeFilter: selectors.main.activeFilter(state),
    selectedEventIds: selectors.multiSelect.selectedEventIds(state),
    selectedPlanningIds: selectors.multiSelect.selectedPlanningIds(state),
    relatedPlanningsInList: selectors.eventsPlanning.getRelatedPlanningsInList(state),
    loadingIndicator: selectors.main.loadingIndicator(state),
    users: selectors.general.users(state),
    desks: selectors.general.desks(state),
    calendars: selectors.events.calendars(state),
    listFields: selectors.forms.listFields(state),
    isAllListItemsLoaded: selectors.main.isAllListItemsLoaded(state),
    previewId: selectors.main.previewId(state),
    contentTypes: selectors.general.contentTypes(state),
    userInitiatedSearch: selectors.main.userInitiatedSearch(state),
    contacts: selectors.general.contactsById(state),
    listViewType: selectors.main.getCurrentListViewType(state),
    sortField: selectors.main.getCurrentSortField(state),
});

const mapDispatchToProps = (dispatch) => ({
    openPreview: (item) => dispatch(actions.main.openPreview(item)),
    edit: (item) => dispatch(actions.main.openForEdit(item)),
    onAddCoverageClick: (item) => dispatch(actions.planning.ui.onAddCoverageClick(item)),
    multiSelectEvent: (eventId, deselect = false, shiftKey = false, name = '') => dispatch(deselect ?
        actions.multiSelect.deSelectEvents(eventId) :
        actions.multiSelect.selectEvents(eventId, false, shiftKey, name)
    ),
    multiSelectPlanning: (planningId, deselect = false, shiftKey = false, name = '') => dispatch(deselect ?
        actions.multiSelect.deSelectPlannings(planningId) :
        actions.multiSelect.selectPlannings(planningId, false, shiftKey, name)
    ),
    showRelatedPlannings: (event) => dispatch(
        actions.eventsPlanning.ui.showRelatedPlannings(event)
    ),
    loadMore: (filterType) => dispatch(actions.main.loadMore(filterType)),
    filter: (filterType) => dispatch(actions.main.filter(filterType)),

    itemActions: actionUtils.getActionDispatches({dispatch: dispatch}),
});

export class PlanningListComponent extends React.PureComponent<IProps> {
    constructor(props) {
        super(props);

        this.handleItemSelection = this.handleItemSelection.bind(this);
    }

    handleItemSelection(item: IEventOrPlanningItem, value: boolean, shiftKey: boolean, name: string) {
        let selectedList = this.props.selectedEventIds;
        let multiSelectDispatch = this.props.multiSelectEvent;

        if (getItemType(item) === ITEM_TYPE.PLANNING) {
            selectedList = this.props.selectedPlanningIds;
            multiSelectDispatch = this.props.multiSelectPlanning;
        }

        const deSelect = indexOf(selectedList, item._id) !== -1;

        multiSelectDispatch(item._id, deSelect, shiftKey, name);
    }

    render() {
        const {
            groups,
            agendas,
            lockedItems,
            session,
            privileges,
            calendars,
            activeFilter,
            onAddCoverageClick,
            selectedEventIds,
            selectedPlanningIds,
            showRelatedPlannings,
            relatedPlanningsInList,
            loadMore,
            filter,
            loadingIndicator,
            desks,
            users,
            openPreview,
            edit,
            itemActions,
            hideItemActions,
            showAddCoverage,
            listFields,
            isAllListItemsLoaded,
            previewId,
            contentTypes,
            userInitiatedSearch,
            contacts,
            listViewType,
            sortField,
        } = this.props;

        return (
            <React.Fragment>
                <PlanningListSubNav />
                <ListPanel
                    groups={groups}
                    onItemClick={openPreview}
                    onDoubleClick={edit}
                    agendas={agendas}
                    lockedItems={lockedItems}
                    session={session}
                    privileges={privileges}
                    activeFilter={activeFilter}
                    onAddCoverageClick={onAddCoverageClick}
                    onMultiSelectClick={this.handleItemSelection}
                    selectedEventIds={selectedEventIds}
                    selectedPlanningIds={selectedPlanningIds}
                    showRelatedPlannings={showRelatedPlannings}
                    relatedPlanningsInList={relatedPlanningsInList}
                    loadMore={loadMore}
                    filter={filter}
                    loadingIndicator={loadingIndicator}
                    desks={desks}
                    users={users}
                    itemActions={itemActions}
                    hideItemActions={hideItemActions}
                    showAddCoverage={showAddCoverage}
                    calendars={calendars}
                    listFields={listFields}
                    isAllListItemsLoaded={isAllListItemsLoaded}
                    previewItem={previewId}
                    contentTypes={contentTypes}
                    userInitiatedSearch={userInitiatedSearch}
                    contacts={contacts}
                    listViewType={listViewType}
                    sortField={sortField}
                    indexItems
                />
            </React.Fragment>
        );
    }
}

export const PlanningList = connect(
    mapStateToProps,
    mapDispatchToProps
)(PlanningListComponent);
