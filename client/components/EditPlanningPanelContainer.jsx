import React from 'react'
import { connect } from 'react-redux'
import * as actions from '../actions'
import { PlanningForm } from './index'
import * as selectors from '../selectors'
import { get } from 'lodash'
import moment from 'moment'

class EditPlanningPanel extends React.Component {

    constructor(props) {
        super(props)
    }

    render() {
        const { creationDate, closePlanningEditor, author } = this.props
        return (
            <div className="Planning__edit-planning">
                <header className="subnav">
                    <h3 className="subnav__page-title">
                        Created {moment(creationDate).fromNow()} by {author}
                    </h3>
                    <a onClick={closePlanningEditor} className="close">
                        <i className="icon-close-small" />
                    </a>
                </header>
                <PlanningForm />
            </div>
        )
    }
}

EditPlanningPanel.propTypes = {
    closePlanningEditor: React.PropTypes.func.isRequired,
    creationDate: React.PropTypes.string.isRequired,
    author: React.PropTypes.string.isRequired,
}

const mapStateToProps = (state) => ({
    creationDate: get(selectors.getCurrentPlanning(state), '_created'),
    author: get(selectors.getCurrentPlanning(state), 'original_creator.username'),
})

const mapDispatchToProps = (dispatch) => ({
    closePlanningEditor: () => dispatch(actions.closePlanningEditor())
})

export const EditPlanningPanelContainer = connect(
    mapStateToProps, mapDispatchToProps
)(EditPlanningPanel)
