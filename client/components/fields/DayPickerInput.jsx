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
        const selectedDate = this.props.input.value ?
            moment(this.props.input.value) : this.props.defaultDate ?
            moment(this.props.defaultDate) : undefined
        // get the time in a different variable (different field)
        const selectedTime = selectedDate ? moment(selectedDate) : undefined
        // remove the time from the date
        if (selectedDate) selectedDate.startOf('day')
        this.state = {
            selectedTime,
            selectedDate,
        }
    }

    /** open the date picker */
    focus() {
        this.refs.datePicker.handleFocus()
    }

    setStateFromDate(_date, cb) {
        // if there is no date, reset the state
        if (!_date) {
            return this.setState({ selectedTime: undefined, selectedDate: undefined }, cb)
        }
        // otherwise compute the value of date and time fields
        let date = moment(_date)
        // get the time in a different variable (different field)
        const selectedTime = date ? moment(date) : undefined
        // remove the time from the date
        if (date) date.startOf('day')
        this.setState({
            selectedTime,
            selectedDate: date,
        }, cb)
    }

    /** Update the state when the props change */
    componentWillReceiveProps(nextProps) {
        if (nextProps.defaultDate !== this.props.defaultDate) {
            this.setStateFromDate(nextProps.defaultDate, this.updateValueFromState)
        }

        if (nextProps.input.value !== this.props.input.value) {
            this.setStateFromDate(nextProps.input.value, this.updateValueFromState)
        }
    }

    onDayChange(selectedDate) {
        this.setState(
            // given date is utc, we convert to local
            { selectedDate: moment(selectedDate.format('YYYY-MM-DDTHH:mm:ss')) },
            this.updateValueFromState
        )
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
            // updates the field value
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
                    ref="datePicker"
                    disabled={this.props.disabled}
                    className="line-input"
                    selected={this.state.selectedDate}
                    onChange={this.onDayChange.bind(this)} />
                {(this.props.withTime === true) && (
                    <TimePicker
                        disabled={this.props.disabled}
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
DayPickerInput.propTypes = {
    withTime: PropTypes.bool,
    defaultDate: PropTypes.object,
    input: PropTypes.object,
    meta: PropTypes.object,
    disabled: PropTypes.bool,
}
DayPickerInput.defaultProps = { withTime: false, meta: {} }
