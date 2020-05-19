import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {isEqual} from 'lodash';

import {appConfig} from 'appConfig';

import {LineInput, Label, Input} from '../';
import {IconButton} from '../../';
import {DateInputPopup} from './DateInputPopup';
import {KEYCODES} from '../../constants';
import {onEventCapture} from '../../utils';
import {timeUtils} from '../../../../utils';
import {gettext} from '../../../../utils/gettext';
import './style.scss';

/**
 * @ngdoc react
 * @name DateInput
 * @description Component to pick dates in calendar view
 */
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
        const {value} = this.props;

        // Only update the value if they have changed
        // This fixes the value being cleared on autosave (SDESK-4929)
        if (!isEqual(value, nextProps.value)) {
            const val = nextProps.value && moment.isMoment(nextProps.value) ?
                nextProps.value.format(appConfig.view.dateformat) : '';

            this.setState({
                viewValue: val,
                previousValidValue: value,
            });
        }
    }

    componentDidMount() {
        // After first render, set value
        const {value} = this.props;
        const viewValue = value && moment.isMoment(value) ?
            value.format(appConfig.view.dateformat) : '';

        this.setState({viewValue});
    }

    /**
    * @ngdoc method
    * @name DateInput#toggleOpenDatePicker
    * @description toggleOpenDatePicker toggles open state of date-picker pop-up
    */
    toggleOpenDatePicker() {
        this.setState({openDatePicker: !this.state.openDatePicker});

        if (this.state.openDatePicker) {
            // Keep the focus to enable tab navigation
            this.dom.inputField.focus();
        }
    }

    /**
    * @ngdoc method
    * @name DateInput#validateDateText
    * @description validateDateText sets validate-state after text-input of dates
    */
    validateDateText(field, val) {
        const valMoment = this.props.remoteTimeZone ?
            moment.tz(val, appConfig.view.dateformat, true, this.props.remoteTimeZone) :
            moment(val, appConfig.view.dateformat, true);

        if (valMoment.isValid()) {
            this.setState({
                invalid: false,
                viewValue: valMoment.format(appConfig.view.dateformat),
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

    /**
    * @ngdoc method
    * @name DateInput#handleInputBlur
    * @description handleInputBlur resets view-value incase of invalid date input
    * @returns {string} Icon class-name
    */
    handleInputBlur() {
        if (this.state.invalid) {
            const previousValidValue = this.state.previousValidValue;

            this.setState({
                viewValue: moment.isMoment(previousValidValue) && previousValidValue.isValid() ?
                    previousValidValue.format(appConfig.view.dateformat) : '',
                invalid: false,
            });
        }
    }

    onChange(newValue) {
        const {value, onChange, field, remoteTimeZone} = this.props;
        let newMoment = newValue;

        if (!moment.isMoment(newMoment)) {
            newMoment = moment.tz(newValue, remoteTimeZone);
        }

        if (newMoment.isValid() && (!newMoment.isSame(value) || !value)) {
            onChange(field, newMoment);
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
            onFocus,
            onPopupOpen,
            onPopupClose,
            isLocalTimeZoneDifferent,
            remoteTimeZone,
            inputAsLabel,
            ...props
        } = this.props;

        let {message, invalid} = this.props;
        const eventTimeZoneString = timeUtils.getDateInRemoteTimeZone(value, remoteTimeZone).format('z');
        let displayDateString;

        if (moment.isMoment(value) && isLocalTimeZoneDifferent) {
            const displayDate = timeUtils.getDateInRemoteTimeZone(value, timeUtils.localTimeZone());

            displayDateString = `(${displayDate.format('z')} ${displayDate.format(appConfig.view.dateformat)})`;
        }

        if (!invalid && this.state.invalid) {
            invalid = true;
            message = gettext('Invalid Date');
        }

        return (
            <LineInput {...props} readOnly={readOnly} message={message} invalid={invalid}>
                <Label text={label} />
                {!inputAsLabel && <IconButton
                    className="sd-line-input__icon-right"
                    icon="icon-calendar"
                    onFocus={onFocus}
                    onClick={readOnly ? undefined : this.toggleOpenDatePicker}
                />}
                {inputAsLabel && value &&
                <div className="sd-line-input__date-as-label">{`${eventTimeZoneString} ${this.state.viewValue}`}</div>}
                {!inputAsLabel && <Input
                    field={field}
                    value={this.state.viewValue}
                    placeholder={placeholder || gettext('Date')}
                    onChange={this.validateDateText}
                    onFocus={onFocus}
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
                    refNode={(ref) => {
                        this.dom.inputField = ref;
                        if (this.props.refNode) {
                            this.props.refNode(ref);
                        }
                    }}
                />}
                {displayDateString && <span>{displayDateString}</span>}
                {this.state.openDatePicker && (
                    <DateInputPopup
                        value={value}
                        onChange={this.onChange}
                        close={this.toggleOpenDatePicker}
                        target="icon-calendar"
                        popupContainer={popupContainer}
                        onPopupOpen={onPopupOpen}
                        onPopupClose={onPopupClose}
                        remoteTimeZone={remoteTimeZone}
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
    onPopupOpen: PropTypes.func,
    onPopupClose: PropTypes.func,
    isLocalTimeZoneDifferent: PropTypes.bool,
    inputAsLabel: PropTypes.bool,
    refNode: PropTypes.func,
};

DateInput.defaultProps = {
    required: false,
    invalid: false,
    readOnly: false,
    boxed: false,
    noMargin: false,
    hideIcon: false,
    inputAsLabel: false,
};
