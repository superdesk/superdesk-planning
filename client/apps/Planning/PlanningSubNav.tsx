import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import * as actions from '../../actions';
import * as selectors from '../../selectors';
import {ITEM_TYPE} from '../../constants';
import {SubNavBar, FiltersBar} from '../../components/Main';
import {ArchiveItem} from '../../components/Archive';

export const PlanningSubNavComponent = ({
    filtersOpen,
    toggleFilterPanel,
    addEvent,
    addPlanning,
    openAgendas,
    openFeaturedPlanningModal,
    openEventsPlanningFiltersModal,
    fullText,
    search,
    activeFilter,
    filter,
    isViewFiltered,
    clearSearch,
    withArchiveItem,
    archiveItem,
    showFilters,
    createPlanningOnly,
    currentStartFilter,
    setStartFilter,
    privileges,
}) => (
    <div>
        {withArchiveItem && <ArchiveItem item={archiveItem} />}
        <SubNavBar
            addEvent={addEvent}
            addPlanning={addPlanning}
            openAgendas={openAgendas}
            openFeaturedPlanningModal={openFeaturedPlanningModal}
            openEventsPlanningFiltersModal={openEventsPlanningFiltersModal}
            value={fullText}
            search={search}
            activeFilter={activeFilter}
            isViewFiltered={isViewFiltered}
            clearSearch={clearSearch}
            createPlanningOnly={createPlanningOnly}
            currentStartFilter={currentStartFilter}
            setStartFilter={setStartFilter}
            privileges={privileges}
        />
        <FiltersBar
            filterPanelOpen={filtersOpen}
            toggleFilterPanel={toggleFilterPanel}
            activeFilter={activeFilter}
            setFilter={filter}
            showFilters={showFilters}
        />
    </div>
);

PlanningSubNavComponent.propTypes = {
    filtersOpen: PropTypes.bool,
    toggleFilterPanel: PropTypes.func,
    addEvent: PropTypes.func,
    addPlanning: PropTypes.func,
    openAgendas: PropTypes.func,
    openEventsPlanningFiltersModal: PropTypes.func,
    fullText: PropTypes.string,
    search: PropTypes.func.isRequired,
    activeFilter: PropTypes.string.isRequired,
    filter: PropTypes.func.isRequired,
    isViewFiltered: PropTypes.bool,
    clearSearch: PropTypes.func,
    withArchiveItem: PropTypes.bool,
    showFilters: PropTypes.bool,
    createPlanningOnly: PropTypes.bool,
    archiveItem: PropTypes.object,
    currentStartFilter: PropTypes.object,
    setStartFilter: PropTypes.func,
    privileges: PropTypes.object,
    openFeaturedPlanningModal: PropTypes.func,
};

PlanningSubNavComponent.defaultProps = {showFilters: true};

const mapStateToProps = (state) => ({
    fullText: selectors.main.fullText(state),
    activeFilter: selectors.main.activeFilter(state),
    isViewFiltered: selectors.main.isViewFiltered(state),
    currentStartFilter: selectors.main.currentStartFilter(state),
    privileges: selectors.general.privileges(state),
});

const mapDispatchToProps = (dispatch) => ({
    openAgendas: () => dispatch(actions.openAgenda()),
    search: (searchText) => dispatch(actions.main.search(searchText)),
    filter: (filterType) => dispatch(actions.main.filter(filterType)),
    clearSearch: () => dispatch(actions.main.clearSearch()),
    addEvent: () => dispatch(actions.main.createNew(ITEM_TYPE.EVENT)),
    addPlanning: () => dispatch(actions.main.createNew(ITEM_TYPE.PLANNING)),
    setStartFilter: (start) => dispatch(actions.main.setStartFilter(start)),
    openFeaturedPlanningModal: () => dispatch(actions.planning.featuredPlanning.openFeaturedPlanningModal()),
    openEventsPlanningFiltersModal: () => dispatch(actions.eventsPlanning.ui.openFilters()),
});

export const PlanningSubNav = connect(mapStateToProps, mapDispatchToProps)(PlanningSubNavComponent);
