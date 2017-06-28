import React, { PropTypes } from 'react'
import { Field, formValueSelector } from 'redux-form'
import { fields, RepeatEventSummary } from '../components'
import { connect } from 'react-redux'
import classNames from 'classnames'

class RepeatEventFormComponent extends React.Component {

    constructor(props) {
        super(props)
    }

    componentWillMount() {
        const { endRepeatMode, frequency, interval, start } = this.props

        const intervals = interval || 1
        const startDate = start || null

        if (endRepeatMode) {
            this.state = {
                endRepeatMode: endRepeatMode,
                interval: intervals,
                frequency: frequency,
                date: startDate,
            }
        } else {
            // if endRepeatMode not present set the default value for it
            this.state = {
                endRepeatMode: 'unlimited',
                interval: intervals,
                frequency: frequency,
                date: startDate,
            }
            this.props.change('dates.recurring_rule.endRepeatMode', 'unlimited')
        }
    }

    componentWillReceiveProps(nextProps) {
        const { endRepeatMode, until, count, frequency, start, interval } = nextProps

        if (until && endRepeatMode != 'until') {
            // force the selection of 'until' for endRepeatMode
            // covers the case when the user set a value for until date field
            // but don't select the 'until'related radio
            this.setState({ endRepeatMode: 'until' })
            this.props.change('dates.recurring_rule.endRepeatMode', 'until')
            return
        }

        if (count && endRepeatMode != 'count') {
            // force the selection of 'count' for endRepeatMode
            // covers the case when the user set a value for count integer field
            // but don't select the 'until'related radio
            this.setState({ endRepeatMode: 'count' })
            this.props.change('dates.recurring_rule.endRepeatMode', 'count')
            return
        }

        if (endRepeatMode && endRepeatMode !== this.state.endRepeatMode) {
            this.setState({ endRepeatMode: endRepeatMode })
            return
        }

        if (frequency !== this.props.frequency) {
            this.setState({ frequency: frequency })
            return
        }

        if (start !== this.props.start) {
            this.setState({ date: start })
            return
        }

        if (interval !== this.props.interval) {
            this.setState({ interval: interval })
            return
        }
    }

    handleEndRepeatModeChange(e) {
        if (this.state.endRepeatMode !== e.target.value) {
            const choicesWithInput = ['count', 'until']

            //we clear inputs that belong to radiobox
            choicesWithInput.forEach((fieldName) =>
                this.props.change('dates.recurring_rule.' + fieldName, null)
            )

            // if the clicked radiobox belongs to an input field
            if (choicesWithInput.indexOf(e.target.value) > -1) {
                // focus the field
                this.refs['recurring_rule--' + e.target.value].getRenderedComponent().focus()
            }

            this.props.change('dates.recurring_rule.endRepeatMode', e.target.value)
            this.setState({ endRepeatMode:  e.target.value })
        }
    }

    render() {
        const frequences = {
            YEARLY: 'years',
            MONTHLY: 'months',
            WEEKLY: 'weeks',
            DAILY: 'days',
        }

        const readOnly = this.props.readOnly
        const readOnlyClasses = classNames({ 'disabledInput': readOnly })
        const readOnlyAttr = readOnly ? 'disabled' : ''

        return (
            <div>
                <div>
                    <label>Repeats</label>
                    <Field name="dates.recurring_rule.frequency" component="select"
                        className={readOnlyClasses}
                        disabled={readOnlyAttr} >
                        {/* values come from http://tinyurl.com/hqol55p */}
                        <option value="YEARLY">Yearly</option>
                        <option value="MONTHLY">Monthly</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="DAILY">Daily</option>
                    </Field>
                </div>
                <div className="recurring__interval">
                    <label>Repeat every</label>
                    <Field name="dates.recurring_rule.interval" component="select"
                        className={readOnlyClasses}
                        disabled={readOnlyAttr}>
                        {/* Create 30 options with 1...30 values */}
                        {Array.apply(null, { length: 30 }).map(Number.call, Number).map((n) => (
                            <option key={n + 1} value={n + 1}>
                                {n + 1} { n === 0 && this.props.frequency ? frequences[this.props.frequency].slice(0, -1) :
                                    frequences[this.props.frequency]}
                            </option>
                        ))}
                    </Field>
                </div>
                { this.props.frequency === 'WEEKLY' &&
                    <div>
                        <label htmlFor="dates.recurring_rule.byday">Repeat on</label>
                        <Field name="dates.recurring_rule.byday" component={fields.DaysOfWeek} readOnly={readOnly}/>
                    </div>
                }
                <div className="recurring__ends">
                    <label>Ends</label>
                    <label>
                        <input
                            name="endRepeatMode"
                            className={readOnlyClasses}
                            disabled={readOnlyAttr}
                            checked={this.state.endRepeatMode === 'unlimited'}
                            onChange={this.handleEndRepeatModeChange.bind(this)}
                            value="unlimited"
                            type="radio"/>
                        Never
                    </label>
                    <label>
                        <input
                            name="endRepeatMode"
                            checked={this.state.endRepeatMode === 'count'}
                            className={readOnlyClasses}
                            disabled={readOnlyAttr}
                            onChange={this.handleEndRepeatModeChange.bind(this)}
                            value="count"
                            type="radio"/>
                        After
                        <Field name="dates.recurring_rule.count"
                            text="occurrences"
                            withRef={true}
                            ref="recurring_rule--count"
                            component={fields.InputIntegerField}
                            readOnly={readOnly} />
                    </label>
                    <label>
                        <input
                            name="endRepeatMode"
                            className={readOnlyClasses}
                            disabled={readOnlyAttr}
                            checked={this.state.endRepeatMode === 'until'}
                            onChange={this.handleEndRepeatModeChange.bind(this)}
                            value="until"
                            type="radio"/>
                        <span htmlFor="dates.recurring_rule.until">On</span>
                        <Field name="dates.recurring_rule.until"
                           withRef={true}
                           ref="recurring_rule--until"
                           component={fields.DayPickerInput}
                           readOnly={readOnly} />
                    </label>
                    <RepeatEventSummary byDay={this.props.byDay}
                        interval={this.state.interval}
                        frequency={this.props.frequency}
                        endRepeatMode={this.state.endRepeatMode}
                        until={this.props.until}
                        count={this.props.count}
                        startDate={this.props.start} />
                </div>
            </div>
        )
    }
}
RepeatEventFormComponent.propTypes = {
    change: PropTypes.func.isRequired,
    frequency: PropTypes.oneOf(['YEARLY', 'MONTHLY', 'WEEKLY', 'DAILY']),
    endRepeatMode: PropTypes.oneOf(['unlimited', 'count', 'until']),
    until: PropTypes.object,
    count: PropTypes.string,
    byDay: PropTypes.string,
    start: PropTypes.object,
    interval: PropTypes.string,
    readOnly: PropTypes.bool,
}

// This is the same name defined in EventForm.jsx because it is just a sub form
const selector = formValueSelector('addEvent')
const mapStateToProps = (state) => ({
    frequency: selector(state, 'dates.recurring_rule.frequency'),
    endRepeatMode: selector(state, 'dates.recurring_rule.endRepeatMode'),
    until: selector(state, 'dates.recurring_rule.until'),
    count: selector(state, 'dates.recurring_rule.count'),
    byDay: selector(state, 'dates.recurring_rule.byday'),
    start: selector(state, 'dates.start'),
    interval: selector(state, 'dates.recurring_rule.interval'),
})

export const RepeatEventForm = connect(mapStateToProps)(RepeatEventFormComponent)
