import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import classNames from 'classnames'
import { get, isObject } from 'lodash'
import * as actions from '../../actions'
import { ADVANCED_SEARCH_CONTEXT } from '../../constants'
import {
    SelectAgenda,
    EditPlanningPanelContainer,
    PlanningList,
} from '../index'
import { QuickAddPlanning, Toggle, SearchBar, AdvancedSearchPanelContainer } from '../../components'
import MultiSelectionActions from '../MultiSelectionActions'
import * as selectors from '../../selectors'
import { AGENDA } from '../../constants'
import { eventUtils, gettext } from '../../utils'
import './style.scss'

class PlanningPanel extends React.Component {

    handleDragEnter(e) {
        e.dataTransfer.dropEffect = 'copy'
    }

    handleEventDrop(e) {
        e.preventDefault()
        const event = JSON.parse(e.dataTransfer.getData('application/superdesk.item.events'))
        const canCreatePlanning = event && eventUtils.canCreatePlanningFromEvent(
            event,
            this.props.session,
            this.props.privileges
        )

        if (canCreatePlanning) {
            this.props.addEventToCurrentAgenda(event)
        }
    }

    toggleAdvancedSearch() {
        if (this.props.advancedSearchOpened) {
            this.props.closeAdvancedSearch()
        } else {
            this.props.openAdvancedSearch()
        }
    }

    render() {
        const {
            planningList,
            currentAgenda,
            currentAgendaId,
            onPlanningCreation,
            planningsAreLoading,
            editPlanningViewOpen,
            isEventListShown,
            toggleEventsList,
            onlyFuture,
            onFutureToggleChange,
            handleSearch,
            privileges,
            advancedSearchOpened,
            isAdvancedDateSearch,
            isAdvancedSearchSpecified,
            selected,
            selectAll,
            deselectAll,
            exportAsArticle,
        } = this.props

        const multiActions = [
            {
                name: gettext('Export as Article'),
                run: exportAsArticle,
            },
        ]

        return (
            <div className={classNames('Planning-panel',
                { 'Planning-panel--edit-planning-view': editPlanningViewOpen })}
                 onDrop={this.handleEventDrop.bind(this)}
                 onDragOver={(e) => e.preventDefault()}
                 onDragEnter={this.handleDragEnter.bind(this)}
                 onDragLeave={this.handleDragLeave}>
                <div className="subnav">
                    {!isEventListShown &&
                        <div className="navbtn" title="Show the event list">
                            <button onClick={toggleEventsList} type="button" className="backlink backlink--rotated" />
                        </div>
                    }
                    <h3 className="subnav__page-title">
                        <span>
                            <span>Agenda:</span>
                        </span>
                    </h3>
                    <div  className="Planning-panel__select-agenda">
                        <SelectAgenda />
                    </div>
                </div>
                <div className="Planning-panel__container">
                    <div className={classNames('Planning-panel__list',
                        { 'Planning-panel__list--advanced-search-view':  advancedSearchOpened })}>
                        <div className="Planning-panel__searchbar subnav">
                            <label
                                className="trigger-icon advanced-search-open"
                                onClick={this.toggleAdvancedSearch.bind(this)}>
                                <i className={classNames('icon-filter-large ',
                                    { 'icon--blue': isAdvancedSearchSpecified })} />
                            </label>
                            <SearchBar value={null} onSearch={handleSearch}/>
                            <label>
                                Only Future
                                <Toggle value={onlyFuture} onChange={onFutureToggleChange} readOnly={isAdvancedDateSearch} />
                            </label>
                        </div>
                        <AdvancedSearchPanelContainer searchContext={ADVANCED_SEARCH_CONTEXT.PLANNING} />

                        {(selected.length > 0) &&
                            <div className="Planning-panel__searchbar subnav">
                                <MultiSelectionActions
                                    actions={multiActions}
                                    selected={selected}
                                    selectAll={selectAll}
                                    deselectAll={deselectAll}
                                />
                            </div>
                        }

                        <div className="list-view compact-view">
                            {((currentAgendaId || currentAgenda && currentAgenda.is_enabled) &&
                            privileges.planning_planning_management === 1 ) &&
                                <QuickAddPlanning onPlanningCreation={onPlanningCreation}/>
                            }
                            {(planningList.length > 0) &&
                                <PlanningList selected={selected} />
                            }
                        </div>
                        {
                            planningsAreLoading &&
                                <div className="Planning-panel__empty-message">
                                    Loading
                                </div>
                            || !currentAgendaId &&
                                <div className="Planning-panel__empty-message">
                                    <div className="panel-info">
                                        <div className="panel-info__icon">
                                            <i className="big-icon--calendar" />
                                        </div>
                                        <h3 className="panel-info__heading">Choose an agenda</h3>
                                        <p className="panel-info__description">...from the drop-down list above.</p>
                                    </div>
                                </div>
                            || (planningList && planningList.length < 1 && currentAgendaId) &&
                                <div className="Planning-panel__empty-message">
                                    <div className="panel-info">
                                        <div className="panel-info__icon">
                                            <i className="big-icon--add-to-list" />
                                        </div>
                                        {currentAgendaId === AGENDA.FILTER.NO_AGENDA_ASSIGNED &&
                                        <h3 className="panel-info__heading">There are no planning items without an assigned agenda.</h3>}
                                        {currentAgendaId === AGENDA.FILTER.ALL_PLANNING &&
                                        <h3 className="panel-info__heading">There are no planning items.</h3>}
                                        {currentAgendaId !== AGENDA.FILTER.NO_AGENDA_ASSIGNED && currentAgendaId !== AGENDA.FILTER.ALL_PLANNING &&
                                        <h3 className="panel-info__heading">There are no planning items in this agenda.</h3>}
                                        <p className="panel-info__description">Drag an event here to create a planning item.</p>
                                    </div>
                                </div>
                        }
                    </div>
                    {editPlanningViewOpen && <EditPlanningPanelContainer /> }
                </div>
            </div>
        )
    }
}

