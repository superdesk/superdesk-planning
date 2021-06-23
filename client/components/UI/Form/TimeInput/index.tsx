import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment-timezone';
import {get} from 'lodash';

import {appConfig} from 'appConfig';
import {superdeskApi} from '../../../../superdeskApi';
import {KEYCODES} from '../../constants';

import {timeUtils} from '../../../../utils';

import {LineInput, Label, Input} from '../';
import {TimeInputPopup} from './TimeInputPopup';
import {IconButton} from '../../';

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
        this.isValidInput = this.isValidInput.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if ((this.state.invalid && !nextProps.toBeConfirmed) ||
            (!nextProps.value && !nextProps.canClear && !nextProps.showToBeConfirmed)) {
            return;
        }

        if (nextProps.toBeConfirmed) {
            const {gettext} = superdeskApi.localization;

            this.setState({
                viewValue: gettext('To Be Confirmed'),
                previousValidValue: '',
                invalid: false,
                showLocalValidation: false,
            });
        } else {
            const val = nextProps.value && moment.isMoment(nextProps.value) ?
                nextProps.value.format(appConfig.planning.timeformat) : '';

            this.setState({
                viewValue: val,
                previousValidValue: val,
                invalid: false,
                showLocalValidation: false,
            });
        }
    }

    componentDidMount() {
        // After first render, set the value
        const {gettext} = superdeskApi.localization;
        const value = this.props.toBeConfirmed ?
            gettext('To Be Confirmed') :
            this.props.value;
        const viewValue = value && moment.isMoment(value) ?
            value.format(appConfig.planning.timeformat) :
            (value || '');

        this.setState({viewValue});
    }

    toggleOpenTimePicker() {
        this.setState({openTimePicker: !this.state.openTimePicker});

        if (this.state.openTimePicker) {
            // Keep the focus to enable tab navigation
            this.dom.inputField.focus();
        }
    }

    isValidInput(val) {
        return moment(val, appConfig.planning.timeformat, true)
            .isValid();
    }

    validateTimeText(field, val) {
        if (!this.isValidInput(val)) {
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
                let newValueText;
                let valueFormat;

                // Interpret here
                switch (valueLength) {
                case 1:
                case 2:
                    valid = isValidHour(viewValue);
                    newValueText = viewValue;
                    valueFormat = 'HH';
                    break;
                case 3:
                    valid = isValidHour(viewValue[0]) && isValidMinute(viewValue.substring(1));
                    newValueText = `0${viewValue[0]}:${viewValue.substring(1)}`;
                    valueFormat = 'HH:mm';
                    break;
                case 4:
                    valid = isValidHour(viewValue.substring(0, 2)) && isValidMinute(viewValue.substring(2));
                    newValueText = `${viewValue.substring(0, 2)}:${viewValue.substring(2)}`;
                    valueFormat = 'HH:mm';
                    break;
                }

                if (newValueText && valueFormat) {
                    newValue = moment(newValueText, valueFormat, true)
                        .format(appConfig.planning.timeformat);
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
        const {value, onChange, field, remoteTimeZone, toBeConfirmed} = this.props;

        // Takes the time as a string (based on the configured time format)
        // Then parses it and calls parents onChange with new moment object
        if (!newValue) {
            onChange(field, null);
            return;
        }

        let newTime;
        let newMoment;

        if (remoteTimeZone) {
            newTime = moment.tz(newValue, appConfig.planning.timeformat, true, remoteTimeZone);
            newMoment = value && moment.isMoment(value) ?
                value.clone() :
                moment.tz(remoteTimeZone);
        } else {
            newTime = moment(newValue, appConfig.planning.timeformat, true);
            newMoment = value && moment.isMoment(value) ?
                value.clone() :
                moment();
        }

        newMoment.hour(newTime.hour());
        newMoment.minute(newTime.minute());
        newMoment.second(0);

        if (!newMoment.isSame(value) || !value || toBeConfirmed) {
            if (this.isValidInput(newValue) && this.state.invalid) {
                this.setState({
                    invalid: false,
                    viewValue: newValue,
                    previousValidValue: newValue,
                    showLocalValidation: false,
                });
            }
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
            isLocalTimeZoneDifferent,
            showToBeConfirmed,
            onToBeConfirmed,
            showDate,
            ...props
        } = this.props;

        const {gettext} = superdeskApi.localization;
        let {invalid, errors, message} = this.props;
        let displayDateString;

        if (moment.isMoment(value) && isLocalTimeZoneDifferent && !this.state.invalid && !invalid) {
            const displayDate = timeUtils.getDateInRemoteTimeZone(value, timeUtils.localTimeZone());
            let displayFormat = appConfig.planning.timeformat;

            if (showDate) {
                displayFormat = appConfig.planning.dateformat + ' @ ' + displayFormat;
            }

            displayDateString = `(${displayDate.format('z')} ${displayDate.format(displayFormat)})`;
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
            <LineInput
                {...props}
                readOnly={readOnly}
                invalid={invalid}
                errors={errors}
                message={message}
                boxed={true}
            >
                <Label text={label} />
                <IconButton
                    className="sd-line-input__icon-right"
                    icon="icon-time"
                    onFocus={onFocus}
                    onClick={!readOnly ? this.toggleOpenTimePicker : null}
                    aria-label={gettext('Time picker')}
                />
                <Input
                    field={field}
                    value={this.state.viewValue}
                    onChange={this.validateTimeText}
                    type="text"
                    placeholder={placeholder || gettext('Time')}
                    onBlur={this.handleInputBlur}
                    readOnly={readOnly || this.state.viewValue === gettext('To Be Confirmed')}
                    onFocus={onFocus}
                    onKeyDown={(event) => {
                        if (event.keyCode === KEYCODES.ENTER) {
                            this.setState({openTimePicker: true});
                        }
                    }}
                    refNode={(ref) => this.dom.inputField = ref}
                />
                {displayDateString && <span>{displayDateString}</span>}
                {this.state.openTimePicker && (
                    <TimeInputPopup
                        value={value}
                        onChange={this.onChange}
                        close={this.toggleOpenTimePicker}
                        target="icon-time"
                        popupContainer={popupContainer}
                        onPopupOpen={props.onPopupOpen}
                        onPopupClose={props.onPopupClose}
                        showToBeConfirmed={showToBeConfirmed}
                        onToBeConfirmed={onToBeConfirmed ? onToBeConfirmed.bind(null, field) : null}
                        toBeConfirmedText={gettext('To Be Confirmed')}
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
    allowInvalidText: PropTypes.bool,
    canClear: PropTypes.bool,
    errors: PropTypes.object,
    isLocalTimeZoneDifferent: PropTypes.bool,
    showToBeConfirmed: PropTypes.bool,
    onToBeConfirmed: PropTypes.func,
    toBeConfirmed: PropTypes.bool,
    showDate: PropTypes.bool,
};

TimeInput.defaultProps = {
    required: false,
    invalid: false,
    readOnly: false,
    boxed: false,
    noMargin: false,
    isLocalTimeZoneDifferent: false,
    showDate: false,
};
