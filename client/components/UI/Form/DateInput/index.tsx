import React from 'react';
import moment from 'moment-timezone';
import {isEqual} from 'lodash';

import {appConfig} from 'appConfig';
import {superdeskApi} from '../../../../superdeskApi';
import {KEYCODES} from '../../constants';

import {onEventCapture} from '../../utils';
import {timeUtils} from '../../../../utils';

import {LineInput, Label, Input} from '../';
import {IconButton} from '../../';
import {DateInputPopup} from './DateInputPopup';

import './style.scss';

interface IProps {
    field: string;
    label?: string;
    value?: moment.Moment;
    placeholder?: string;
    className?: string;
    hint?: string;
    message?: string;
    required?: boolean;
    invalid?: boolean;
    readOnly?: boolean;
    boxed?: boolean;
    noMargin?: boolean;
    remoteTimeZone?: string;
    isLocalTimeZoneDifferent?: boolean;
    inputAsLabel?: boolean;

    onChange(field: string, value: moment.Moment): void;
    popupContainer(): HTMLElement;
    onFocus?(): void;
    onPopupOpen?(): void;
    onPopupClose?(): void;
    refNode?(node: HTMLElement): void;
    inputTestId?: string;
}

interface IState {
    openDatePicker: boolean;
    invalid: boolean;
    viewValue: string;
    previousValidValue?: moment.Moment;
}

/**
 * @ngdoc react
 * @name DateInput
 * @description Component to pick dates in calendar view
 */
export class DateInput extends React.Component<IProps, IState> {
    dom: {inputField: any};

    constructor(props) {
        super(props);
        this.state = {
            openDatePicker: false,
            invalid: false,
            viewValue: this.props.value != null && moment.isMoment(this.props.value) ?
                this.props.value.format(appConfig.planning.dateformat) :
                '',
            previousValidValue: undefined,
        };
        this.dom = {inputField: null};

        this.onInputChange = this.onInputChange.bind(this);
        this.handleInputBlur = this.handleInputBlur.bind(this);
        this.toggleOpenDatePicker = this.toggleOpenDatePicker.bind(this);
        this.onPopupChange = this.onPopupChange.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        const {value} = this.props;

        // Only update the value if they have changed
        // This fixes the value being cleared on autosave (SDESK-4929)
        if (!isEqual(value, nextProps.value)) {
            const val = nextProps.value && moment.isMoment(nextProps.value) ?
                nextProps.value.format(appConfig.planning.dateformat) : '';

            this.setState({
                viewValue: val,
                previousValidValue: value,
            });
        }
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
    * sets validate-state after text-input of dates
    */
    onInputChange(field, val) {
        const valMoment = moment(val, appConfig.planning.dateformat, true);

        if (valMoment.isValid()) {
            this.setState({
                invalid: false,
                viewValue: valMoment.format(appConfig.planning.dateformat),
                previousValidValue: valMoment,
            });
            this.onPopupChange(valMoment);
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
                    previousValidValue.format(appConfig.planning.dateformat) : '',
                invalid: false,
            });
        }
    }

    onPopupChange(newValue: moment.Moment) {
        const {value, onChange, field, remoteTimeZone} = this.props;
        const newMoment = remoteTimeZone ? moment.tz(newValue, remoteTimeZone) : moment(newValue);

        this.setState({
            invalid: false,
            viewValue: newMoment.format(appConfig.planning.dateformat),
            previousValidValue: newMoment,
        });

        if (newMoment.isValid() && (value == null || !newMoment.isSame(value))) {
            onChange(field, newMoment);
        }
    }

    render() {
        const {gettext} = superdeskApi.localization;
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
            inputTestId,
            ...props
        } = this.props;

        let {message, invalid} = this.props;
        let displayDateString;

        const eventTimeZoneString = value ? timeUtils.getDateInRemoteTimeZone(value, remoteTimeZone).format('z') : null;

        if (moment.isMoment(value) && isLocalTimeZoneDifferent) {
            const displayDate = timeUtils.getDateInRemoteTimeZone(value, timeUtils.localTimeZone());

            displayDateString = `(${displayDate.format('z')} ${displayDate.format(appConfig.planning.dateformat)})`;
        }

        if (!invalid && this.state.invalid) {
            invalid = true;
            message = gettext('Invalid Date');
        }

        return (
            <LineInput
                {...props}
                readOnly={readOnly}
                message={message}
                invalid={invalid}
                boxed={true}
            >
                <Label text={label} />
                {!inputAsLabel && (
                    <IconButton
                        className="sd-line-input__icon-right"
                        icon="icon-calendar"
                        onFocus={onFocus}
                        onClick={readOnly ? undefined : this.toggleOpenDatePicker}
                        aria-label={gettext('Date picker')}
                    />
                )}
                {inputAsLabel && value &&
                <div className="sd-line-input__date-as-label">{`${eventTimeZoneString} ${this.state.viewValue}`}</div>}
                {!inputAsLabel && (
                    <Input
                        field={field}
                        testId={inputTestId}
                        value={this.state.viewValue}
                        placeholder={placeholder || gettext('Date')}
                        onChange={this.onInputChange}
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
                    />
                )}
                {displayDateString && <span>{displayDateString}</span>}
                {this.state.openDatePicker && (
                    <DateInputPopup
                        value={value}
                        onChange={this.onPopupChange}
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
