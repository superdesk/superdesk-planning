import React, { PropTypes } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import moment from 'moment'

const timeRegex = /(\d{1,2}):(\d{1,2}) (\w{2})/g

export class DayPickerInput extends React.Component {

    constructor(props) {
        super(props)
        // get the date
        const selectedDate = props.input.value ?
            moment.utc(props.input.value) : undefined
        // get the time in a different variable (different field)
        const selectedTime = selectedDate ? selectedDate.format('h:mm A') : undefined
        // remove the time from the date
        if (selectedDate) selectedDate.startOf('day')
        this.state = {
            selectedTime,
            selectedDate,
        }
    }

    onDayChange(dateMoment) {
        this.setState({ selectedDate: dateMoment }, this.updateValueFromState)
    }

    updateValueFromState() {
        if (this.state.selectedDate) {
            let datetime = this.state.selectedDate.clone()
            // set the time if required
            if (this.props.withTime) {
                var m
                while ((m = timeRegex.exec(this.state.selectedTime)) !== null) {
                    if (m.index === timeRegex.lastIndex) timeRegex.lastIndex++
                    let a = m[3] === 'AM' ? 0 : 12
                    datetime.hour(parseInt(m[1]) + a).minute(parseInt(m[2]))
                }
            }

            this.props.input.onChange(datetime ? datetime : undefined)
        }
    }

    onTimeChange(event) {
        this.setState({ selectedTime: event.target.value }, this.updateValueFromState)
    }

    componentDidMount() {
        // after first render, set value of the form input
        this.updateValueFromState()
    }

    render() {
        return (
            <span>
                <DatePicker
                    selected={this.state.selectedDate}
                    onChange={this.onDayChange.bind(this)} />
                { this.props.withTime &&
                <select style={STYLE.time}
                        name="time"
                        value={this.state.selectedTime}
                        onChange={this.onTimeChange.bind(this)}>
                    { TIMES.map((t) =>
                        <option key={t} value={t}>{t}</option>
                    )}
                </select>
                }
            </span>
        )
    }
}
DayPickerInput.propTypes = { withTime: PropTypes.bool.isRequired }
DayPickerInput.defaultProps = { withTime: true }

const STYLE = {
    time: { width: 100 },
}

const TIMES = [
    '12:00 AM',
    '12:30 AM',
    '1:00 AM',
    '1:30 AM',
    '2:00 AM',
    '2:30 AM',
    '3:00 AM',
    '3:30 AM',
    '4:00 AM',
    '4:30 AM',
    '5:00 AM',
    '5:30 AM',
    '6:00 AM',
    '6:30 AM',
    '7:00 AM',
    '7:30 AM',
    '8:00 AM',
    '8:30 AM',
    '9:00 AM',
    '9:30 AM',
    '10:00 AM',
    '10:30 AM',
    '11:00 AM',
    '11:30 AM',
    '12:00 PM',
    '12:30 PM',
    '1:00 PM',
    '1:30 PM',
    '2:00 PM',
    '2:30 PM',
    '3:00 PM',
    '3:30 PM',
    '4:00 PM',
    '4:30 PM',
    '5:00 PM',
    '5:30 PM',
    '6:00 PM',
    '6:30 PM',
    '7:00 PM',
    '7:30 PM',
    '8:00 PM',
    '8:30 PM',
    '9:00 PM',
    '9:30 PM',
    '10:00 PM',
    '10:30 PM',
    '11:00 PM',
    '11:30 PM',
]
