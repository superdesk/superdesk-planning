import React from 'react'
import { reduxForm } from 'redux-form'
import { connect } from 'react-redux'
import * as actions from '../../actions'
import { PlanningForm } from '../index'
import { EventMetadata } from '../../components'
import * as selectors from '../../selectors'
import { ITEM_STATE } from '../../constants'
import { get } from 'lodash'
import moment from 'moment'
import './style.scss'

export class EditPlanningPanel extends React.Component {

    constructor(props) {
        super(props)
    }

    handleSave() {
        this.refs.PlanningForm.getWrappedInstance().submit()
    }

    render() {
        const { closePlanningEditor, planning, event, pristine, submitting, agendaSpiked } = this.props
        const creationDate = get(planning, '_created')
        const updatedDate = get(planning, '_updated')
        const author = get(planning, 'original_creator')
        const versionCreator = get(planning, 'version_creator') && this.props.users ? this.props.users.find((u) => (u._id === planning.version_creator)) : null
        const planningSpiked = planning ? get(planning, 'state', 'active') === ITEM_STATE.SPIKED : false
        const eventSpiked = event ? get(event, 'state', 'active') === ITEM_STATE.SPIKED : false
        return (
            <div className="EditPlanningPanel">
                <header>
                    <div className="TimeAndAuthor">
                        {updatedDate && versionCreator &&
                            <span>Updated {moment(updatedDate).fromNow()} by <span className='TimeAndAuthor__author'> {versionCreator.display_name}</span>
                            </span>
                        }
                    </div>
                    <div className="EditPlanningPanel__actions">
                        <button
                            className="btn"
                            type="reset"
                            onClick={closePlanningEditor}
                            disabled={submitting}>Cancel</button>
                        {!agendaSpiked && !planningSpiked && !eventSpiked &&
                            <button
                                className="btn btn--primary"
                                onClick={this.handleSave.bind(this)}
                                type="submit"
                                disabled={pristine || submitting}>Save</button>
                        }
                    </div>
                </header>
                <div className="EditPlanningPanel__body">
                    {agendaSpiked &&
                        <span className="AgendaSpiked label label--alert">agenda spiked</span>
                    }
                    {planningSpiked &&
                        <span className="PlanningSpiked label label--alert">planning spiked</span>
                    }
                    {eventSpiked &&
                        <span className="EventSpiked label label--alert">event spiked</span>
                    }
                    {event &&
                        <div>
                            <h3>Associated event</h3>
                            <EventMetadata event={event}/>
                        </div>
                    }
                    <h3>Planning</h3>
                    <div className="TimeAndAuthor">
                        {creationDate && author &&
                            <span>Created {moment(creationDate).fromNow()} by <span className='TimeAndAuthor__author'> {author.display_name}</span>
                            </span>
                        }
                        {(!creationDate || !author) &&
                            <span>Create a new planning</span>
                        }
                    </div>
                    <PlanningForm ref="PlanningForm" />
                </div>
            </div>
        )
    }
}

EditPlanningPanel.propTypes = {
    closePlanningEditor: React.PropTypes.func.isRequired,
    planning: React.PropTypes.object,
    event: React.PropTypes.object,
    pristine: React.PropTypes.bool.isRequired,
    submitting: React.PropTypes.bool.isRequired,
    agendaSpiked: React.PropTypes.bool,
    users: React.PropTypes.oneOfType([
        React.PropTypes.array,
        React.PropTypes.object,
    ]),
}

const mapStateToProps = (state) => ({
    planning: selectors.getCurrentPlanning(state),
    event: selectors.getCurrentPlanningEvent(state),
    agendaSpiked: selectors.getCurrentPlanningAgendaSpiked(state),
    users: selectors.getUsers(state),
})

const mapDispatchToProps = (dispatch) => ({ closePlanningEditor: () => dispatch(actions.closePlanningEditor()) })

export const EditPlanningPanelContainer = connect(
    mapStateToProps, mapDispatchToProps
// connect to the form in order to have pristine and submitting in props
)(reduxForm({ form: 'planning' })(EditPlanningPanel))
