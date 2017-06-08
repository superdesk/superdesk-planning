import React from 'react'
import { connect } from 'react-redux'
import * as actions from '../../actions'
import { SelectAgenda, EditPlanningPanelContainer, PlanningList } from '../index'
import { QuickAddPlanning, Toggle, SearchBar } from '../../components'
import { ITEM_STATE } from '../../constants'
import * as selectors from '../../selectors'
import './style.scss'

class PlanningPanel extends React.Component {

    handleDragEnter(e) {
        e.dataTransfer.dropEffect = 'copy'
    }

    handleEventDrop(e) {
        e.preventDefault()
        const event = JSON.parse(e.dataTransfer.getData('application/superdesk.item.events'))
        if (event) {
            this.props.addEventToCurrentAgenda(event)
        }
    }

    render() {
        const {
            planningList,
            currentAgenda,
            onPlanningCreation,
            planningsAreLoading,
            editPlanningViewOpen,
            isEventListShown,
            toggleEventsList,
            onManageAgendasClick,
            onlyFuture,
            onlySpiked,
            onFutureToggleChange,
            handleSearch,
            onSpikedToggleChange,
            privileges,
        } = this.props
        const listClasses = [
            'Planning-panel',
            editPlanningViewOpen ? 'Planning-panel--edit-planning-view' : null,
        ].join(' ')
        return (
            <div className={listClasses}
                 onDrop={this.handleEventDrop.bind(this)}
                 onDragOver={(e) => e.preventDefault()}
                 onDragEnter={this.handleDragEnter.bind(this)}
                 onDragLeave={this.handleDragLeave}>
                <div className="subnav">
                    {!isEventListShown &&
                        <div className="navbtn" title="Show the event list">
                            <button onClick={toggleEventsList} type="button">
                                <i className="icon-chevron-right-thin"/>
                            </button>
                        </div>
                    }
                    <div className="navbtn" title="Manage agendas">
                        <button onClick={onManageAgendasClick} type="button">
                            <i className="icon-th-large"/>
                        </button>
                    </div>
                    <h3 className="subnav__page-title">
                        <span>
                            <span>Agenda</span>
                        </span>
                    </h3>
                    <div  className="Planning-panel__select-agenda">
                        <SelectAgenda />
                    </div>
                </div>
                <div className="Planning-panel__container">
                    <div className="Planning-panel__list">
                        <div className="Planning-panel__searchbar subnav">
                            <SearchBar value={null} onSearch={handleSearch}/>
                            <label>
                                Only future
                                <Toggle value={onlyFuture} onChange={onFutureToggleChange}/>
                            </label>
                            <label>
                                Spiked
                                <Toggle value={onlySpiked} onChange={onSpikedToggleChange} />
                            </label>
                        </div>
                        <ul className="list-view compact-view">
                            {currentAgenda && privileges.planning_planning_management === 1 && currentAgenda.state !== ITEM_STATE.SPIKED &&
                                <QuickAddPlanning className="ListItem" onPlanningCreation={onPlanningCreation}/>
                            }
                            {(planningList && planningList.length > 0) &&
                                <PlanningList />
                            }
                        </ul>
                        {
                            planningsAreLoading &&
                                <div className="Planning-panel__empty-message">
                                    Loading
                                </div>
                            || !currentAgenda &&
                                <div className="Planning-panel__empty-message">
                                    Choose an agenda from the drop-down list above.
                                </div>
                            || (planningList && planningList.length < 1) &&
                                <div className="Planning-panel__empty-message">
                                    There are no planning items in this agenda.<br/>
                                    Drag an event here to start one.
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
    currentAgenda: React.PropTypes.object,
    planningList: React.PropTypes.array.isRequired,
    planningsAreLoading: React.PropTypes.bool,
    onPlanningCreation: React.PropTypes.func,
    editPlanningViewOpen: React.PropTypes.bool,
    addEventToCurrentAgenda: React.PropTypes.func,
    toggleEventsList: React.PropTypes.func,
    isEventListShown: React.PropTypes.bool,
    onManageAgendasClick: React.PropTypes.func,
    onlyFuture: React.PropTypes.bool,
    onlySpiked: React.PropTypes.bool,
    onFutureToggleChange: React.PropTypes.func,
    handleSearch: React.PropTypes.func.isRequired,
    onSpikedToggleChange: React.PropTypes.func,
    privileges: React.PropTypes.object.isRequired,
}

const mapStateToProps = (state) => ({
    currentAgenda: selectors.getCurrentAgenda(state),
    planningList: selectors.getCurrentAgendaPlannings(state),
    planningsAreLoading: state.agenda.agendasAreLoading || state.planning.planningsAreLoading,
    editPlanningViewOpen: state.planning.editorOpened,
    isEventListShown: selectors.isEventListShown(state),
    onlyFuture: state.planning.onlyFuture,
    onlySpiked: state.planning.onlySpiked,
    privileges: selectors.getPrivileges(state),
})

const mapDispatchToProps = (dispatch) => ({
    onPlanningCreation: (planning) => (
        // save planning and open the plannning editor
        dispatch(actions.savePlanningAndReloadCurrentAgenda(planning))
        .then((planning) => (
            dispatch(actions.openPlanningEditor(planning._id))
        ))
    ),
    handleSearch: (text) => (dispatch(actions.planningFilterByKeyword(text))),
    addEventToCurrentAgenda: (event) => (dispatch(actions.addEventToCurrentAgenda(event))),
    toggleEventsList: () => (dispatch(actions.toggleEventsList())),
    onManageAgendasClick: () => (dispatch(actions.showModal({ modalType: 'MANAGE_AGENDAS' }))),
    onFutureToggleChange: () => (dispatch(actions.toggleOnlyFutureFilter())),
    onSpikedToggleChange: () => (dispatch(actions.toggleOnlySpikedFilter())),
})

export const PlanningPanelContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(PlanningPanel)
