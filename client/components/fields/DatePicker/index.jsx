import React, { PropTypes } from 'react'
import moment from 'moment'
import { DatePickerCore } from './DatePickerCore'
import './styles.scss'

export class DatePicker extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            openDatePicker: false,
            invalid: false,
            viewValue: '',
            previousValidValue: '',
        }
    }

    componentWillReceiveProps(nextProps) {
        const val = nextProps.value && moment.isMoment(nextProps.value) ? nextProps.value.format('DD/MM/YYYY') : ''
        this.setState({
            viewValue: val,
            previousValidValue: val,
        })
    }

    toggleOpenDatePicker() {
        this.setState({ openDatePicker: !this.state.openDatePicker })
    }

    handleFocus() {
        this.toggleOpenDatePicker()
    }

    validateTimeText(val) {
        let regex = new RegExp('[0-9][0-9]\/[0-9][0-9]\/[0-9][0-9][0-9][0-9]', 'i')
        if (val.match(regex) && moment(val, 'DD/MM/YYYY').isValid()) {
            this.setState({
                invalid: false,
                viewValue: val,
                previousValidValue: val,
            })
            this.onChange(val)
        } else {
            this.setState({
                invalid: true,
                viewValue: val,
            })
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
        if (value.isValid() && (!value.isSame(this.props.value)) || !this.props.value) {
            // Set the time to 00:00 as per requirement
            this.props.onChange(value.clone().hour(0).minute(0))
        }
    }

    render() {
        const { value, placeholder, readOnly } = this.props
        return (
            <div className="datepickerInput">
                <input type="text" className={ 'datepickerInput__textInput inputField' + (this.state.invalid ? ' datepickerInput__textInput--invalid' : '')} disabled={readOnly ? 'disabled' : ''} value={this.state.viewValue} placeholder={placeholder} onChange={(e)=>(this.validateTimeText(e.target.value))}
                onBlur={this.handleInputBlur.bind(this)} />
                { !readOnly && <button className="datepickerInput--btn" type="button" onClick={this.toggleOpenDatePicker.bind(this)}>
                    <i className="icon-calendar"/></button>
                }
                {this.state.openDatePicker && (
                    <DatePickerCore value={value} onCancel={this.toggleOpenDatePicker.bind(this)}
                    onChange={this.onChange.bind(this)}/>
                )}
            </div>
        )
    }
}

DatePicker.propTypes = {
    value: PropTypes.object,
    placeholder: PropTypes.string,
    onChange: React.PropTypes.func.isRequired,
    readOnly: PropTypes.bool,
}
