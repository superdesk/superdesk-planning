import React from 'react';
import {get, range} from 'lodash';
import moment from 'moment';

import {IEventItem} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {DaysOfWeekInput} from './DaysOfWeekInput';
import {Spacer, Select, Option, DatePicker, Input} from 'superdesk-ui-framework/react';
import {appConfig} from 'appConfig';

interface IProps {
    recurring_rule: NonNullable<IEventItem['dates']>['recurring_rule'];
    readOnly?: boolean;
    errors?: {[key: string]: any};
    onlyUpdateRepetitions?: boolean;
    testId?: string;
    onChange(field: string, value: any): void;
}

export class RecurringRulesInput extends React.PureComponent<IProps> {
    repeatChoices: Array<{label: string, key: string}>;
    endsChoices: Array<{label: string, key: string}>;

    constructor(props) {
        super(props);
        const {gettext} = superdeskApi.localization;

        this.repeatChoices = [
            {label: gettext('Day(s)'), key: 'DAILY'},
            {label: gettext('Week(s)'), key: 'WEEKLY'},
            {label: gettext('Month(s)'), key: 'MONTHLY'},
            {label: gettext('Year(s)'), key: 'YEARLY'},
        ];

        this.endsChoices = [
            {label: gettext('On'), key: 'until'},
            {label: gettext('After'), key: 'count'},
        ];

        this.onIntervalChange = this.onIntervalChange.bind(this);
        this.onEndRepeatModeChange = this.onEndRepeatModeChange.bind(this);
        this.onFrequencyChange = this.onFrequencyChange.bind(this);
    }

    onIntervalChange(field, value) {
        this.props.onChange(field, parseInt(value, 10));
    }

    onEndRepeatModeChange(value) {
        this.props.onChange('dates.recurring_rule', {
            ...this.props.recurring_rule,
            count: null,
            until: null,
            endRepeatMode: value,
        });
    }

    onFrequencyChange(value) {
        const recurringRule = this.props.recurring_rule ?? {};

        this.props.onChange('dates.recurring_rule', {
            ...recurringRule,
            frequency: value,
            byday: value === 'WEEKLY' ? recurringRule.byday : null,
        });
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {
            onChange,
            readOnly,
            errors = {},
            onlyUpdateRepetitions,
        } = this.props;

        const {
            frequency,
            endRepeatMode,
            until,
            count,
            byday,
            interval,
        } = this.props.recurring_rule ?? {};

        return (
            <div
                style={{paddingBlockEnd: '2rem', display: 'flex', flexDirection: 'column', gap: 8}}
                data-test-id={this.props.testId}
            >
                <Spacer h gap="32" justifyContent="center" alignItems="start">
                    {onlyUpdateRepetitions ? null : (
                        <Spacer h gap="4">
                            <Select
                                disabled={readOnly}
                                value={interval?.toString()}
                                onChange={(newValue) => {
                                    this.onIntervalChange('dates.recurring_rule.interval', parseInt(newValue, 10));
                                }}
                                label={superdeskApi.localization.gettext('Every')}
                                error={errors.interval}
                                invalid={!!errors.interval}
                            >
                                {range(0, 30).map((n) => ({
                                    key: n + 1,
                                    label: (n + 1).toString(10),
                                }))
                                    .map((x) => (
                                        <Option key={x.key} value={`${x.key}`}>{x.label}</Option>
                                    ))}
                            </Select>
                            <Select
                                onChange={(value) => {
                                    this.onFrequencyChange(value);
                                }}
                                value={frequency}
                                disabled={readOnly}
                                error={errors.frequency}
                                invalid={!!errors.frequency}
                            >
                                {this.repeatChoices.map((x) => (
                                    <Option key={x.key} value={x.key}>{x.label}</Option>
                                ))}
                            </Select>
                        </Spacer>
                    )}
                    <Spacer h gap="4" justifyContent="center" alignItems="start">
                        <Select
                            onChange={this.onEndRepeatModeChange}
                            value={endRepeatMode}
                            disabled={readOnly}
                            label={superdeskApi.localization.gettext('Ends')}
                            error={errors.endRepeatMode}
                            invalid={!!errors.endRepeatMode}
                            data-test-id="dates.recurring_rule.endRepeatMode"
                        >
                            {this.endsChoices.map((x) => (<Option key={x.key} value={x.key}>{x.label}</Option>))}
                        </Select>
                        {endRepeatMode === 'until' ? (
                            <DatePicker
                                value={until != null ? new Date(until) : null}
                                onChange={(next) => {
                                    onChange('dates.recurring_rule.until', moment(next));
                                }}
                                dateFormat={appConfig.view.dateformat}
                                disabled={readOnly}
                                invalid={!!errors.until}
                                error={errors.until}
                                data-test-id="dates.recurring_rule.until"
                            />
                        ) : (
                            <Input
                                value={count}
                                onChange={(nextValue) => {
                                    onChange('dates.recurring_rule.count', nextValue);
                                }}
                                type="number"
                                disabled={readOnly}
                                label={superdeskApi.localization.gettext('Repeats')}
                                error={errors.count}
                                data-test-id="dates.recurring_rule.count"
                            />
                        )}
                    </Spacer>
                </Spacer>
                {frequency === 'WEEKLY' && (
                    <DaysOfWeekInput
                        noMargin
                        value={byday}
                        onChange={onChange}
                        readOnly={readOnly}
                        invalid={!!get(errors, 'byday', false)}
                        message={get(errors, 'byday', '')}
                        label={gettext('On Days')}
                    />
                )}
            </div>
        );
    }
}
