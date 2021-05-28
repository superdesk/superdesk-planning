import React from 'react';
import {get, range} from 'lodash';
import moment from 'moment';

import {IEventItem} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {Row, LineInput, Label, Select, DateInput, Input} from '../../UI/Form';
import {DaysOfWeekInput} from './DaysOfWeekInput';

interface IProps {
    schedule: Partial<IEventItem['dates']>;
    readOnly?: boolean;
    errors?: {[key: string]: any};
    onlyUpdateRepetitions?: boolean;
    testId?: string;
    onChange(field: string, value: any): void;
    popupContainer(): HTMLElement;
    onPopupOpen?(): void;
    onPopupClose?(): void;
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

    onEndRepeatModeChange(field, value) {
        this.props.onChange('dates.recurring_rule', {
            ...this.props.schedule.recurring_rule,
            count: null,
            until: null,
            endRepeatMode: value,
        });
    }

    onFrequencyChange(field, value) {
        const recurringRule = get(this.props, 'schedule.recurring_rule') || {};

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
            errors,
            popupContainer,
            onlyUpdateRepetitions,
            onPopupOpen,
            onPopupClose,
        } = this.props;

        const {
            frequency,
            endRepeatMode,
            until,
            count,
            byday,
            interval,
        } = this.props.schedule?.recurring_rule ?? {};

        return (
            <div
                className="recurring-rules"
                data-test-id={this.props.testId}
            >
                <Row noPadding>
                    <div className="flex-grid">
                        {onlyUpdateRepetitions ? null : (
                            <React.Fragment>
                                <Label row text={gettext('Every')} noMinWidth padding />
                                <LineInput
                                    {...this.props}
                                    isSelect={true}
                                    readOnly={readOnly}
                                    noMargin={true}
                                    className="form__row form__row--max-width-35"
                                >
                                    <Select
                                        field="dates.recurring_rule.interval"
                                        options={range(0, 30).map((n) => ({
                                            key: n + 1,
                                            label: (n + 1).toString(10),
                                        }))}
                                        onChange={this.onIntervalChange}
                                        value={interval}
                                        readOnly={readOnly}
                                    />
                                </LineInput>
                                <LineInput
                                    {...this.props}
                                    isSelect={true}
                                    readOnly={readOnly}
                                    noMargin={frequency === 'WEEKLY'}
                                    className="form__row form__row--max-width-80"
                                >
                                    <Select
                                        field="dates.recurring_rule.frequency"
                                        options={[...this.repeatChoices]}
                                        onChange={this.onFrequencyChange}
                                        value={frequency}
                                        readOnly={readOnly}
                                    />
                                </LineInput>
                            </React.Fragment>
                        )}
                        <Label
                            row={true}
                            text={gettext('ends')}
                            noMinWidth
                            padding
                            marginLeft={!onlyUpdateRepetitions}
                        />
                        <LineInput
                            {...this.props}
                            isSelect={true}
                            readOnly={readOnly}
                            noMargin={true}
                            className="form__row form__row--max-width-80"
                        >
                            <Select
                                field="dates.recurring_rule.endRepeatMode"
                                options={[...this.endsChoices]}
                                onChange={this.onEndRepeatModeChange}
                                value={endRepeatMode}
                                readOnly={readOnly}
                            />
                        </LineInput>
                        {endRepeatMode !== 'until' ? null : (
                            <DateInput
                                field="dates.recurring_rule.until"
                                placeholder=""
                                value={until != null ? moment(until) : null}
                                onChange={onChange}
                                readOnly={readOnly}
                                invalid={!!get(errors, 'until')}
                                message={get(errors, 'until', '')}
                                popupContainer={popupContainer}
                                noMargin={frequency === 'WEEKLY'}
                                onPopupOpen={onPopupOpen}
                                onPopupClose={onPopupClose}
                            />
                        )}
                        {endRepeatMode !== 'count' ? null : (
                            <div className="form__row form__row--flex">
                                <LineInput
                                    {...this.props}
                                    readOnly={readOnly}
                                    noMargin={true}
                                    invalid={!!get(errors, 'count')}
                                    message={get(errors, 'count', '')}
                                >
                                    <Input
                                        field="dates.recurring_rule.count"
                                        value={count || ''}
                                        onChange={onChange}
                                        type="number"
                                        readOnly={readOnly}
                                    />
                                </LineInput>
                                <Label row={true} text={gettext('Repeats')} noMinWidth />
                            </div>
                        )}
                    </div>
                    {frequency === 'WEEKLY' && (
                        <Row>
                            <DaysOfWeekInput
                                value={byday}
                                onChange={onChange}
                                readOnly={readOnly}
                                invalid={!!get(errors, 'byday', false)}
                                message={get(errors, 'byday', '')}
                                label={gettext('On Days')}
                            />
                        </Row>
                    )}
                </Row>
            </div>
        );
    }
}
