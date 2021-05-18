import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {get} from 'lodash';
import {Row, DateInput, TimeInput, Field} from '..';
import './style.scss';
import Button from '../../Button';
import {gettext} from '../../utils';

/**
 * @ngdoc react
 * @name DateTimeInput
 * @description One Component packaging DatePicker and TimePicker to pick date and time
 */
export const DateTimeInput = ({
    field,
    timeField,
    label,
    value,
    onChange,
    required,
    invalid,
    readOnly,
    canClear,
    item,
    diff,
    errors,
    showErrors,
    popupContainer,
    onFocus,
    hideTime,
    halfWidth,
    onPopupOpen,
    onPopupClose,
    remoteTimeZone,
    allowInvalidTime,
    isLocalTimeZoneDifferent,
    refNode,
    showToBeConfirmed,
    onToBeConfirmed,
    toBeConfirmed,
    testId,
    ...props
}) => (
    <Row
        flex={true}
        halfWidth={halfWidth}
        noPadding={!!invalid}
        testId={testId}
        className={{
            'date-time-input__row': true,
            'date-time-input__row--required': required,
            'date-time-input__row--invalid': invalid,
        }}
    >
        <Field
            row={false}
            component={DateInput}
            field={`${field}.date`}
            value={value}
            item={item}
            diff={diff}
            readOnly={readOnly}
            onChange={onChange}
            errors={errors}
            showErrors={showErrors}
            noMargin={!invalid}
            label={label}
            required={required}
            popupContainer={popupContainer}
            onFocus={onFocus}
            onPopupOpen={onPopupOpen}
            onPopupClose={onPopupClose}
            remoteTimeZone={remoteTimeZone}
            isLocalTimeZoneDifferent={isLocalTimeZoneDifferent}
            refNode={refNode}
            halfWidth={!hideTime}
        />

        {!hideTime && (
            <Field
                row={false}
                component={TimeInput}
                field={timeField ? timeField : `${field}.time`}
                value={timeField ? get(diff, timeField) : value}
                item={item}
                diff={diff}
                readOnly={readOnly}
                onChange={onChange}
                errors={errors}
                showErrors={showErrors}
                noMargin={!invalid}
                popupContainer={popupContainer}
                onFocus={onFocus}
                onPopupOpen={onPopupOpen}
                onPopupClose={onPopupClose}
                remoteTimeZone={remoteTimeZone}
                canClear={canClear}
                allowInvalidText={allowInvalidTime}
                isLocalTimeZoneDifferent={isLocalTimeZoneDifferent}
                halfWidth={!hideTime}
                showToBeConfirmed={showToBeConfirmed}
                onToBeConfirmed={onToBeConfirmed}
                toBeConfirmed={toBeConfirmed}
            />
        )}
        {canClear && (
            <Button
                onClick={() => onChange(field, null)}
                icon="icon-close-small"
                size="small"
                iconOnly={true}
                title={gettext('Clear date and time')}
                className="btn--icon-only-circle"
            />
        )}
    </Row>
);

DateTimeInput.propTypes = {
    field: PropTypes.string.isRequired,
    label: PropTypes.string,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.instanceOf(moment),
    ]),
    onChange: PropTypes.func.isRequired,
    timeField: PropTypes.string,

    hint: PropTypes.string,
    required: PropTypes.bool,
    invalid: PropTypes.bool,
    readOnly: PropTypes.bool,
    boxed: PropTypes.bool,
    noMargin: PropTypes.bool,
    canClear: PropTypes.bool,

    item: PropTypes.object,
    diff: PropTypes.object,
    errors: PropTypes.object,
    showErrors: PropTypes.bool,
    popupContainer: PropTypes.func,
    onFocus: PropTypes.func,
    hideTime: PropTypes.bool,
    halfWidth: PropTypes.bool,
    onPopupOpen: PropTypes.func,
    onPopupClose: PropTypes.func,
    remoteTimeZone: PropTypes.string,
    allowInvalidTime: PropTypes.bool,
    isLocalTimeZoneDifferent: PropTypes.bool,
    refNode: PropTypes.func,
    showToBeConfirmed: PropTypes.bool,
    onToBeConfirmed: PropTypes.func,
    toBeConfirmed: PropTypes.bool,
    testId: PropTypes.string,
};

DateTimeInput.defaultProps = {
    required: false,
    invalid: false,
    readOnly: false,
    boxed: false,
    noMargin: false,
    canClear: false,
    showErrors: false,
};
