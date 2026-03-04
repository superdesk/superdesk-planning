import * as React from 'react';
import {get, set} from 'lodash';

import {getVocabularyItemFieldTranslated} from '../../../../utils/vocabularies';
import {IEditorFieldProps} from '../../../../interfaces';
import {SelectMetaTermsInput, Row} from '../../../UI/Form';

export interface IEditorFieldVocabularyProps extends IEditorFieldProps {
    options: Array<any>;
    valueKey?: string;
    labelKey?: string;
    searchKey?: string;
    groupField?: string;
    noMargin?: boolean; // defaults to true
    valueAsString?: boolean;
    singleSelect?: boolean;
    language?: string;
}

export class EditorFieldVocabulary extends React.PureComponent<IEditorFieldVocabularyProps> {
    static defaultProps = {
        valueKey: 'qcode',
        labelKey: 'name',
        searchKey: 'name',
        noMargin: true,
        valueAsString: false,
    }

    onChange = (field: string, value: Array<any>) => {
        this.props.onChange(
            field,
            !this.props.valueAsString ?
                value :
                value.map((val) => get(val, this.props.valueKey))
        );
    }

    getTranslatedOptionLabel = (option: any): string => {
        return getVocabularyItemFieldTranslated(option, this.props.labelKey, this.props.language);
    }

    render() {
        const field = this.props.field;
        const defaultValue = this.props.defaultValue ?? [];
        let value = get(this.props.item, field) || defaultValue;
        const error = get(this.props.errors ?? {}, field);

        if (this.props.valueAsString) {
            const item = {};
            const values = value.map(
                (value) => this.props.options.find(
                    (option) => get(option, this.props.valueKey) === value
                )
            );

            set(item, field, values);
            value = values;
        }

        return (
            <Row testId={this.props.testId}>
                <SelectMetaTermsInput
                    {...this.props}
                    ref={this.props.refNode}
                    field={field}
                    defaultValue={defaultValue}
                    value={value}
                    message={error}
                    invalid={this.props.invalid ?? (error?.length > 0 && this.props.showErrors)}
                    valueKey={this.props.valueKey ?? 'qcode'}
                    labelKey={this.props.labelKey ?? 'name'}
                    searchKey={this.props.searchKey ?? 'name'}
                    noMargin={this.props.noMargin ?? true}
                    readOnly={this.props.disabled}
                    required={this.props.required ?? this.props.schema?.required}
                    onChange={this.onChange}
                    singleSelect={this.props.singleSelect}
                    getLabel={this.props.language == null ? undefined : this.getTranslatedOptionLabel}
                />
            </Row>
        );
    }
}
