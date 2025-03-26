import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../superdeskApi';
import {IEventItem} from '../../../interfaces';

import {EditorFieldToggle} from './base/toggle';
import {RecurringRulesInput} from '../../Events/RecurringRulesInput';
import {IEditorFieldEventRecurringRulesProps} from './EventRecurringRules.interface';

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

        return (
            <>
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
                {!eventRepeats ? null : (
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
