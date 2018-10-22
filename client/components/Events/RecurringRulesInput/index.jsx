import React from 'react';
import PropTypes from 'prop-types';
import {get, range} from 'lodash';

import {Row, LineInput, Label, Select, DateInput, Input} from '../../UI/Form';
import {DaysOfWeekInput} from './DaysOfWeekInput';

import {gettext} from '../../../utils';

export class RecurringRulesInput extends React.Component {
    constructor(props) {
        super(props);

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

    render() {
        const {
            schedule,
            onChange,
            dateFormat,
            readOnly,
            errors,
            popupContainer,
            onlyUpdateRepetitions,
            onPopupOpen,
            onPopupClose,
        } = this.props;

        const frequency = get(schedule, 'recurring_rule.frequency');
        const endRepeatMode = get(schedule, 'recurring_rule.endRepeatMode');
        const until = get(schedule, 'recurring_rule.until');
        const count = get(schedule, 'recurring_rule.count');
        const byDay = get(schedule, 'recurring_rule.byday');
        const interval = get(schedule, 'recurring_rule.interval');

        return (
            <div>
                <Row noPadding>
                    <div className="flex-grid">
                        {!onlyUpdateRepetitions && <Label row text={gettext('Every')} noMinWidth padding/>}
                        {!onlyUpdateRepetitions && <LineInput {...this.props} isSelect={true} readOnly={readOnly}
                            noMargin={frequency === 'WEEKLY'}
                            className="form__row form__row--max-width-35">
                            <Select
                                field="dates.recurring_rule.interval"
                                options={range(0, 30).map((n) => ({key: n + 1, label: n + 1}))}
                                onChange={this.onIntervalChange}
                                value={interval}
                                readOnly={readOnly}
                            />
                        </LineInput>}

                        {!onlyUpdateRepetitions && <LineInput {...this.props} isSelect={true} readOnly={readOnly}
                            noMargin={frequency === 'WEEKLY'}
                            className="form__row form__row--max-width-80">
                            <Select
                                field="dates.recurring_rule.frequency"
                                options={[...this.repeatChoices]}
                                onChange={onChange}
                                value={frequency}
                                readOnly={readOnly}
                            />
                        </LineInput>}
                        <Label
                            row={true}
                            text={gettext('ends')}
                            noMinWidth
                            padding
                            marginLeft={!onlyUpdateRepetitions} />
                        <LineInput {...this.props} isSelect={true} readOnly={readOnly}
                            noMargin={frequency === 'WEEKLY'}
                            className="form__row form__row--max-width-80">
                            <Select
                                field="dates.recurring_rule.endRepeatMode"
                                options={[...this.endsChoices]}
                                onChange={this.onEndRepeatModeChange}
                                value={endRepeatMode}
                                readOnly={readOnly}
                            />
                        </LineInput>
                        {endRepeatMode === 'until' &&
                            <DateInput
                                field="dates.recurring_rule.until"
                                placeholder=""
                                value={until}
                                onChange={onChange}
                                dateFormat={dateFormat}
                                readOnly={readOnly}
                                invalid={!!get(errors, 'until')}
                                message={get(errors, 'until', '')}
                                popupContainer={popupContainer}
                                noMargin={frequency === 'WEEKLY'}
                                onPopupOpen={onPopupOpen}
                                onPopupClose={onPopupClose}
                            />}
                        {endRepeatMode === 'count' &&
                            <div className="form__row form__row--flex">
                                <LineInput {...this.props} readOnly={readOnly}
                                    noMargin={frequency === 'WEEKLY'}
                                    invalid={!!get(errors, 'count')}
                                    message={get(errors, 'count', '')} >
                                    <Input
                                        field="dates.recurring_rule.count"
                                        value={count || ''}
                                        onChange={onChange}
                                        type="number"
                                        readOnly={readOnly} />
                                </LineInput>
                                <Label row={true} text={gettext('Repeats')} noMinWidth />
                            </div>}
                    </div>
                    {frequency === 'WEEKLY' && (
                        <Row>
                            <DaysOfWeekInput
                                value={byDay}
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

RecurringRulesInput.propTypes = {
    onChange: PropTypes.func.isRequired,
    schedule: PropTypes.object.isRequired,
    dateFormat: PropTypes.string.isRequired,
    readOnly: PropTypes.bool,
    errors: PropTypes.object,
    popupContainer: PropTypes.func,
    hideFrequency: PropTypes.bool,
    onlyUpdateRepetitions: PropTypes.bool,
};

RecurringRulesInput.defaultProps = {readOnly: false};
