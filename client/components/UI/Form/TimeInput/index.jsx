import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {get} from 'lodash';

import {LineInput, Label, Input} from '../';
import {TimeInputPopup} from './TimeInputPopup';
import {IconButton} from '../../';
import {KEYCODES} from '../../constants';
import {gettext} from '../../../../utils/gettext';
import {isEventInDifferentTimeZone, localTimeZone} from '../../utils';
import './style.scss';

/**
 * @ngdoc react
 * @name TimeInput
 * @description Component to pick time in hours and minutes
 */
export class TimeInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            openTimePicker: false,
            invalid: false,
            viewValue: '',
            previousValidValue: '',
            showLocalValidation: false,
        };

        this.dom = {inputField: null};
        this.handleInputBlur = this.handleInputBlur.bind(this);
        this.validateTimeText = this.validateTimeText.bind(this);
        this.toggleOpenTimePicker = this.toggleOpenTimePicker.bind(this);
        this.onChange = this.onChange.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (this.state.invalid || (!nextProps.value && !nextProps.canClear)) {
            return;
        }

        const val = nextProps.value && moment.isMoment(nextProps.value) ?
            nextProps.value.format(this.props.timeFormat) : '';

        this.setState({
            viewValue: val,
            previousValidValue: val,
            invalid: false,
            showLocalValidation: false,
        });
    }

    componentDidMount() {
        // After first render, set the value
        const value = this.props.value;
        const viewValue = value && moment.isMoment(value) ? value.format(this.props.timeFormat) : '';

        this.setState({viewValue});
    }

    toggleOpenTimePicker() {
        this.setState({openTimePicker: !this.state.openTimePicker});

        if (this.state.openTimePicker) {
            // Keep the focus to enable tab navigation
            this.dom.inputField.focus();
        }
    }

    validateTimeText(field, val) {
        let regex = new RegExp('^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$', 'i');

        if (!val.match(regex)) {
            this.setState({
                invalid: true,
                viewValue: val,
                showLocalValidation: false,
            });
        } else {
            this.setState({
                invalid: false,
                viewValue: val,
                previousValidValue: val,
                showLocalValidation: false,
            });
            this.onChange(val);
        }
    }

    /**
    * @ngdoc method
    * @name TimeInput#handleInputBlur
    * @description handleInputBlur resets view-value incase of invalid time input
    */
    handleInputBlur() {
        const {viewValue, invalid} = this.state;

        if (invalid) {
            const isValidHour = (n) => (parseInt(n, 10) >= 0 && parseInt(n, 10) < 24);
            const isValidMinute = (n) => (parseInt(n, 10) >= 0 && parseInt(n, 10) <= 59);

            // Try to interpret the text input to a valid time
            let valid = !invalid;
            let regex = new RegExp('^[0-9]*:?[0-9]*$', 'i');
            let newValue;
            const valueLength = get(viewValue, 'length', 0);

            if (viewValue.match(regex) && valueLength > 0 && valueLength <= 5) {
                // Interpret here
                switch (valueLength) {
                case 1:
                case 2:
                    valid = isValidHour(viewValue);
                    newValue = viewValue + ':00';
                    break;
                case 3:
                    valid = isValidHour(viewValue[0]) && isValidMinute(viewValue.substring(1));
                    newValue = `0${viewValue[0]}:${viewValue.substring(1)}`;
                    break;
                case 4:
                    valid = isValidHour(viewValue.substring(0, 2)) && isValidMinute(viewValue.substring(2));
                    newValue = `${viewValue.substring(0, 2)}:${viewValue.substring(2)}`;
                    break;
                }
            }

            if (!valid) {
                if (!this.props.canClear && this.props.allowInvalidText) {
                    // Still invalid
                    this.setState({invalid: true, showLocalValidation: true});
                    this.onChange(null);
                    return;
                }
                newValue = this.state.previousValidValue;
            }

            this.onChange(newValue);
            this.setState({invalid: false, viewValue: (newValue.length === 4 ? ('0' + newValue) : newValue)});
        }
    }

    onChange(newValue) {
        const {value, onChange, field, timeFormat} = this.props;

        // Takes the time as a string (based on the configured time format)
        // Then parses it and calls parents onChange with new moment object
        if (!newValue) {
            onChange(field, null);
            return;
        }

        const newTime = moment(newValue, timeFormat);
        let newMoment = value && moment.isMoment(value) ? moment(value) : moment();

        newMoment.hour(newTime.hour());
        newMoment.minute(newTime.minute());
        newMoment.second(0);

        if (!newMoment.isSame(value) || !value) {
            onChange(field, newMoment);
        }
    }

    render() {
        const {
            placeholder,
            field,
            label,
            value,
            readOnly,
            popupContainer,
            onFocus,
            remoteTimeZone,
            timeFormat,
            dateFormat,
            ...props
        } = this.props;

        let {invalid, errors, message} = this.props;
        let remoteDateString;

        if (moment.isMoment(value) && remoteTimeZone && isEventInDifferentTimeZone({dates: {tz: remoteTimeZone}})) {
            const conversionTimeZone = value.tz() === remoteTimeZone ? localTimeZone() : remoteTimeZone;
            const remoteDate = moment.tz(value, conversionTimeZone);
            let remoteTimeFormat = timeFormat;

            if (remoteDate.date() !== value.date() && dateFormat) {
                remoteTimeFormat = dateFormat + ' @ ' + remoteTimeFormat;
            }

            remoteDateString = `(${moment.tz(remoteTimeZone).format('z')} ${remoteDate.format(remoteTimeFormat)})`;
        }

        if (this.state.showLocalValidation) {
            if (!invalid && this.state.invalid) {
                invalid = true;
            }

            if (this.state.invalid && this.state.viewValue) {
                message = gettext('Invalid time');
            }
        }

        return (
            <LineInput {...props} readOnly={readOnly} invalid={invalid} errors={errors} message={message}>
                <Label text={label} />
                <IconButton
                    className="sd-line-input__icon-right"
                    icon="icon-time"
                    onFocus={onFocus}
                    onClick={!readOnly ? this.toggleOpenTimePicker : null}
                />
                <Input
                    field={field}
                    value={this.state.viewValue}
                    onChange={this.validateTimeText}
                    type="text"
                    placeholder={placeholder || gettext('Time')}
                    onBlur={this.handleInputBlur}
                    readOnly={readOnly}
                    onFocus={onFocus}
                    onKeyDown={(event) => {
                        if (event.keyCode === KEYCODES.ENTER) {
                            this.setState({openTimePicker: true});
                        }
                    }
                    }
                    refNode={(ref) => this.dom.inputField = ref}
                />
                {remoteTimeZone && remoteDateString &&
                    <span>{remoteDateString}</span>}
                {this.state.openTimePicker && (
                    <TimeInputPopup
                        value={value}
                        onChange={this.onChange}
                        close={this.toggleOpenTimePicker}
                        target="icon-time"
                        popupContainer={popupContainer}
                        onPopupOpen={props.onPopupOpen}
                        onPopupClose={props.onPopupClose}
                    />
                )}
            </LineInput>
        );
    }
}

TimeInput.propTypes = {
    field: PropTypes.string.isRequired,
    label: PropTypes.string,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.instanceOf(moment),
    ]),
    onChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    timeFormat: PropTypes.string.isRequired,

    hint: PropTypes.string,
    message: PropTypes.string,
    required: PropTypes.bool,
    invalid: PropTypes.bool,
    readOnly: PropTypes.bool,
    boxed: PropTypes.bool,
    noMargin: PropTypes.bool,
    popupContainer: PropTypes.func,
    onFocus: PropTypes.func,
    remoteTimeZone: PropTypes.string,
    dateFormat: PropTypes.string,
    allowInvalidText: PropTypes.bool,
    canClear: PropTypes.bool,
    errors: PropTypes.object,
};

TimeInput.defaultProps = {
    required: false,
    invalid: false,
    readOnly: false,
    boxed: false,
    noMargin: false,
};
