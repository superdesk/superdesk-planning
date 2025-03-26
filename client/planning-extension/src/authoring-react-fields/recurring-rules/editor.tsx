import * as React from 'react';
import {IEditorComponentProps} from 'superdesk-api';
import {
    IRecurringRulesFieldConfig,
    IRecurringRulesFieldUserPreferences,
    IRecurringRulesValueOperational,
} from './interfaces';
import {extensionBridge} from '../../extension_bridge';
import {cloneDeep, set} from 'lodash';

type IProps = IEditorComponentProps<
    IRecurringRulesValueOperational,
    IRecurringRulesFieldConfig,
    IRecurringRulesFieldUserPreferences
>;

export class Editor extends React.PureComponent<IProps> {
    render() {
        const Container = this.props.container;
        const {EditorFieldEventRecurringRules} = extensionBridge.editor.fields;

        return (
            <Container>
                <EditorFieldEventRecurringRules
                    onChange={(fieldPath, value) => {
                        const valueCopy = {dates: {recurring_rule: cloneDeep(this.props.value)}};

                        set(valueCopy, fieldPath, value);

                        this.props.onChange(valueCopy.dates.recurring_rule);
                    }}
                    field="dates.recurring_rule"
                    item={{
                        ...this.props.item,
                        dates: {
                            ...this.props.item.dates,
                            recurring_rule: this.props.value,
                        }
                    }}
                />
            </Container>
        );
    }
}
