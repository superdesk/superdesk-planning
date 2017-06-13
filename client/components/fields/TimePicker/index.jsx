import React, { PropTypes } from 'react'
import { TimePickerCore } from './TimePickerCore'
import moment from 'moment'
import './styles.scss'

export class TimePicker extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            openTimePicker: false,
            invalid: false,
            viewValue: '',
            previousValidValue: '',
        }
    }

    componentWillReceiveProps(nextProps) {
        const val = nextProps.value && moment.isMoment(nextProps.value) ? nextProps.value.format('HH:mm') : ''
        this.setState({
            viewValue: val,
            previousValidValue: val,
        })
    }

    toggleOpenTimePicker() {
        this.setState({ openTimePicker: !this.state.openTimePicker })
    }

    validateTimeText(val) {
        let regex = new RegExp('^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$', 'i')
        if (!val.match(regex)) {
            this.setState({
                invalid: true,
                viewValue: val,
            })
        } else {
            this.setState({
                invalid: false,
                viewValue: val,
                previousValidValue: val,
            })
            this.onChange(val)
        }
    }

    handleInputBlur() {
        if (this.state.invalid) {
            this.setState({
                viewValue: this.state.previousValidValue,
                invalid: false,
            })
        }
    }

    onChange(value) {
        // Takes HH:mm as string. Then parses it and calls parents onChange with new moment object
        const inputs = value.split(':')

        let newMoment = this.props.value && moment.isMoment(this.props.value) ? moment(this.props.value) : moment()
        newMoment.hour(inputs[0])
        newMoment.minute(inputs[1])

        if (!newMoment.isSame(this.props.value) || !this.props.value) {
            this.props.onChange(newMoment)
        }
    }

    render() {
        const { value, placeholder, readOnly } = this.props
        return (
            <div className="timepickerInput">
                <input type="text" className={ 'timepickerInput__textInput' + (this.state.invalid ? ' timepickerInput__textInput--invalid' : '')} disabled={readOnly ? 'disabled' : ''} value={this.state.viewValue} placeholder={placeholder} onChange={(e)=>(this.validateTimeText(e.target.value))}
                onBlur={this.handleInputBlur.bind(this)} />
                { !readOnly && <button className="timepickerInput--btn" type="button" onClick={this.toggleOpenTimePicker.bind(this)}>
                    <i className="icon-time"/></button>
                }
                { this.state.openTimePicker && (
                    <TimePickerCore value={value} onCancel={this.toggleOpenTimePicker.bind(this)}
                    onChange={this.onChange.bind(this)}/>
                )}
            </div>
        )
    }
}

TimePicker.propTypes = {
    value: PropTypes.object,
    placeholder: PropTypes.string,
    onChange: React.PropTypes.func.isRequired,
    readOnly: PropTypes.bool,
}
