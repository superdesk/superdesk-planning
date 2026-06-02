import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../superdeskApi';
import {ICoveragePlanningDetails} from '../../../interfaces';
import {ICustomTextFieldProps} from './CustomText.interface';

import {Input} from 'superdesk-ui-framework/react';
import {Row, TextAreaInput} from '../../UI/Form';

export class EditorFieldCustomText extends React.PureComponent<ICustomTextFieldProps> {
    render() {
        const {
            field,
            item,
            storageField,
            errors,
            testId,
            required,
            schema,
            disabled,
            invalid,
            showErrors,
            language,
        } = this.props;

        const cv = superdeskApi.entities.vocabulary.getVocabulary(field);
        const isSingleLine = cv.field_type === 'text' && cv.field_options?.single === true;

        let value: string;
        let onChange: (newValue: string) => void;

        if (this.props.valueStoredAsArray) {
            const fields: ICoveragePlanningDetails['fields'] = get(item, storageField ?? 'fields', []) || [];

            value = fields.find((f) => f.field === field)?.value ?? '';
            onChange = (newValue: string) => {
                const otherFields = fields.filter((f) => f.field !== field);

                this.props.onChange(
                    storageField ?? 'fields',
                    [...otherFields, {field: field, value: newValue}],
                );
            };
        } else {
            value = get(item, storageField ?? field, '') ?? '';
            onChange = (newValue: string) => {
                this.props.onChange(storageField ?? field, newValue);
            };
        }

        const error: string | undefined = get(errors ?? {}, field);
        const label = cv?.translations?.display_name?.[language] ?? cv?.display_name ?? this.props.label;

        return (
            <Row
                key={cv?._id}
                id={`form-row-${cv?.display_name}`}
                testId={testId?.length ? testId : cv?._id}
            >
                {isSingleLine ? (
                    <Input
                        value={value}
                        type="text"
                        label={label}
                        required={required ?? schema?.required}
                        disabled={disabled}
                        maxLength={schema?.maxlength}
                        error={showErrors ? error : undefined}
                        onChange={onChange}
                    />
                ) : (
                    <TextAreaInput
                        field={field}
                        value={value}
                        label={label}
                        required={required ?? schema?.required}
                        readOnly={disabled}
                        maxLength={schema?.maxlength}
                        invalid={invalid ?? (error != null && showErrors)}
                        noMargin={true}
                        onChange={(_field: string, newValue: string) => {
                            onChange(newValue);
                        }}
                    />
                )}
            </Row>
        );
    }
}
