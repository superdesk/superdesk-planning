import React from 'react'
import { connect } from 'react-redux'
import * as actions from '../../actions'
import { PlanningForm } from '../index'
import * as selectors from '../../selectors'
import { get } from 'lodash'
import moment from 'moment'
import './style.scss'

class EditPlanningPanel extends React.Component {

    constructor(props) {
        super(props)
    }

    render() {
        const { creationDate, closePlanningEditor, author } = this.props
        return (
            <div className="Planning__edit-planning">
                <header>
                    <div>
                        {creationDate && author &&
                            <span>Created {moment(creationDate).fromNow()} by {author}</span>
                        }
                        {(!creationDate || !author) &&
                            <span>Create a new planning</span>
                        }
                    </div>
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
    creationDate: React.PropTypes.string,
    author: React.PropTypes.string,
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
