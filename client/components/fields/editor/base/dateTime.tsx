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
                const dateStr = moment(value).format('YYYY-MM-DD');
                const tz = this.props.remoteTimeZone || moment.tz.guess();

                momentValue = moment.tz(dateStr, tz);
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
