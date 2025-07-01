import React from 'react';
import moment from 'moment-timezone';

import {IEventItem, IEventFormProfile} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {Row, LineInput, ToggleInput, Field} from '../../UI/Form';
import {RecurringRulesInput} from '../RecurringRulesInput';
import {EditorFieldEventSchedule} from '../../fields/editor/EventSchedule';

interface IProps {
    item: IEventItem;
    diff: Partial<IEventItem>;
    readOnly: boolean;
    errors?: {[key: string]: any};
    showErrors?: boolean;
    formProfile: IEventFormProfile;
    showRepeat?: boolean; // defaults to true
    showRepeatToggle?: boolean; // defaults to true
    showFirstEventLabel?: boolean; // defaults to true
    showTimeZone?: boolean;

    onChange(field: string | {[key: string]: any}, value: any): void;
    popupContainer(): HTMLElement;
    onPopupOpen?(): void;
    onPopupClose?(): void;
    refNode?(node: HTMLElement): void;
}

export class EventScheduleInput extends React.Component<IProps> {
    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);
        this.handleDoesRepeatChange = this.handleDoesRepeatChange.bind(this);
    }

    onChange(field, value) {
        if (field === 'dates.recurring_rule.count' && !value) {
            // Count is an integer. So set it to null, not to ''
            this.props.onChange(field, null);
        } else if (field === 'dates.recurring_rule.until' && moment.isMoment(value)) {
            this.props.onChange(field, value.endOf('day'));
        } else {
            this.props.onChange(field, value);
        }
    }

    handleDoesRepeatChange(field, value) {
        if (!value) {
            // If unchecked, remove the recurring rules
            this.onChange(
                'dates.recurring_rule',
                null
            );
        } else {
            // If checked, set default recurring rule
            this.onChange(
                'dates.recurring_rule',
                {
                    frequency: 'DAILY',
                    interval: 1,
                    endRepeatMode: 'until',
                    until: null,
                }
            );
        }
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {
            item,
            diff,
            showRepeat = true,
            showRepeatToggle = true,
            readOnly,
            errors,
            showErrors,
        } = this.props;

        const doesRepeat = diff?.dates?.recurring_rule != null;

        const toggleProps = {
            row: false,
            component: ToggleInput,
            readOnly: readOnly,
            className: 'sd-line-input__input',
            labelLeftAuto: true,
            defaultValue: false,
        };

        return (
            <div>
                <Row flex={true}>
                    <Field
                        enabled={showRepeat && showRepeatToggle}
                        onChange={this.handleDoesRepeatChange}
                        field="dates.recurring"
                        label={gettext('Repeats')}
                        value={doesRepeat}
                        {...toggleProps}
                    />
                </Row>

                {showRepeat && doesRepeat && (
                    <RecurringRulesInput
                        onChange={this.onChange}
                        recurring_rule={diff.dates.recurring_rule || {}}
                        readOnly={readOnly}
                        errors={errors?.dates?.recurring_rule}
                    />
                )}

                <EditorFieldEventSchedule
                    item={item}
                    field="dates"
                    onChange={this.onChange}
                    errors={errors}
                    showErrors={showErrors}
                    showTimeZone={true}
                />

                <Row
                    enabled={errors?.dates?.range != null}
                    noPadding={true}
                >
                    <LineInput
                        invalid={true}
                        message={errors?.dates?.range}
                        readOnly={true}
                    />
                </Row>
            </div>
        );
    }
}
