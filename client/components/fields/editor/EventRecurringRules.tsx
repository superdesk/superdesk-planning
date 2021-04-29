import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../superdeskApi';
import {IEditorFieldProps, IEventItem} from '../../../interfaces';

import {EditorFieldToggle} from './base/toggle';
import {RecurringRulesInput} from '../../Events/RecurringRulesInput';

interface IProps extends IEditorFieldProps {
    onlyUpdateRepetitions?: boolean;
    popupContainer(): HTMLElement;
    onPopupOpen?(): void;
    onPopupClose?(): void;
}

export class EditorFieldEventRecurringRules extends React.PureComponent<IProps> {
    constructor(props) {
        super(props);

        this.onRecurringEnableChanged = this.onRecurringEnableChanged.bind(this);
    }

    onRecurringEnableChanged(field: string, value) {
        const fullField = (this.props.field ?? 'dates') + '.recurring_rule';

        if (!value) {
            this.props.onChange(fullField, null);
        } else {
            this.props.onChange(fullField, {
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
        const value = get(this.props.item, field, this.props.defaultValue) as Partial<IEventItem['dates']>;
        const errors = get(this.props.errors ?? {}, field);
        const eventRepeats = value?.recurring_rule != null;
        const recurring = {enabled: eventRepeats};

        return (
            <React.Fragment>
                <EditorFieldToggle
                    testId={`${this.props.testId}_toggle`}
                    item={recurring}
                    field="enabled"
                    label={gettext('Repeats')}
                    onChange={this.onRecurringEnableChanged}
                    defaultValue={false}
                />
                {!eventRepeats ? null : (
                    <RecurringRulesInput
                        {...this.props}
                        schedule={value}
                        errors={errors}
                        testId={`${this.props.testId}_rules`}
                    />
                )}
            </React.Fragment>
        );
    }
}
