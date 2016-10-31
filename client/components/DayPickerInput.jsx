import React, { PropTypes } from 'react'
import DatePicker from 'react-datepicker'
import TimePicker from 'rc-time-picker'
import moment from 'moment'
import 'react-datepicker/dist/react-datepicker.css'
import 'rc-time-picker/assets/index.css'

export class DayPickerInput extends React.Component {

    constructor(props) {
        super(props)
        // get the date
        const selectedDate = props.input.value ?
            moment.utc(props.input.value) : undefined
        // get the time in a different variable (different field)
        const selectedTime = selectedDate ? moment.utc(selectedDate) : undefined
        // remove the time from the date
        if (selectedDate) selectedDate.startOf('day')
        this.state = {
            selectedTime,
            selectedDate,
        }
    }

    onDayChange(selectedDate) {
        this.setState({ selectedDate }, this.updateValueFromState)
    }

    onTimeChange(selectedTime) {
        this.setState({ selectedTime }, this.updateValueFromState)
    }

    updateValueFromState() {
        if (this.state.selectedDate) {
            let datetime = this.state.selectedDate.clone()
            // set the time if required
            if (this.props.withTime && this.state.selectedTime) {
                datetime
                .hour(this.state.selectedTime.hours())
                .minute(this.state.selectedTime.minutes())
            }

            this.props.input.onChange(datetime ? datetime : undefined)
        }
    }

    componentDidMount() {
        // after first render, set value of the form input
        this.updateValueFromState()
    }

    render() {
        const { touched, error, warning } = this.props.meta
        return (
            <span className="day-picker-input">
                {
                    touched && ((error && <div>{error}</div>) ||
                    (warning && <div>{warning}</div>))
                }
                <DatePicker
                    selected={this.state.selectedDate}
                    onChange={this.onDayChange.bind(this)} />
                {(this.props.withTime === true) && (
                    <TimePicker
                        placeholder="Time"
                        defaultValue={this.state.selectedTime}
                        showSecond={false}
                        hideDisabledOptions={true}
                        onChange={this.onTimeChange.bind(this)} />
                )}
            </span>
        )
    }
}
DayPickerInput.propTypes = { withTime: PropTypes.bool }
DayPickerInput.defaultProps = { withTime: true, meta: {} }
