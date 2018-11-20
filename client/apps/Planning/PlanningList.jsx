import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {indexOf} from 'lodash';

import * as actions from '../../actions';
import * as selectors from '../../selectors';
import {getItemType} from '../../utils';
import actionUtils from '../../utils/actions';
import {ITEM_TYPE} from '../../constants';

import {ListPanel} from '../../components/Main';

export class PlanningListComponent extends React.Component {
    constructor(props) {
        super(props);

        this.handleItemSelection = this.handleItemSelection.bind(this);
    }

    handleItemSelection(item) {
        let selectedList = this.props.selectedEventIds;
        let multiSelectDispatch = this.props.multiSelectEvent;

        if (getItemType(item) === ITEM_TYPE.PLANNING) {
            selectedList = this.props.selectedPlanningIds;
            multiSelectDispatch = this.props.multiSelectPlanning;
        }

        const deSelect = indexOf(selectedList, item._id) !== -1;

        multiSelectDispatch(item._id, deSelect);
    }

    render() {
        const {
            groups,
            agendas,
            lockedItems,
            dateFormat,
            timeFormat,
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
        } = this.props;

        return (
            <ListPanel
                groups={groups}
                onItemClick={openPreview}
                onDoubleClick={edit}
                agendas={agendas}
                lockedItems={lockedItems}
                dateFormat={dateFormat}
                timeFormat={timeFormat}
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
            />
        );
    }
}

PlanningListComponent.propTypes = {
    groups: PropTypes.array,
    previewOpen: PropTypes.bool,
    openPreview: PropTypes.func,
    edit: PropTypes.func,
    agendas: PropTypes.array.isRequired,
    lockedItems: PropTypes.object.isRequired,
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
    session: PropTypes.object,
    privileges: PropTypes.object,
    activeFilter: PropTypes.string.isRequired,
    onAddCoverageClick: PropTypes.func,
    selectedEventIds: PropTypes.array,
    selectedPlanningIds: PropTypes.array,
    multiSelectEvent: PropTypes.func,
    multiSelectPlanning: PropTypes.func,
    showRelatedPlannings: PropTypes.func,
    relatedPlanningsInList: PropTypes.object,
    loadMore: PropTypes.func,
    filter: PropTypes.func.isRequired,
    loadingIndicator: PropTypes.bool,
    desks: PropTypes.array,
    users: PropTypes.array,
    itemActions: PropTypes.object,
    hideItemActions: PropTypes.bool,
    showAddCoverage: PropTypes.bool,
    calendars: PropTypes.array,
    listFields: PropTypes.object,
    isAllListItemsLoaded: PropTypes.bool,
};

const mapStateToProps = (state) => ({
    groups: selectors.main.itemGroups(state),
    agendas: selectors.general.agendas(state),
    lockedItems: selectors.locks.getLockedItems(state),
    dateFormat: selectors.config.getDateFormat(state),
    timeFormat: selectors.config.getTimeFormat(state),
    session: selectors.general.session(state),
    privileges: selectors.general.privileges(state),
    activeFilter: selectors.main.activeFilter(state),
    selectedEventIds: selectors.multiSelect.selectedEventIds(state),
    selectedPlanningIds: selectors.multiSelect.selectedPlanningIds(state),
    relatedPlanningsInList: selectors.eventsPlanning.getRelatedPlanningsInList(state),
    loadingIndicator: selectors.main.loadingIndicator(state),
    users: selectors.general.users(state),
    desks: selectors.general.desks(state),
    calendars: selectors.events.enabledCalendars(state),
    listFields: selectors.forms.listFields(state),
    isAllListItemsLoaded: selectors.main.isAllListItemsLoaded(state),
});

const mapDispatchToProps = (dispatch) => ({
    openPreview: (item) => dispatch(actions.main.openPreview(item)),
    edit: (item) => dispatch(actions.main.lockAndEdit(item)),
    onAddCoverageClick: (item) => dispatch(actions.planning.ui.onAddCoverageClick(item)),
    multiSelectEvent: (eventId, deselect = false) => dispatch(deselect ?
        actions.multiSelect.deSelectEvents(eventId) :
        actions.multiSelect.selectEvents(eventId)
    ),
    multiSelectPlanning: (planningId, deselect = false) => dispatch(deselect ?
        actions.multiSelect.deSelectPlannings(planningId) :
        actions.multiSelect.selectPlannings(planningId)
    ),
    showRelatedPlannings: (event) => dispatch(
        actions.eventsPlanning.ui.showRelatedPlannings(event)
    ),
    loadMore: (filterType) => dispatch(actions.main.loadMore(filterType)),
    filter: (filterType) => dispatch(actions.main.filter(filterType)),

    itemActions: actionUtils.getActionDispatches({dispatch: dispatch}),
});

export const PlanningList = connect(
    mapStateToProps,
    mapDispatchToProps
)(PlanningListComponent);
