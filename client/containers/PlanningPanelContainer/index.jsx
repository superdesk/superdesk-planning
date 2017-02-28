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
        this.props.fetchAgendas()
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
        const event = JSON.parse(e.dataTransfer.getData('application/superdesk.item.events'))
        if (event) {
            this.props.addEventToCurrentAgenda(event)
        }
    }

    render() {
        const { draggingOver } = this.state
        const {
            openCreateAgenda,
            planningList,
            openPlanningEditor,
            currentAgenda,
            handlePlanningDeletion,
            createPlanning,
            currentPlanning,
            planningsAreLoading,
            editPlanningViewOpen
        } = this.props
        const listClasses = [
            'Planning--edit-planning-container',
            draggingOver ? 'Planning__planning__list--draggingOver' : null,
            editPlanningViewOpen ? 'Planning--edit-planning-view' : null
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
                            <h3 className="subnav__page-title">
                                <span>
                                    <span>Planning</span>
                                </span>
                            </h3>
                            <SelectAgenda />
                            <div className="subnav__button-stack--square-buttons">
                                <div className="refresh-box pull-right" />
                                <div className="navbtn" title="Create">
                                    <button className="sd-create-btn"
                                            onClick={openCreateAgenda.bind(null, null)}>
                                        <i className="svg-icon-plus" />
                                        <span className="circle" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <ul className="list-view compact-view">
                            {currentAgenda &&
                                <QuickAddPlanning className="ListItem__list-item" onPlanningCreation={createPlanning}/>
                            }
                            {(planningList && planningList.length > 0) && planningList.map((planning) => (
                                <PlanningItem
                                    key={planning._id}
                                    active={currentPlanning && currentPlanning._id === planning._id}
                                    item={planning}
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
                                    There is no selected calendar.<br/>
                                    Choose one in the above dropdown.
                                </div>
                            || (planningList && planningList.length < 1) &&
                                <div className="Planning__planning__empty-message">
                                    There is no planning yet
                                    {currentAgenda &&
                                        <div>
                                            in the agenda&nbsp;
                                            <strong>{currentAgenda.name}</strong>.
                                        </div>
                                    }
                                    <div>Drag and drop an event here to start a planning</div>
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
    fetchAgendas: React.PropTypes.func.isRequired,
    openCreateAgenda: React.PropTypes.func.isRequired,
    planningList: React.PropTypes.array.isRequired,
    planningsAreLoading: React.PropTypes.bool,
    openPlanningEditor: React.PropTypes.func.isRequired,
    handlePlanningDeletion: React.PropTypes.func,
    createPlanning: React.PropTypes.func,
    editPlanningViewOpen: React.PropTypes.bool,
    addEventToCurrentAgenda: React.PropTypes.func,
}

const mapStateToProps = (state) => ({
    currentAgenda: selectors.getCurrentAgenda(state),
    currentPlanning: selectors.getCurrentPlanning(state),
    planningList: selectors.getCurrentAgendaPlannings(state),
    planningsAreLoading: state.planning.agendasAreLoading || state.planning.planningsAreLoading,
    editPlanningViewOpen: state.planning.editorOpened
})

const mapDispatchToProps = (dispatch) => ({
    handlePlanningDeletion: (planning) => dispatch(actions.deletePlanning(planning)),
    openCreateAgenda: () => dispatch(actions.showModal({ modalType: 'CREATE_AGENDA' })),
    fetchAgendas: () => dispatch(actions.fetchAgendas()),
    createPlanning: (planning) => dispatch(actions.savePlanningAndReloadCurrentAgenda(planning)),
    openPlanningEditor: (planning) => (dispatch(actions.openPlanningEditor(planning))),
    addEventToCurrentAgenda: (event) => (dispatch(actions.addEventToCurrentAgenda(event))),
})

export const PlanningPanelContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(PlanningPanel)
