import React from 'react';
import PropTypes from 'prop-types';
import {Field} from 'redux-form';
import {fields, RepeatEventSummary} from '../components';
import {connect} from 'react-redux';
import classNames from 'classnames';
import {get} from 'lodash';

class RepeatEventFormComponent extends React.Component {
    getSchedule(props = null) {
        const schedule = props === null ? this.props.schedule : props.schedule;

        return {
            frequency: get(schedule, 'recurring_rule.frequency'),
            endRepeatMode: get(schedule, 'recurring_rule.endRepeatMode'),
            until: get(schedule, 'recurring_rule.until'),
            count: get(schedule, 'recurring_rule.count'),
            byDay: get(schedule, 'recurring_rule.byday'),
            start: get(schedule, 'start'),
            interval: get(schedule, 'recurring_rule.interval'),
        };
    }

    componentWillMount() {
        const {endRepeatMode, frequency, interval, start} = this.getSchedule();

        const intervals = interval || 1;
        const startDate = start || null;

        if (endRepeatMode) {
            this.setState({
                endRepeatMode: endRepeatMode,
                interval: intervals,
                frequency: frequency,
                date: startDate,
            });
        } else {
            // if endRepeatMode not present set the default value for it
            this.setState({
                endRepeatMode: 'count',
                interval: intervals,
                frequency: frequency,
                date: startDate,
            });
            this.props.change('dates.recurring_rule.endRepeatMode', 'count');
        }
    }

    componentWillReceiveProps(nextProps) {
        const {endRepeatMode, until, count, frequency, start, interval} = this.getSchedule(nextProps);
        const schedule = this.getSchedule();

        if ((until && count) || (count && endRepeatMode !== 'count')) {
            // If count and until both are set, count takes precendence - else an infinite loop!
            // force the selection of 'count' for endRepeatMode
            // covers the case when the user set a value for count integer field
            // but don't select the 'until'related radio
            this.setState({endRepeatMode: 'count'});
            this.props.change('dates.recurring_rule.endRepeatMode', 'count');
            return;
        }

        if (until && endRepeatMode !== 'until') {
            // force the selection of 'until' for endRepeatMode
            // covers the case when the user set a value for until date field
            // but don't select the 'until'related radio
            this.setState({endRepeatMode: 'until'});
            this.props.change('dates.recurring_rule.endRepeatMode', 'until');
            return;
        }

        if (endRepeatMode && endRepeatMode !== this.state.endRepeatMode) {
            this.setState({endRepeatMode});
            return;
        }

        if (frequency !== schedule.frequency) {
            this.setState({frequency});
            return;
        }

        if (start !== schedule.start) {
            this.setState({date: start});
            return;
        }

        if (interval !== schedule.interval) {
            this.setState({interval});
        }
    }

    handleEndRepeatModeChange(e) {
        if (this.state.endRepeatMode !== e.target.value) {
            const choicesWithInput = ['count', 'until'];

            // we clear inputs that belong to radiobox
            choicesWithInput.forEach((fieldName) =>
                this.props.change('dates.recurring_rule.' + fieldName, null)
            );

            // if the clicked radiobox belongs to an input field
            if (choicesWithInput.indexOf(e.target.value) > -1) {
                // focus the field
                this.refs['recurring_rule--' + e.target.value].getRenderedComponent().focus();
            }

            this.props.change('dates.recurring_rule.endRepeatMode', e.target.value);
            this.setState({endRepeatMode: e.target.value});
        }
    }

    render() {
        const {readOnly, showRepeatSummary} = this.props;
        const readOnlyClasses = classNames(
            {disabledInput: readOnly}
        );

        const readOnlyAttr = readOnly ? 'disabled' : '';

        const {frequency, byDay, until, count, start} = this.getSchedule();

        return (
            <div>
                <div className="form__row form__row--flex">
                    <Field
                        name="dates.recurring_rule.frequency"
                        component={fields.RepeatsField}
                        disabled={readOnly}
                        label="Repeats"
                    />

                    <Field
                        name="dates.recurring_rule.interval"
                        component={fields.RepeatEveryField}
                        disabled={readOnly}
                        label="Repeat Every"
                        frequency={frequency}
                    />

                </div>
                { frequency === 'WEEKLY' &&
                    <Field
                        name="dates.recurring_rule.byday"
                        component={fields.DaysOfWeek}
                        label="Repeat On"
                        readOnly={readOnly}/>
                }

                <div className="form__row">
                    <div className="sd-line-input sd-line-input--no-margin sd-line-input--required">
                        <label className="sd-line-input__label">Ends</label>
                    </div>
                </div>

                <div className="recurring__ends form__row form__row--flex">
                    <div className="sd-line-input sd-line-input--label-left sd-line-input--no-margin">
                        <div>
                            <input
                                name="endRepeatMode"
                                checked={this.state.endRepeatMode === 'count'}
                                className={readOnlyClasses}
                                disabled={readOnlyAttr}
                                onChange={this.handleEndRepeatModeChange.bind(this)}
                                value="count"
                                type="radio"/>
                            <span htmlFor="dates.recurring_rule.until" className="sd-line-input__label">
                                After
                            </span>
                        </div>
                    </div>
                    <div className="sd-line-input sd-line-input--label-left sd-line-input--no-margin">
                        <div>
                            <Field name="dates.recurring_rule.count"
                                withRef={true}
                                ref="recurring_rule--count"
                                component={fields.InputIntegerField}
                                type="number"
                                labelLeft={false}
                                readOnly={readOnly} />

                            <span className="sd-line-input__label">
                                Occurrences
                            </span>
                        </div>
                    </div>
                    <div className="sd-line-input sd-line-input--label-left sd-line-input--no-margin">
                        <div>
                            <input
                                name="endRepeatMode"
                                className={readOnlyClasses}
                                disabled={readOnlyAttr}
                                checked={this.state.endRepeatMode === 'until'}
                                onChange={this.handleEndRepeatModeChange.bind(this)}
                                value="until"
                                type="radio"/>
                            <span className="sd-line-input__label">
                                On
                            </span>
                        </div>
                    </div>
                    <div className="sd-line-input sd-line-input--no-margin">
                        <Field name="dates.recurring_rule.until"
                            withRef={true}
                            ref="recurring_rule--until"
                            component={fields.DayPickerInput}
                            readOnly={readOnly} />
                    </div>
                </div>

                {showRepeatSummary && <RepeatEventSummary byDay={byDay}
                    interval={this.state.interval}
                    frequency={frequency}
                    endRepeatMode={this.state.endRepeatMode}
                    until={until}
                    count={count}
                    startDate={start} />}
            </div>
        );
    }
}

RepeatEventFormComponent.propTypes = {
    change: PropTypes.func.isRequired,
    readOnly: PropTypes.bool,
    schedule: PropTypes.object.isRequired,
    showRepeatSummary: PropTypes.bool,
};

RepeatEventFormComponent.defaultProps = {showRepeatSummary: true};

export const RepeatEventForm = connect(null)(RepeatEventFormComponent);
