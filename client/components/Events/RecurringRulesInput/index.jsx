import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {Row} from '../../UI/Form';
import {RepeatEventSummary} from '..';

import {RepeatsInput} from './RepeatsInput';
import {RepeatsEveryInput} from './RepeatsEveryInput';
import {DaysOfWeekInput} from './DaysOfWeekInput';
import {EndsInput} from './EndsInput';

import {gettext} from '../../../utils';

export const RecurringRulesInput = ({
    showRepeatSummary,
    schedule,
    onChange,
    dateFormat,
    readOnly,
    errors,
    popupContainer,
}) => {
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
                    label={gettext('Repeats')}
                />

                <RepeatsEveryInput
                    frequency={frequency}
                    value={interval}
                    onChange={onChange}
                    noMargin={true}
                    readOnly={readOnly}
                    label={gettext('Repeat Every')}
                />
            </Row>

            {frequency === 'WEEKLY' && (
                <DaysOfWeekInput
                    value={byDay}
                    onChange={onChange}
                    readOnly={readOnly}
                    invalid={!!get(errors, 'byday', false)}
                    message={get(errors, 'byday', '')}
                    label={gettext('Repeat On')}
                />
            )}

            <EndsInput
                count={count}
                until={until}
                endRepeatMode={endRepeatMode}
                onChange={onChange}
                dateFormat={dateFormat}
                readOnly={readOnly}
                errors={errors}
                label={gettext('Ends')}
                popupContainer={popupContainer}
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
    errors: PropTypes.object,
    popupContainer: PropTypes.func,
};

RecurringRulesInput.defaultProps = {
    showRepeatSummary: true,
    readOnly: false,
};
