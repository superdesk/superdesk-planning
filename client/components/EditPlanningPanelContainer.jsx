import React from 'react'
import { connect } from 'react-redux'
import * as actions from '../actions'
import { PlanningForm } from './index'

class EditPlanningPanel extends React.Component {

    constructor(props) {
        super(props)
    }

    render() {
        return (
            <div className="Planning__edit-planning">
                <header className="subnav">
                    <h3 className="subnav__page-title">Created 5min ago by Edouard</h3>
                    <a onClick={this.props.closePlanningEditor} className="close">
                        <i className="icon-close-small"></i>
                    </a>
                </header>
                <PlanningForm />
            </div>
        )
    }
}

EditPlanningPanel.propTypes = {
    closePlanningEditor: React.PropTypes.func.isRequired
}

const mapDispatchToProps = (dispatch) => ({
    closePlanningEditor: () => dispatch(actions.closePlanningEditor())
})

export const EditPlanningPanelContainer = connect(null, mapDispatchToProps)(EditPlanningPanel)
