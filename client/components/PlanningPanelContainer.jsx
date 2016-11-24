import React from 'react'
import { connect } from 'react-redux'
import * as actions from '../actions'

const Item = ({ item }) => (
    <li>{item}</li>
)

const List = ({ items }) => (
    <ul>
        {items.map((item) => (
            <Item key={item} item={item} />
        ))}
    </ul>
)

class PlanningPanel extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            planningList: []
        }
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
                {
                    // When an item is selected, show the planning list
                    this.props.selectedEvent &&
                    <List items={this.state.planningList} />
                }
                {
                    // When no item is selected, show a message
                    !this.props.selectedEvent &&
                    <div className="Planning__planning__empty-message">
                        There is no planning yet<br/>
                        Drag and drop an event here to start a planning
                    </div>
                }
            </div>
        )
    }
}

const mapStateToProps = (state) => ({
    selectedEvent: state.planning.selectedEvent
})

const mapDispatchToProps = (dispatch) => ({
    openCreateAgenda: () => dispatch(actions.showModal({ modalType: 'CREATE_AGENDA' })),
})

export const PlanningPanelContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(PlanningPanel)
