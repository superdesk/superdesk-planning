/* eslint-disable react/prop-types */

import React from 'react';
import {LineInput, Label, Select} from './';
import {get, uniqueId} from 'lodash';
import {getVocabularyItemFieldTranslated} from '../../../utils/vocabularies';

interface IProps {
    field?: string;
    id?: string;
    label?: string;
    value?: string | {};
    onChange(field: any, value: any): void;
    placeholder?: string;
    required?: boolean;
    invalid?: boolean;
    readOnly?: boolean;
    boxed?: boolean;
    noMargin?: boolean;
    options: Array<any>;
    keyField?: string;
    labelField?: string;
    clearable?: boolean;
    autoFocus?: boolean;
    refNode?: any;
    onFocus?(): void;
    valueAsString?: boolean;
    language?: string;
}

/**
 * @ngdoc react
 * @name SelectInput
 * @description Component to select a list from dropdown with field label
 */
export const SelectInput: React.FunctionComponent<IProps> = ({
    id,
    field,
    label,
    value,
    options,
    keyField,
    labelField,
    onChange,
    readOnly,
    clearable,
    autoFocus,
    refNode,
    onFocus,
    placeholder,
    valueAsString,
    language,
    ...props
}) => {
    let key;

    if (valueAsString) {
        key = clearable ?
            (value || '') :
            value;
    } else {
        key = clearable ?
            get(value, keyField, '') :
            get(value, keyField, get(options, `[0].${keyField}`));
    }

    const opts = options.map((opt) => ({
        key: get(opt, keyField),
        label: getVocabularyItemFieldTranslated(opt, labelField, language, 'name'),
    }));

    const onChangeHandler = (field, key) => {
        let value;

        if (valueAsString) {
            value = key;
        } else {
            value = options.find(
                (option) => get(option, keyField) === key
            ) || null;
        }

        onChange(field, value);
    };

    const selectId = id || uniqueId('select-');

    return (
        <LineInput {...props} isSelect={true} readOnly={readOnly}>
            <Label htmlFor={selectId} text={label} />
            <Select
                id={selectId}
                field={field}
                value={key}
                onChange={onChangeHandler}
                options={opts}
                readOnly={readOnly}
                clearable={clearable}
                autoFocus={autoFocus}
                refNode={refNode}
                onFocus={onFocus}
                placeholder={placeholder}
            />
        </LineInput>
    );
};

SelectInput.defaultProps = {
    required: false,
    invalid: false,
    readOnly: false,
    boxed: false,
    noMargin: false,
    keyField: 'qcode',
    labelField: 'label',
    clearable: false,
    autoFocus: false,
    valueAsString: false,
};