PlanningPanel.propTypes = {
    currentAgendaId: PropTypes.string,
    currentAgenda: PropTypes.object,
    planningList: PropTypes.array.isRequired,
    planningsAreLoading: PropTypes.bool,
    onPlanningCreation: PropTypes.func,
    editPlanningViewOpen: PropTypes.bool,
    addEventToCurrentAgenda: PropTypes.func,
    toggleEventsList: PropTypes.func,
    isEventListShown: PropTypes.bool,
    onlyFuture: PropTypes.bool,
    onFutureToggleChange: PropTypes.func,
    handleSearch: PropTypes.func.isRequired,
    privileges: PropTypes.object.isRequired,
    advancedSearchOpened: PropTypes.bool,
    isAdvancedDateSearch: PropTypes.bool,
    isAdvancedSearchSpecified: PropTypes.bool,
    closeAdvancedSearch: PropTypes.func,
    openAdvancedSearch: PropTypes.func,
    session: PropTypes.object,
    selected: PropTypes.array.isRequired,
    selectAll: PropTypes.func,
    deselectAll: PropTypes.func,
    exportAsArticle: PropTypes.func,
}

const mapStateToProps = (state) => ({
    currentAgendaId: selectors.getCurrentAgendaId(state),
    currentAgenda: selectors.getCurrentAgenda(state),
    planningList: selectors.getFilteredPlanningList(state),
    planningsAreLoading: state.agenda.agendasAreLoading || state.planning.planningsAreLoading,
    editPlanningViewOpen: state.planning.editorOpened,
    isEventListShown: selectors.isEventListShown(state),
    onlyFuture: state.planning.onlyFuture,
    privileges: selectors.getPrivileges(state),
    advancedSearchOpened: get(state, 'planning.search.advancedSearchOpened', false),
    isAdvancedDateSearch: selectors.isAdvancedDateSearch(state),
    isAdvancedSearchSpecified: isObject(selectors.getPlanningSearch(state)),
    session: selectors.getSessionDetails(state),
    selected: selectors.getSelectedPlanningItems(state),
})

const mapDispatchToProps = (dispatch) => ({
    onPlanningCreation: (planning) => (
        // save planning and open the planning editor
        dispatch(actions.planning.ui.saveAndReloadCurrentAgenda(planning))
        .then((planning) => (
            dispatch(actions.planning.ui.openEditor(planning._id))
        ))
    ),
    handleSearch: (text) => (dispatch(actions.planning.ui.filterByKeyword(text))),
    addEventToCurrentAgenda: (event) => (dispatch(actions.addEventToCurrentAgenda(event))),
    toggleEventsList: () => (dispatch(actions.toggleEventsList())),
    onFutureToggleChange: () => (dispatch(actions.planning.ui.toggleOnlyFutureFilter())),
    closeAdvancedSearch: () =>(dispatch(actions.planning.ui.closeAdvancedSearch())),
    openAdvancedSearch: () =>(dispatch(actions.planning.ui.openAdvancedSearch())),
    selectAll: () => dispatch(actions.planning.ui.selectAll()),
    deselectAll: () => dispatch(actions.planning.ui.deselectAll()),
    exportAsArticle: () => dispatch(actions.planning.api.exportAsArticle()),
})

export const PlanningPanelContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(PlanningPanel)
