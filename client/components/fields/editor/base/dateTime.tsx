import * as React from 'react';
import moment from 'moment';

import {IEditorFieldProps} from '../../../../interfaces';
import {DateTimeInput} from '../../../UI/Form';
import {get} from 'lodash';

interface IProps extends IEditorFieldProps {
    canClear?: boolean;
    showToBeConfirmed?: boolean;
    toBeConfirmed?: boolean;
    isLocalTimeZoneDifferent?: boolean;
    remoteTimeZone?: string;
    singleValue?: boolean;
    onToBeConfirmed?(field: string): void;
    allDay?: boolean;
    hideTime?: boolean;
}


/**
 * @deprecated use EditorFieldDateTimeUIFramework from client/components/fields/editor/base/dateTimeUIFramework.tsx
 */
export class EditorFieldDateTime extends React.PureComponent<IProps> {
    node: HTMLInputElement;

    constructor(props: IProps) {
        super(props);

        this.onChange = this.onChange.bind(this);
    }

    focus() {
        if (this.node != null) {
            this.node.focus();
        }
    }

    onChange(field: string, value: moment.Moment) {
        // `field` is appended with `.date` or `.time` depending on what changed
        // Not all usages of this component requires this, so use `this.props.field` instead
        if (this.props.singleValue === true) {
            this.props.onChange(this.props.field, value);
        } else {
            this.props.onChange(field, value);
        }
    }

    render() {
        const field = this.props.field;
        const value = get(this.props.item, field, this.props.defaultValue);
        const error = get(this.props.errors ?? {}, field);

        let momentValue : moment.Moment;

        if (value != null) {
            if (this.props.allDay) {
                /**
                 * For all-day events, we shift the UTC value by +12 hours to ensure the date displays
                 * correctly across different time zones.
                 *
                 * Without this adjustment, users in negative time zones (e.g., UTC-4) may see the date
                 * appear as the *previous* day due to local time rendering of midnight UTC.
                 *
                 * This is a visual-only adjustment and does not affect the actual value saved,
                 * which remains in UTC.
                 */
                momentValue = moment.utc(value).add(12, 'hours');
            } else {
                momentValue = moment(value);
            }
        } else {
            momentValue = undefined;
        }

        return (
            <DateTimeInput
                {...this.props}
                diff={this.props.item}
                field={field}
                value={momentValue}
                message={error}
                invalid={error?.length > 0 && this.props.invalid}
                testId={this.props.testId}
                readOnly={this.props.disabled}
                required={this.props.schema?.required}
                onChange={this.onChange}
                refNode={(node) => {
                    this.node = node;
                }}
                allDay={this.props.allDay}
            />
        );
    }
}
