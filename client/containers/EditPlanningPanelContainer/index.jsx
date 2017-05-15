import React from 'react'
import { reduxForm } from 'redux-form'
import { connect } from 'react-redux'
import * as actions from '../../actions'
import { PlanningForm } from '../index'
import { EventMetadata } from '../../components'
import * as selectors from '../../selectors'
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
        const author = get(planning, 'original_creator.username')
        const planningSpiked = get(planning, 'state', 'active') === 'spiked'
        return (
            <div className="EditPlanningPanel">
                <header>
                    <div className="EditPlanningPanel__last-update">
                        {creationDate && author &&
                            <span>Created {moment(creationDate).fromNow()} by {author}</span>
                        }
                        {(!creationDate || !author) &&
                            <span>Create a new planning</span>
                        }
                    </div>
                    <div className="EditPlanningPanel__actions">
                        <button
                            className="btn"
                            type="reset"
                            onClick={closePlanningEditor}
                            disabled={submitting}>Cancel</button>
                        {!agendaSpiked && !planningSpiked &&
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
                    {event &&
                        <div>
                            <h3>Associated event</h3>
                            <EventMetadata event={event}/>
                        </div>
                    }
                    <h3>Planning</h3>
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
}

const mapStateToProps = (state) => ({
    planning: selectors.getCurrentPlanning(state),
    event: selectors.getCurrentPlanningEvent(state),
    agendaSpiked: selectors.getCurrentPlanningAgendaSpiked(state),
})

const mapDispatchToProps = (dispatch) => ({ closePlanningEditor: () => dispatch(actions.closePlanningEditor()) })

export const EditPlanningPanelContainer = connect(
    mapStateToProps, mapDispatchToProps
// connect to the form in order to have pristine and submitting in props
)(reduxForm({ form: 'planning' })(EditPlanningPanel))
