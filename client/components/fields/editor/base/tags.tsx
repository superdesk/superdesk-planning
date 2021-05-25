import * as React from 'react';
import {get} from 'lodash';

import {IEditorFieldProps} from '../../../../interfaces';
import {SelectTagInput, Row} from '../../../UI/Form';

interface IProps extends IEditorFieldProps {
    options: Array<{[key: string]: any}>;
    labelKey?: string; // defaults to 'name'
    valueKey?: string; // defaults to 'qcode'
    searchKey?: string; // defaults to 'name'
    allowCustom?: boolean;
    readOnly?: boolean;
    invalid?: boolean;
    required?: boolean;
    onChange(field: string, value: Array<string>): void;
    onFocus?(): void;
    onPopupOpen?(): void;
    onPopupClose?(): void;
}

export class EditorFieldTagsInput extends React.PureComponent<IProps> {
    render() {
        const field = this.props.field;
        const value = get(this.props.item, field, this.props.defaultValue ?? []);
        const error = get(this.props.errors ?? {}, field);

        return (
            <Row testId={this.props.testId}>
                <SelectTagInput
                    {...this.props}
                    field={field}
                    value={value}
                    invalid={error?.length > 0 && this.props.invalid}
                    labelKey={this.props.labelKey ?? 'name'}
                    valueKey={this.props.valueKey ?? 'qcode'}
                    searchKey={this.props.searchKey ?? 'name'}
                    readOnly={this.props.disabled}
                    required={this.props.required ?? this.props.schema?.required}
                />
            </Row>
        );
    }
}
