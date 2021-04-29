import * as React from 'react';
import {get} from 'lodash';

import {IEditorFieldProps} from '../../../../interfaces';
import {Row} from '../../../UI/Form';
import {CheckButtonGroup as CheckGroup, CheckboxButton} from 'superdesk-ui-framework/react';

interface IProps extends IEditorFieldProps {
    options: Array<{
        label: string;
        value: string;
    }>;
}

export class EditorFieldCheckboxGroup extends React.PureComponent<IProps> {
    get field() {
        return this.props.field ?? 'days';
    }

    get values() {
        return get(this.props.item, this.field) || this.props.defaultValue;
    }

    onChange(value: string, enabled: boolean) {
        let newValues = Array.from(this.values);
        const currentlyEnabled = newValues.includes(value);
        let valueChanged = false;

        if (enabled && !currentlyEnabled) {
            newValues.push(value);
            valueChanged = true;
        } else if (!enabled && currentlyEnabled) {
            newValues = newValues.filter(
                (val) => val != value
            );
            valueChanged = true;
        }

        if (valueChanged) {
            this.props.onChange(this.field, newValues);
        }
    }

    isChecked(value: string) {
        return this.values.includes(value);
    }

    render() {
        return (
            <Row testId={this.props.testId}>
                <CheckGroup>
                    {this.props.options.map((option) => (
                        <CheckboxButton
                            key={option.value}
                            checked={this.isChecked(option.value)}
                            label={{text: option.label}}
                            onChange={(value) => this.onChange(option.value, value)}
                            disabled={this.props.disabled}
                        />
                    ))}
                </CheckGroup>
            </Row>
        );
    }
}
