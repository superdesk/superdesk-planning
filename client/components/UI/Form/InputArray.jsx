import React from 'react';
import PropTypes from 'prop-types';
import {cloneDeep, get} from 'lodash';

import {Row, LineInput} from './';
import {Button} from '../';

export const InputArray = ({
    field,
    value,
    onChange,
    addButtonText,
    maxCount,
    addOnly,
    originalCount,
    element,
    defaultElement,
    readOnly,
    message,
    invalid,
    row,
    ...props
}) => {
    const add = () => {
        value.push(cloneDeep(defaultElement));
        onChange(field, [...value]);
    };

    const remove = (index) => {
        value.splice(index, 1);
        onChange(field, [...value]);
    };

    const Component = element;

    const showAddButton = maxCount ? value.length < maxCount : true;
    const isIndexReadOnly = (index) => (addOnly && index === originalCount) ? false : readOnly;

    return row ? (
        <Row noPadding={!!message}>
            {get(message, field) && (
                <LineInput
                    invalid={true}
                    message={get(message, field)}
                    readOnly={true}
                    noLabel={true}
                />
            )}
            {value && value.map((val, index) => {
                const indexReadOnly = isIndexReadOnly(index);

                return <Component
                    key={index}
                    field={`${field}[${index}]`}
                    onChange={onChange}
                    value={val}
                    remove={remove.bind(null, index)}
                    readOnly={indexReadOnly}
                    message={get(message, `[${index}]`)}
                    invalid={!!get(message, `[${index}]`)}
                    openComponent={addOnly && !indexReadOnly}
                    {...props}
                />;
            }
            )}

            {!readOnly && showAddButton && (
                <Button
                    onClick={add}
                    text={addButtonText}
                />
            )}
        </Row>
    ) : (
        <div>
            {get(message, field) && (
                <LineInput
                    invalid={true}
                    message={get(message, field)}
                    readOnly={true}
                    noLabel={true}
                />
            )}
            {value && value.map((val, index) => {
                const indexReadOnly = isIndexReadOnly(index);

                return <Component
                    key={index}
                    field={`${field}[${index}]`}
                    onChange={onChange}
                    value={val}
                    remove={remove.bind(null, index)}
                    readOnly={indexReadOnly}
                    message={get(message, `[${index}]`)}
                    invalid={!!get(message, `[${index}]`)}
                    openComponent={addOnly && !indexReadOnly}
                    {...props}
                />;
            }
            )}

            {!readOnly && showAddButton && (
                <Button
                    onClick={add}
                    text={addButtonText}
                    tabIndex={0}
                    enterKeyIsClick
                />
            )}
        </div>
    );
};

InputArray.propTypes = {
    field: PropTypes.string.isRequired,
    label: PropTypes.string,
    value: PropTypes.array,
    onChange: PropTypes.func.isRequired,
    addButtonText: PropTypes.string.isRequired,
    maxCount: PropTypes.number,
    addOnly: PropTypes.bool,
    originalCount: PropTypes.number,
    element: PropTypes.func.isRequired,
    defaultElement: PropTypes.any,

    hint: PropTypes.string,
    message: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
    ]),
    required: PropTypes.bool,
    invalid: PropTypes.bool,
    readOnly: PropTypes.bool,
    boxed: PropTypes.bool,
    noMargin: PropTypes.bool,

    item: PropTypes.object,
    diff: PropTypes.object,
    formProfile: PropTypes.object,
    errors: PropTypes.object,
    showErrors: PropTypes.bool,
    row: PropTypes.bool,
};

InputArray.defaultProps = {
    value: [],
    defaultElement: {},
    required: false,
    invalid: false,
    readOnly: false,
    boxed: false,
    noMargin: true,
    maxCount: 0,
    row: true,
};
