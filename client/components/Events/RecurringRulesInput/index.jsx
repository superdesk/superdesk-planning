import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {Row} from '../../UI/Form';
import {RepeatEventSummary} from '..';

import {RepeatsInput} from './RepeatsInput';
import {RepeatsEveryInput} from './RepeatsEveryInput';
import {DaysOfWeekInput} from './DaysOfWeekInput';
import {EndsInput} from './EndsInput';

export const RecurringRulesInput = ({showRepeatSummary, schedule, onChange, dateFormat, readOnly, error}) => {
    const frequency = get(schedule, 'dates.recurring_rule.frequency');
    const endRepeatMode = get(schedule, 'dates.recurring_rule.endRepeatMode');
    const until = get(schedule, 'dates.recurring_rule.until');
    const count = get(schedule, 'dates.recurring_rule.count');
    const byDay = get(schedule, 'dates.recurring_rule.byday');
    const startDate = get(schedule, 'dates.start');
    const interval = get(schedule, 'dates.recurring_rule.interval');

    return (
        <div>
            <Row flex={true}>
                <RepeatsInput
                    value={frequency}
                    onChange={onChange}
                    noMargin={true}
                    readOnly={readOnly}
                />

                <RepeatsEveryInput
                    frequency={frequency}
                    value={interval}
                    onChange={onChange}
                    noMargin={true}
                    readOnly={readOnly}
                />
            </Row>

            {frequency === 'WEEKLY' && (
                <DaysOfWeekInput
                    value={byDay}
                    onChange={onChange}
                    readOnly={readOnly}
                    invalid={get(error, 'byday', false)}
                    message={get(error, 'byday', '')}
                />
            )}

            <EndsInput
                count={count}
                until={until}
                endRepeatMode={endRepeatMode}
                onChange={onChange}
                dateFormat={dateFormat}
                readOnly={readOnly}
                error={error}
            />

            {showRepeatSummary && (
                <Row>
                    <RepeatEventSummary
                        byDay={byDay}
                        interval={interval}
                        frequency={frequency}
                        endRepeatMode={endRepeatMode}
                        until={until}
                        count={count}
                        startDate={startDate}
                    />
                </Row>
            )}
        </div>
    );
};

RecurringRulesInput.propTypes = {
    onChange: PropTypes.func.isRequired,
    schedule: PropTypes.object.isRequired,
    showRepeatSummary: PropTypes.bool,
    dateFormat: PropTypes.string.isRequired,
    readOnly: PropTypes.bool,
    error: PropTypes.object,
};

RecurringRulesInput.defaultProps = {
    showRepeatSummary: true,
    readOnly: false,
};
