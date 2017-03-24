import React from 'react'
import { connect } from 'react-redux'
import * as actions from '../../actions'
import { PlanningForm } from '../index'
import { EventMetadata } from '../../components'
import * as selectors from '../../selectors'
import { get } from 'lodash'
import moment from 'moment'
import './style.scss'

class EditPlanningPanel extends React.Component {

    constructor(props) {
        super(props)
    }

    render() {
        const { closePlanningEditor, planning, event } = this.props
        const creationDate = get(planning, '_created')
        const author = get(planning, 'original_creator.username')
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
                {event &&
                    <div>
                        <h3>Associated event</h3>
                        <EventMetadata event={event}/>
                    </div>
                }
                <h3>Planning</h3>
                <PlanningForm />
            </div>
        )
    }
}

EditPlanningPanel.propTypes = {
    closePlanningEditor: React.PropTypes.func.isRequired,
    planning: React.PropTypes.object,
    event: React.PropTypes.object,
}

const mapStateToProps = (state) => ({
    planning: selectors.getCurrentPlanning(state),
    event: selectors.getCurrentPlanningEvent(state),
})

const mapDispatchToProps = (dispatch) => ({ closePlanningEditor: () => dispatch(actions.closePlanningEditor()) })

export const EditPlanningPanelContainer = connect(
    mapStateToProps, mapDispatchToProps
)(EditPlanningPanel)
