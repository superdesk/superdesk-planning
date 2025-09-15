import * as React from 'react';

import {IEditorFieldProps} from '../../../../interfaces';
import {get} from 'lodash';
import {DateTimePicker} from 'superdesk-ui-framework/react';
import {appConfig} from 'appConfig';
import {format} from 'date-fns';
import {superdeskApi} from '../../../../superdeskApi';

const DATE_ONLY_LENGTH = 10;

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

export class EditorFieldDateTimeUIFramework extends React.PureComponent<IProps> {
    node: any;

    constructor(props: IProps) {
        super(props);

        this.onChange = this.onChange.bind(this);
    }

    onChange(field: string, value: string) {
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
        const value = get(this.props.item, field, this.props.defaultValue); // ISO string usually
        const error = get(this.props.errors ?? {}, field);

        return (
            <div style={{paddingBlockEnd: 20}}>
                <DateTimePicker
                    valueType="object"
                    label={this.props.label}
                    ref={(el) => {
                        this.node = el;
                    }}
                    labelHidden={false}
                    data-test-id={this.props.testId}
                    readonly={this.props.disabled}
                    invalid={(error?.length ?? 0) > 0}
                    error={error}
                    disabled={this.props.disabled}
                    dateFormat={appConfig.planning.dateformat}
                    locale={{
                        type: 'full',
                        payload: superdeskApi.ui.framework.getLocaleForDatePicker(this.props.language),
                    }}
                    value={
                        value != null
                            ? {
                                date: format(new Date(value), 'yyyy-MM-dd'),
                                // if true, that means value is a date-only ISO string without time part
                                time: value.length === DATE_ONLY_LENGTH
                                    ? undefined
                                    : format(new Date(value), 'HH:mm'),
                            }
                            : {}
                    }
                    required={this.props.schema?.required}
                    timeRequiresDate
                    onChange={(value) => {
                        const dateTimeString = value.time != null
                            ? new Date(`${value.date} ${value.time}`).toISOString()
                            : value.date ?? null;

                        this.onChange(this.props.field, dateTimeString);
                    }}
                />
            </div>
        );
    }
}
