import React from 'react';
import moment from 'moment-timezone';
import {get} from 'lodash';

import {SelectMetaTermsInput, Row} from './';

import './style.scss';

interface IProps {
    field: string;
    label?: string;
    value: string;
    readOnly?: boolean;
    onChange(field: string, value: string): void;
    noMargin?: boolean;
    invalid?: boolean;
    required?: boolean;
    halfWidth?: boolean;
    testId?: string;
    marginLeftAuto?: boolean;
    noPadding?: boolean;
}

interface IState {
    timeZones: Array<{
        qcode: string;
        name: string;
    }>
}

export class TimeZoneInput extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);

        this.state = {
            timeZones: moment.tz.names().map((t) => ({
                qcode: t,
                name: t,
            })),
        };

        this.onChange = this.onChange.bind(this);
    }

    onChange(field: string, value: IState['timeZones']) {
        if (value.length > 1) {
            this.props.onChange(
                field,
                get(value.find((v) => get(v, 'qcode') !== this.props.value), 'qcode')
            );
        } else {
            this.props.onChange(
                field,
                value?.[0]?.qcode
            );
        }
    }

    render() {
        const {
            field,
            label,
            value,
            invalid,
            required,
            halfWidth,
            testId,
            marginLeftAuto,
            noPadding,
            ...props
        } = this.props;

        return (
            <Row
                testId={testId}
                flex={true}
                halfWidth={halfWidth}
                noPadding={noPadding}
                className={{
                    'sd-margin-l--auto': marginLeftAuto,
                    'date-time-input__row': true,
                    'date-time-input__row--required': required,
                    'date-time-input__row--invalid': invalid,
                }}
            >

                <SelectMetaTermsInput
                    label={label}
                    {...props}
                    invalid={invalid}
                    required={required}
                    field={field}
                    options={this.state.timeZones}
                    onChange={this.onChange}
                    value={value ? [{
                        qcode: value,
                        name: value,
                    }] : []}
                />
            </Row>
        );
    }
}
