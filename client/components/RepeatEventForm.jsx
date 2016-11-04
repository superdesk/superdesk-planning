import React, { PropTypes } from 'react'
import { Field, formValueSelector } from 'redux-form'
import { DayPickerInput, DaysOfWeek } from './index'
import { connect } from 'react-redux'
import { isNil } from 'lodash'

class RepeatEventFormComponent extends React.Component {

    constructor(props) {
        super(props)
    }

    /** clear 'until' and 'count' when "never ends" is selected */
    handleDoesRepeatEndChange(e) {
        if (e.target.value === 'false') {
            this.props.change('dates.recurring_rule.until', null)
            this.props.change('dates.recurring_rule.count', null)
        }
    }

    render() {
        return (
            <div>
                <div>
                    <label>Repeats</label>
                    <Field name="dates.recurring_rule.frequency" component="select">
                        <option></option>
                        {/* values come from http://tinyurl.com/hqol55p  */}
                        <option value="YEARLY">Yearly</option>
                        <option value="MONTHLY">Monthly</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="DAILY">Daily</option>
                    </Field>
                </div>
                <div className="interval">
                    <label>Repeat Every</label>
                    <Field name="dates.recurring_rule.interval" component="select">
                        <option></option>
                        {/* Create 30 options with 1...30 values */}
                        {Array.apply(null, { length: 30 }).map(Number.call, Number).map((n) => (
                            <option key={n + 1} value={n + 1}>{n + 1}</option>
                        ))}
                    </Field>
                </div>
                { this.props.frequency === 'WEEKLY' &&
                    <div>
                        <label>Repeat on</label>
                        <Field name="dates.recurring_rule.byday" component={DaysOfWeek} />
                    </div>
                }
                <div>
                    <label>Ends</label>
                    <label>
                        <input
                            name="doesRepeatEnd"
                            checked={!this.props.doesRepeatEnd}
                            onChange={this.handleDoesRepeatEndChange.bind(this)}
                            value={false}
                            type="radio"/>
                        Never
                    </label>
                    <label>
                        <input
                            name="doesRepeatEnd"
                            checked={this.props.doesRepeatEnd === 'count'}
                            readOnly={true}
                            value="count"
                            type="radio"/>
                        After
                        <Field name="dates.recurring_rule.count"
                               component="input" type="number" />
                        occurrences
                    </label>
                    <label>
                        <input
                            name="doesRepeatEnd"
                            checked={this.props.doesRepeatEnd === 'until'}
                            readOnly={true}
                            value="until"
                            type="radio"/>
                        <Field name="dates.recurring_rule.until"
                               component={DayPickerInput} />
                        Until
                    </label>
                </div>
            </div>
        )
    }
}
RepeatEventFormComponent.propTypes = {
    change: PropTypes.func
}

// This is the same name defined in AddEventForm.jsx because it is just a sub form
const selector = formValueSelector('addEvent')
const mapStateToProps = (state) => ({
    frequency: selector(state, 'dates.recurring_rule.frequency'),
    // return 'until' or 'count' if these values are defined, otherwise false
    doesRepeatEnd: !isNil(selector(state, 'dates.recurring_rule.until')) ? 'until' :
        !isNil(selector(state, 'dates.recurring_rule.count')) ? 'count' : false,
})

export const RepeatEventForm = connect(mapStateToProps)(RepeatEventFormComponent)
