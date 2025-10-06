import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../superdeskApi';
import {IEventItem} from '../../../interfaces';

import {EditorFieldToggle} from './base/toggle';
import {RecurringRulesInput} from '../../Events/RecurringRulesInput';
import {IEditorFieldEventRecurringRulesProps} from './EventRecurringRules.interface';
import {Row} from '../../../components/UI/Form';
import {RepeatEventSummary} from '../../../components/Events';
import {isExistingItem} from '../../../utils';

export class EditorFieldEventRecurringRules extends React.PureComponent<IEditorFieldEventRecurringRulesProps> {
    constructor(props) {
        super(props);

        this.onRecurringEnableChanged = this.onRecurringEnableChanged.bind(this);
    }

    onRecurringEnableChanged(value) {
        if (!value) {
            this.props.onChange(this.props.field, null);
        } else {
            this.props.onChange(this.props.field, {
                frequency: 'DAILY',
                interval: 1,
                endRepeatMode: 'until',
                until: null,
            });
        }
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'dates';
        const value = get(
            this.props.item,
            field,
            this.props.defaultValue,
        ) as NonNullable<IEventItem['dates']>['recurring_rule'];
        const errors = get(this.props.errors ?? {}, field);
        const eventRepeats = Object.keys(value ?? {}).length > 0;
        const recurring = {enabled: eventRepeats};

        const originalRecurringRule = get(this.props.originalItem, field);
        const originalRuleExists = originalRecurringRule != null
            && Object.keys(originalRecurringRule).length > 0;
        const isItemSaved = isExistingItem(this.props.item);
        const showSummary = eventRepeats && isItemSaved && originalRuleExists;
        const showInput = eventRepeats && (!isItemSaved || !originalRuleExists);

        return (
            <>
                {!showSummary && (
                    <EditorFieldToggle
                        testId={`${this.props.testId}_toggle`}
                        item={recurring}
                        field="enabled"
                        label={gettext('Repeats')}
                        onChange={(_field, value) => {
                            this.onRecurringEnableChanged(value);
                        }}
                        defaultValue={false}
                    />
                )}
                {showSummary && (
                    <Row noPadding={true}>
                        <RepeatEventSummary
                            schedule={this.props.item.dates ?? {}}
                            noMargin={false}
                        />
                    </Row>
                )}
                {showInput && (
                    <RecurringRulesInput
                        {...this.props}
                        recurring_rule={value}
                        errors={errors}
                        testId={`${this.props.testId}_rules`}
                    />
                )}
            </>
        );
    }
}
