import React from 'react';
import PropTypes from 'prop-types';
import {LineInput, Label, Select} from './';
import {get, uniqueId} from 'lodash';
import {getVocabularyItemFieldTranslated} from '../../../utils/vocabularies';

/**
 * @ngdoc react
 * @name SelectInput
 * @description Component to select a list from dropdown with field label
 */
export const SelectInput = ({
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

SelectInput.propTypes = {
    field: PropTypes.string,
    id: PropTypes.string,
    label: PropTypes.string,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
    ]),
    onChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string,

    required: PropTypes.bool,
    invalid: PropTypes.bool,
    readOnly: PropTypes.bool,
    boxed: PropTypes.bool,
    noMargin: PropTypes.bool,

    options: PropTypes.arrayOf(PropTypes.shape({
        key: PropTypes.string,
        label: PropTypes.string,
        value: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.object,
            PropTypes.number,
        ]),
    })).isRequired,
    keyField: PropTypes.string,
    labelField: PropTypes.string,
    clearable: PropTypes.bool,
    autoFocus: PropTypes.bool,
    refNode: PropTypes.func,
    onFocus: PropTypes.func,
    valueAsString: PropTypes.bool,
    language: PropTypes.string,
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
