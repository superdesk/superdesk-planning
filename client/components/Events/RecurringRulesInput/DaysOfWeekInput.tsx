import React from 'react';

import {superdeskApi} from '../../../superdeskApi';
import {Row, LineInput, Label, Checkbox} from '../../UI/Form';

interface IProps {
    field?: string; // defaults to 'dates.recurring_rule.byday'
    value: string;
    label: string; // defaults to 'Repeat On'
    required?: boolean;
    invalid?: boolean;
    message?: string;
    readOnly?: boolean;
    boxed?: boolean;
    noMargin?: boolean;
    onChange(field: string, value: string): void;
}

interface IState {
    MO: boolean;
    TU: boolean;
    WE: boolean;
    TH: boolean;
    FR: boolean;
    SA: boolean;
    SU: boolean;
}

export class DaysOfWeekInput extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);
        this.state = {
            MO: false,
            TU: false,
            WE: false,
            TH: false,
            FR: false,
            SA: false,
            SU: false,
        };
    }

    componentWillMount() {
        this.setDays(this.props);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.value !== this.props.value) {
            this.setDays(nextProps);
        }
    }

    setDays(props: IProps) {
        const days: IState = {
            MO: false,
            TU: false,
            WE: false,
            TH: false,
            FR: false,
            SA: false,
            SU: false,
        };

        const value = props.value || '';

        value.split(' ').forEach((day) => {
            if (Object.keys(days).indexOf(day) > -1) {
                days[day] = true;
            }
        });

        this.setState(days);
    }

    onChange(value: boolean, day: keyof IState) {
        const days: IState = {
            ...this.state,
            [day]: value,
        };

        let daysInString = Object.keys(days)
            // Keep only the checked days
            .map((d) => days[d] ? d : null)
            // Keep only defined values in array
            .filter((d) => d)
            // Join array to produce the string we want to store
            .join(' ');

        this.props.onChange(
            this.props.field ?? 'dates.recurring_rule.byday',
            daysInString
        );
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {
            label = gettext('Repeat On'),
            readOnly,
            invalid,
            message,
        } = this.props;

        return (
            <div>
                <Label
                    row={true}
                    text={label}
                    invalid={invalid}
                />
                <Row
                    flex={true}
                    noPadding={invalid}
                >
                    {Object.keys(this.state).map((day: keyof IState) => (
                        <LineInput
                            key={day}
                            noLabel={true}
                            noMargin={true}
                        >
                            <Checkbox
                                value={this.state[day]}
                                onChange={(f, val) => this.onChange(val, day)}
                                labelPosition="inside"
                                label={day}
                                readOnly={readOnly}
                            />
                        </LineInput>
                    ))}
                </Row>
                {!invalid ? null : (
                    <LineInput
                        noLabel={true}
                        invalid={invalid}
                        message={message}
                    />
                )}
            </div>
        );
    }
}
