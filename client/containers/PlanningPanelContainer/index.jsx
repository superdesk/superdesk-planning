import React from 'react'
import { connect } from 'react-redux'
import * as actions from '../../actions'
import { SelectAgenda, EditPlanningPanelContainer } from '../index'
import { PlanningItem, QuickAddPlanning } from '../../components'
import * as selectors from '../../selectors'
import './style.scss'

class PlanningPanel extends React.Component {

    constructor(props) {
        super(props)
        this.state = { draggingOver: false }
    }

    componentDidMount() {
        this.props.fetchPlannings()
    }

    handleDragOver(e) {
        e.preventDefault()
        this.setState({ draggingOver: true })
    }
    handleDragEnter(e) {
        e.dataTransfer.dropEffect = 'copy'
    }
    handleDragLeave() {
        this.setState({ draggingOver: false })
    }

    handleEventDrop(e) {
        e.preventDefault()
        const event = JSON.parse(e.dataTransfer.getData('application/superdesk.item.events'))
        if (event) {
            this.props.addEventToCurrentAgenda(event)
        }
    }

    render() {
        const { draggingOver } = this.state
        const {
            planningList,
            openPlanningEditor,
            currentAgenda,
            handlePlanningDeletion,
            onPlanningCreation,
            planningsEvents,
            currentPlanning,
            planningsAreLoading,
            editPlanningViewOpen,
            isEventListShown,
            toggleEventsList,
            onManageAgendasClick,
        } = this.props
        const listClasses = [
            'Planning__planning-panel',
            draggingOver ? 'Planning__planning__list--draggingOver' : null,
            editPlanningViewOpen ? 'Planning--edit-planning-view' : null,
        ].join(' ')
        return (
            <div className={listClasses}
                 onDrop={this.handleEventDrop.bind(this)}
                 onDragOver={this.handleDragOver.bind(this)}
                 onDragEnter={this.handleDragEnter.bind(this)}
                 onDragLeave={this.handleDragLeave.bind(this)}>
                <div className="Planning__planning">
                    <div className="Planning__planning__list">
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
                                    <span>Planning</span>
                                </span>
                            </h3>
                            <div  className="Planning__planning__select-agenda">
                                <SelectAgenda />
                            </div>
                        </div>
                        <ul className="list-view compact-view">
                            {currentAgenda &&
                                <QuickAddPlanning className="ListItem__list-item" onPlanningCreation={onPlanningCreation}/>
                            }
                            {(planningList && planningList.length > 0) && planningList.map((planning) => (
                                <PlanningItem
                                    key={planning._id}
                                    active={currentPlanning && currentPlanning._id === planning._id}
                                    item={planning}
                                    event={planningsEvents[planning._id]}
                                    onDelete={handlePlanningDeletion}
                                    onClick={openPlanningEditor.bind(null, planning._id)} />
                            ))}
                        </ul>
                        {
                            planningsAreLoading &&
                                <div className="Planning__planning__empty-message">
                                    Loading
                                </div>
                            || !currentAgenda &&
                                <div className="Planning__planning__empty-message">
                                    Choose an agenda from the drop-down list above.
                                </div>
                            || (planningList && planningList.length < 1) &&
                                <div className="Planning__planning__empty-message">
                                    There are no planning items in this agenda.<br/>
                                    Drag an event here to start one.
                                </div>
                        }
                    </div>
                    <EditPlanningPanelContainer />
                </div>
            </div>
        )
    }
}

PlanningPanel.propTypes = {
    currentAgenda: React.PropTypes.object,
    currentPlanning: React.PropTypes.object,
    planningsEvents: React.PropTypes.object,
    fetchPlannings: React.PropTypes.func.isRequired,
    planningList: React.PropTypes.array.isRequired,
    planningsAreLoading: React.PropTypes.bool,
    openPlanningEditor: React.PropTypes.func.isRequired,
    handlePlanningDeletion: React.PropTypes.func,
    onPlanningCreation: React.PropTypes.func,
    editPlanningViewOpen: React.PropTypes.bool,
    addEventToCurrentAgenda: React.PropTypes.func,
    toggleEventsList: React.PropTypes.func,
    isEventListShown: React.PropTypes.bool,
    onManageAgendasClick: React.PropTypes.func,
}

const mapStateToProps = (state) => ({
    currentAgenda: selectors.getCurrentAgenda(state),
    currentPlanning: selectors.getCurrentPlanning(state),
    planningList: selectors.getCurrentAgendaPlannings(state),
    planningsAreLoading: state.planning.agendasAreLoading || state.planning.planningsAreLoading,
    editPlanningViewOpen: state.planning.editorOpened,
    planningsEvents: selectors.getCurrentAgendaPlanningsEvents(state),
    isEventListShown: selectors.isEventListShown(state),
})

const mapDispatchToProps = (dispatch) => ({
    handlePlanningDeletion: (planning) => {
        dispatch(actions.showModal({
            modalType: 'CONFIRMATION',
            modalProps: {
                body: `Are you sure you want to delete the planning ${planning.slugline} ?`,
                action: () => dispatch(actions.deletePlanning(planning)),
            },
        }))
    },
    fetchPlannings: () => {
        dispatch(actions.fetchAgendas())
        dispatch(actions.fetchPlannings())
    },
    onPlanningCreation: (planning) => (
        // save planning and open the plannning editor
        dispatch(actions.savePlanningAndReloadCurrentAgenda(planning))
        .then((planning) => (
            dispatch(actions.openPlanningEditor(planning._id))
        ))
    ),
    openPlanningEditor: (planning) => (dispatch(actions.openPlanningEditor(planning))),
    addEventToCurrentAgenda: (event) => (dispatch(actions.addEventToCurrentAgenda(event))),
    toggleEventsList: () => (dispatch(actions.toggleEventsList())),
    onManageAgendasClick: () => (dispatch(actions.showModal({ modalType: 'MANAGE_AGENDAS' }))),
})

export const PlanningPanelContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(PlanningPanel)
