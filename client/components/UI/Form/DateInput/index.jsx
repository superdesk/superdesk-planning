import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {LineInput, Label, Input} from '../';
import {DateInputPopup} from './DateInputPopup';
import {KEYCODES} from '../../../../constants';
import {onEventCapture} from '../../../../utils';
import './style.scss';

export class DateInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            openDatePicker: false,
            invalid: false,
            viewValue: '',
            previousValidValue: '',
        };
        this.dom = {inputField: null};

        this.validateDateText = this.validateDateText.bind(this);
        this.handleInputBlur = this.handleInputBlur.bind(this);
        this.toggleOpenDatePicker = this.toggleOpenDatePicker.bind(this);
        this.onChange = this.onChange.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        const {value, dateFormat} = this.props;
        const val = nextProps.value && moment.isMoment(nextProps.value) ? nextProps.value.format(dateFormat) : '';

        this.setState({
            viewValue: val,
            previousValidValue: value
        });
    }

    componentDidMount() {
        // After first render, set value
        const {value, dateFormat} = this.props;
        const viewValue = value && moment.isMoment(value) ? value.format(dateFormat) : '';

        this.setState({viewValue});
    }

    toggleOpenDatePicker() {
        this.setState({openDatePicker: !this.state.openDatePicker});

        if (this.state.openDatePicker) {
            // Keep the focus to enable tab navigation
            this.dom.inputField.focus();
        }
    }

    validateDateText(field, val) {
        let regex = new RegExp('[0-9][0-9]/[0-9][0-9]/[0-9][0-9][0-9][0-9]', 'i');
        const valMoment = moment(val, this.props.dateFormat);

        if (val.match(regex) && valMoment.isValid()) {
            this.setState({
                invalid: false,
                viewValue: valMoment,
                previousValidValue: valMoment,
            });
            this.onChange(valMoment);
        } else {
            this.setState({
                invalid: true,
                viewValue: val,
            });
        }
    }

    handleInputBlur() {
        if (this.state.invalid) {
            this.setState({
                viewValue: this.state.previousValidValue.format(this.props.dateFormat),
                invalid: false,
            });
        }
    }

    onChange(newValue) {
        const {value, onChange, field} = this.props;
        let newMoment = newValue;

        if (!moment.isMoment(newMoment)) {
            newMoment = moment(newValue);
        }

        if (newMoment.isValid() && (!newMoment.isSame(value)) || !value) {
            onChange(
                field,
                newMoment
            );
        }
    }

    render() {
        const {
            field,
            label,
            placeholder,
            value,
            readOnly,
            popupContainer,
            ...props
        } = this.props;

        return (
            <LineInput {...props} readOnly={readOnly}>
                <Label text={label} />
                <a className="icn-btn sd-line-input__icon-right"
                    onClick={readOnly ? undefined : this.toggleOpenDatePicker}>
                    <i className="icon-calendar" />
                </a>
                <Input
                    field={field}
                    value={this.state.viewValue}
                    placeholder={placeholder}
                    onChange={this.validateDateText}
                    onBlur={this.handleInputBlur}
                    type="text"
                    readOnly={readOnly}
                    onKeyDown={(event) => {
                        if (event.keyCode === KEYCODES.ENTER) {
                            onEventCapture(event);
                            this.setState({openDatePicker: true});
                        }
                    }
                    }
                    refNode={(ref) => this.dom.inputField = ref}
                />
                {this.state.openDatePicker && (
                    <DateInputPopup
                        value={value}
                        onChange={this.onChange}
                        close={this.toggleOpenDatePicker}
                        target="icon-calendar"
                        popupContainer={popupContainer}
                    />
                )}
            </LineInput>
        );
    }
}

DateInput.propTypes = {
    field: PropTypes.string.isRequired,
    label: PropTypes.string,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.instanceOf(moment),
    ]),
    onChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    className: PropTypes.string,
    dateFormat: PropTypes.string.isRequired,

    hint: PropTypes.string,
    message: PropTypes.string,
    required: PropTypes.bool,
    invalid: PropTypes.bool,
    readOnly: PropTypes.bool,
    boxed: PropTypes.bool,
    noMargin: PropTypes.bool,
    popupContainer: PropTypes.func,
};

DateInput.defaultProps = {
    placeholder: 'Date',
    required: false,
    invalid: false,
    readOnly: false,
    boxed: false,
    noMargin: false,
};
