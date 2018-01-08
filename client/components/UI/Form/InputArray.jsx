import React from 'react';
import PropTypes from 'prop-types';
import {Row} from './';
import {gettext} from '../../../utils';
import {cloneDeep} from 'lodash';

export const InputArray = ({
    field,
    value,
    onChange,
    addButtonText,
    component,
    defaultValue,
    readOnly,
    ...props
}) => {
    const add = () => {
        value.push(cloneDeep(defaultValue));
        onChange(field, value);
    };

    const remove = (index) => {
        value.splice(index, 1);
        onChange(field, value);
    };

    const update = (index, newValue) => {
        value[index] = newValue;
        onChange(field, value);
    };

    const Component = component;

    return (
        <Row>
            {value.map((val, index) => (
                <Component
                    key={index}
                    field={`${field}[${index}]`}
                    onChange={(f, newValue) => update(index, newValue)}
                    value={val}
                    remove={remove.bind(null, index)}
                    readOnly={readOnly}
                    {...props}
                />
            ))}

            {!readOnly && (
                <button
                    className="btn btn-default"
                    onClick={add}
                    type="button"
                >
                    {gettext(addButtonText)}
                </button>
            )}
        </Row>
    );
};

InputArray.propTypes = {
    field: PropTypes.string.isRequired,
    label: PropTypes.string,
    value: PropTypes.array,
    onChange: PropTypes.func.isRequired,
    addButtonText: PropTypes.string.isRequired,
    component: PropTypes.func.isRequired,
    defaultValue: PropTypes.any,

    hint: PropTypes.string,
    message: PropTypes.string,
    required: PropTypes.bool,
    invalid: PropTypes.bool,
    readOnly: PropTypes.bool,
    boxed: PropTypes.bool,
    noMargin: PropTypes.bool,
};

InputArray.defaultProps = {
    value: [],
    defaultValue: {},
    required: false,
    invalid: false,
    readOnly: false,
    boxed: false,
    noMargin: true,
};
