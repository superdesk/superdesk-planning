import React from 'react'
import { connect } from 'react-redux'
import * as actions from '../actions'
import { SelectAgenda, PlanningItem } from './index'
import * as selectors from '../selectors'

class PlanningPanel extends React.Component {

    constructor(props) {
        super(props)
    }

    componentDidMount() {
        this.props.fetchAgendas()
    }

    render() {
        return (
            <div className="Planning__planning">
                <div className="subnav">
                    <h3 className="subnav__page-title">
                        <span>
                            <span>Planning</span>
                        </span>
                    </h3>
                    <SelectAgenda />
                    <div className="subnav__button-stack--square-buttons">
                        <div className="refresh-box pull-right"></div>
                        <div className="navbtn" title="Create">
                            <button className="sd-create-btn"
                                    onClick={this.props.openCreateAgenda.bind(null, null)}>
                                <i className="svg-icon-plus"></i>
                                <span className="circle"></span>
                            </button>
                        </div>
                    </div>
                </div>
                <ul className="list-view compact-view">
                    {
                        (this.props.planningList && this.props.planningList.length > 0) &&
                        this.props.planningList.map((planning) => (
                            <PlanningItem key={planning._id} item={planning} />
                        ))
                    }
                </ul>
                {
                    this.props.planningsAreLoading &&
                    <div className="Planning__planning__empty-message">
                        Loading
                    </div>
                    || (!this.props.currentAgenda || this.props.currentAgenda.length < 1) &&
                    <div className="Planning__planning__empty-message">
                        There is no selected calendar.<br/>
                        Choose one in the above dropdown.
                    </div>
                    || (this.props.planningList && this.props.planningList.length < 1) &&
                        <div className="Planning__planning__empty-message">
                            There is no planning yet
                            {this.props.currentAgenda &&
                                <div>
                                    in the agenda&nbsp;
                                    <strong>{this.props.currentAgenda.name}</strong>.
                                </div>
                            }
                            <div>Drag and drop an event here to start a planning</div>
                        </div>
                }
            </div>
        )
    }
}

const mapStateToProps = (state) => ({
    currentAgenda: selectors.getCurrentAgenda(state),
    planningList: selectors.getCurrentAgendaPlannings(state),
    planningsAreLoading: state.planning.planningsAreLoading
})

const mapDispatchToProps = (dispatch) => ({
    openCreateAgenda: () => dispatch(actions.showModal({ modalType: 'CREATE_AGENDA' })),
    fetchAgendas: () => dispatch(actions.fetchAgendas()),
})

export const PlanningPanelContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(PlanningPanel)
