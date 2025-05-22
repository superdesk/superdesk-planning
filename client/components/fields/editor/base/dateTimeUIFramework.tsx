import * as React from 'react';

import {IEditorFieldProps} from '../../../../interfaces';
import {get} from 'lodash';
import {DateTimePicker} from 'superdesk-ui-framework/react';
import {appConfig} from 'appConfig';
import {format} from 'date-fns';

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

    onChange(field: string, value: Date) {
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
                    value={
                        value == undefined
                            ? null
                            : {
                                date: format(new Date(value), 'yyyy-MM-dd'),
                                time: format(new Date(value), 'HH:mm'),
                            }
                    }
                    required={this.props.schema?.required}
                    onChange={(value) => {
                        this.onChange(this.props.field, new Date(`${value.date} ${value.time}`));
                    }}
                />
            </div>
        );
    }
}
