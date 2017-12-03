import React from 'react';
import PropTypes from 'prop-types';
import {TimePickerCore} from './TimePickerCore';
import moment from 'moment';
import './styles.scss';

export class TimePicker extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            openTimePicker: false,
            invalid: false,
            viewValue: '',
            previousValidValue: '',
        };
    }

    componentWillReceiveProps(nextProps) {
        const val = nextProps.input.value && moment.isMoment(nextProps.input.value) ?
            nextProps.input.value.format('HH:mm') : '';

        this.setState({
            viewValue: val,
            previousValidValue: val,
        });
    }

    componentDidMount() {
        // after first render, set value of the form input
        const value = this.props.input.value;
        const viewValue = value && moment.isMoment(value) ? value.format('HH:mm') : '';

        this.setState({viewValue});
    }

    toggleOpenTimePicker() {
        this.setState({openTimePicker: !this.state.openTimePicker});
    }

    validateTimeText(val) {
        let regex = new RegExp('^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$', 'i');

        if (!val.match(regex)) {
            this.setState({
                invalid: true,
                viewValue: val,
            });
        } else {
            this.setState({
                invalid: false,
                viewValue: val,
                previousValidValue: val,
            });
            this.onChange(val);
        }
    }

    handleInputBlur() {
        if (this.state.invalid) {
            this.setState({
                viewValue: this.state.previousValidValue,
                invalid: false,
            });
        }
    }

    onChange(value) {
        // Takes HH:mm as string. Then parses it and calls parents onChange with new moment object
        const inputs = value.split(':');

        let newMoment = this.props.input.value && moment.isMoment(this.props.input.value) ?
            moment(this.props.input.value) : moment();

        newMoment.hour(inputs[0]);
        newMoment.minute(inputs[1]);

        if (!newMoment.isSame(this.props.input.value) || !this.props.input.value) {
            this.props.input.onChange(newMoment);
        }
    }

    render() {
        const {placeholder, readOnly} = this.props;
        const {touched, error, warning} = this.props.meta;

        return (
            <div className="timepickerInput">
                <input
                    type="text"
                    className={ 'timepickerInput__textInput' + (this.state.invalid ?
                        ' timepickerInput__textInput--invalid' : '')}
                    disabled={readOnly ? 'disabled' : ''}
                    value={this.state.viewValue}
                    placeholder={placeholder}
                    onChange={(e) => (this.validateTimeText(e.target.value))}
                    onBlur={this.handleInputBlur.bind(this)} />
                <button className="timepickerInput--btn"
                    type="button"
                    onClick={!readOnly && this.toggleOpenTimePicker.bind(this)}>
                    <i className="icon-time"/>
                </button>
                { this.state.openTimePicker && (
                    <TimePickerCore
                        value={this.props.input.value}
                        onCancel={this.toggleOpenTimePicker.bind(this)}
                        onChange={this.onChange.bind(this)}/>
                )}
                {
                    touched && ((error && <div className="error-block">{error}</div>) ||
                    (warning && <div className="day-picker-input__error">{warning}</div>))
                }
            </div>
        );
    }
}

TimePicker.propTypes = {
    input: PropTypes.shape({
        value: PropTypes.object,
        onChange: PropTypes.func,
    }).isRequired,
    placeholder: PropTypes.string,
    readOnly: PropTypes.bool,
    meta: PropTypes.object,
};

TimePicker.defaultProps = {meta: {}};
