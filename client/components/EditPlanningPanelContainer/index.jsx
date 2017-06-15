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
import { OverlayTrigger } from 'react-bootstrap'
import { tooltips } from '../index'
import './style.scss'

export class EditPlanningPanel extends React.Component {

    constructor(props) {
        super(props)
    }

    handleSave() {
        this.refs.PlanningForm.getWrappedInstance().submit()
    }

    render() {
        const { closePlanningEditor, openPlanningEditor, planning, event, pristine, submitting, agendaSpiked, readOnly } = this.props
        const creationDate = get(planning, '_created')
        const updatedDate = get(planning, '_updated')
        const author = get(planning, 'original_creator')
        const versionCreator = get(planning, 'version_creator') && this.props.users ? this.props.users.find((u) => (u._id === planning.version_creator)) : null
        const planningSpiked = planning ? get(planning, 'state', 'active') === ITEM_STATE.SPIKED : false
        const eventSpiked = event ? get(event, 'state', 'active') === ITEM_STATE.SPIKED : false

        // If the planning or event or agenda item is spiked, enforce readOnly
        let updatedReadOnly = readOnly
        if (agendaSpiked || eventSpiked || planningSpiked) {
            updatedReadOnly = true
        }

        return (
            <div className="EditPlanningPanel">
                <header>
                    <div className="TimeAndAuthor">
                        {updatedDate && versionCreator &&
                            <span>Updated {moment(updatedDate).fromNow()} by <span className='TimeAndAuthor__author'> {versionCreator.display_name}</span>
                            </span>
                        }
                    </div>
                    { !updatedReadOnly && <div className="EditPlanningPanel__actions">
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
                    }
                    { updatedReadOnly && (
                        <div className="EditPlanningPanel__actions">
                            {(!agendaSpiked && !eventSpiked && !planningSpiked) &&
                            (<OverlayTrigger placement="bottom" overlay={tooltips.editTooltip}>
                                <button className="EditPlanningPanel__actions__edit" onClick={openPlanningEditor.bind(this, get(planning, '_id'))}>
                                    <i className="icon-pencil"/>
                                </button>
                            </OverlayTrigger>)}
                            <OverlayTrigger placement="bottom" overlay={tooltips.closeTooltip}>
                                <button className="EditPlanningPanel__actions__edit" onClick={closePlanningEditor}>
                                    <i className="icon-close-small"/>
                                </button>
                            </OverlayTrigger>
                        </div>)
                    }
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
                    <PlanningForm ref="PlanningForm" readOnly={updatedReadOnly}/>
                </div>
            </div>
        )
    }
}

EditPlanningPanel.propTypes = {
    closePlanningEditor: React.PropTypes.func.isRequired,
    openPlanningEditor: React.PropTypes.func.isRequired,
    planning: React.PropTypes.object,
    event: React.PropTypes.object,
    pristine: React.PropTypes.bool.isRequired,
    submitting: React.PropTypes.bool.isRequired,
    agendaSpiked: React.PropTypes.bool,
    users: React.PropTypes.oneOfType([
        React.PropTypes.array,
        React.PropTypes.object,
    ]),
    readOnly: React.PropTypes.bool,
}

const mapStateToProps = (state) => ({
    planning: selectors.getCurrentPlanning(state),
    event: selectors.getCurrentPlanningEvent(state),
    agendaSpiked: selectors.getCurrentPlanningAgendaSpiked(state),
    users: selectors.getUsers(state),
    readOnly: selectors.getPlanningItemReadOnlyState(state),
})

const mapDispatchToProps = (dispatch) => ({
    closePlanningEditor: () => dispatch(actions.closePlanningEditor()),
    openPlanningEditor: (planning) => (dispatch(actions.openPlanningEditor(planning))),
})

export const EditPlanningPanelContainer = connect(
    mapStateToProps, mapDispatchToProps
// connect to the form in order to have pristine and submitting in props
)(reduxForm({ form: 'planning' })(EditPlanningPanel))
