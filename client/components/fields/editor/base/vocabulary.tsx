import * as React from 'react';
import {get} from 'lodash';

import {IEditorFieldProps} from '../../../../interfaces';
import {SelectMetaTermsInput, Row} from '../../../UI/Form';

interface IProps extends IEditorFieldProps {
    options: Array<any>;
    valueKey?: string;
    labelKey?: string;
    searchKey?: string;
    groupField?: string;
    noMargin?: boolean; // defaults to true
}

export class EditorFieldVocabulary extends React.PureComponent<IProps> {
    render() {
        const field = this.props.field;
        const value = get(this.props.item, field, this.props.defaultValue);
        const error = get(this.props.errors ?? {}, field);

        return (
            <Row testId={this.props.testId}>
                <SelectMetaTermsInput
                    ref={this.props.refNode}
                    {...this.props}
                    field={field}
                    defaultValue={this.props.defaultValue ?? []}
                    value={value}
                    message={error}
                    invalid={error?.length > 0 && this.props.invalid}
                    valueKey={this.props.valueKey ?? 'qcode'}
                    labelKey={this.props.labelKey ?? 'name'}
                    searchKey={this.props.searchKey ?? 'name'}
                    noMargin={this.props.noMargin ?? true}
                    readOnly={this.props.disabled}
                    required={this.props.required ?? this.props.schema?.required}
                />
            </Row>
        );
    }
}
