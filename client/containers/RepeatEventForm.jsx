import React, { PropTypes } from 'react'
import { Field, formValueSelector } from 'redux-form'
import { fields } from '../components'
import { connect } from 'react-redux'
import { isNil } from 'lodash'

class RepeatEventFormComponent extends React.Component {

    constructor(props) {
        super(props)
        this.state = { doesRepeatEnd: false }
    }

    componentWillReceiveProps(nextProps) {
        const { doesRepeatEnd } = nextProps
        // set the internal state for doesRepeatEnd checkboxes based on fields values
        if (doesRepeatEnd !== this.state.doesRepeatEnd) {
            this.setState({ doesRepeatEnd: doesRepeatEnd })
        }
    }

    handleDoesRepeatEndChange(e) {
        const choicesWithInput = ['count', 'until']
        // if the clicked checkbox belongs to an input field
        if (choicesWithInput.indexOf(e.target.value) > -1) {
            // update state to select the checkbox
            this.setState({ doesRepeatEnd: e.target.value })
            // focus the field
            this.refs['recurring_rule--' + e.target.value].getRenderedComponent().focus()
        }
        // if "false" is clicked, we clear the other fields
        if (e.target.value === 'false') {
            this.setState({ doesRepeatEnd: false })
            choicesWithInput.forEach((fieldName) =>
                this.props.change('dates.recurring_rule.' + fieldName, null)
            )
        }
    }

    render() {
        const frequences = {
            YEARLY: 'years',
            MONTHLY: 'months',
            WEEKLY: 'weeks',
            DAILY: 'days',
        }
        return (
            <div>
                <div>
                    <label>Repeats</label>
                    <Field name="dates.recurring_rule.frequency" component="select">
                        <option />
                        {/* values come from http://tinyurl.com/hqol55p */}
                        <option value="YEARLY">Yearly</option>
                        <option value="MONTHLY">Monthly</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="DAILY">Daily</option>
                    </Field>
                </div>
                <div className="recurring__interval">
                    <label>Repeat Every</label>
                    <Field name="dates.recurring_rule.interval" component="select">
                        {/* Create 30 options with 1...30 values */}
                        {Array.apply(null, { length: 30 }).map(Number.call, Number).map((n) => (
                            <option key={n + 1} value={n + 1}>
                                {n + 1} {frequences[this.props.frequency]}
                            </option>
                        ))}
                    </Field>
                </div>
                { this.props.frequency === 'WEEKLY' &&
                    <div>
                        <label>Repeat on</label>
                        <Field name="dates.recurring_rule.byday" component={fields.DaysOfWeek} />
                    </div>
                }
                <div className="recurring__ends">
                    <label>Ends</label>
                    <label>
                        <input
                            name="doesRepeatEnd"
                            checked={!this.state.doesRepeatEnd}
                            onChange={this.handleDoesRepeatEndChange.bind(this)}
                            value={false}
                            type="radio"/>
                        Never
                    </label>
                    <label>
                        <input
                            name="doesRepeatEnd"
                            checked={this.state.doesRepeatEnd === 'count'}
                            onChange={this.handleDoesRepeatEndChange.bind(this)}
                            value="count"
                            type="radio"/>
                        After
                        <Field name="dates.recurring_rule.count"
                               withRef={true}
                               ref="recurring_rule--count"
                               component="input" type="number" />
                        occurrences
                    </label>
                    <label>
                        <input
                        name="doesRepeatEnd"
                        checked={this.state.doesRepeatEnd === 'until'}
                        onChange={this.handleDoesRepeatEndChange.bind(this)}
                        value="until"
                        type="radio"/>
                        On
                               <Field name="dates.recurring_rule.until"
                               withRef={true}
                               ref="recurring_rule--until"
                               component={fields.DayPickerInput} />
                    </label>
                </div>
            </div>
        )
    }
}
RepeatEventFormComponent.propTypes = {
    change: PropTypes.func.isRequired,
    doesRepeatEnd: PropTypes.oneOf([false, 'count', 'until']),
    frequency: PropTypes.oneOf(['YEARLY', 'MONTHLY', 'WEEKLY', 'DAILY']),
}

// This is the same name defined in EventForm.jsx because it is just a sub form
const selector = formValueSelector('addEvent')
const mapStateToProps = (state) => ({
    frequency: selector(state, 'dates.recurring_rule.frequency'),
    // return 'until' or 'count' if these values are defined, otherwise false
    doesRepeatEnd: !isNil(selector(state, 'dates.recurring_rule.until')) ? 'until' :
        !isNil(selector(state, 'dates.recurring_rule.count')) ? 'count' : false,
})

export const RepeatEventForm = connect(mapStateToProps)(RepeatEventFormComponent)
