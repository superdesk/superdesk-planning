import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {cloneDeep, get} from 'lodash';

import {Button} from '../../';
import {Row, LineInput} from '../';
import './style.scss';

export const InputArray = ({
    field,
    value,
    onChange,
    addButtonComponent,
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
    buttonWithLabel,
    label,
    labelClassName,
    ...props
}) => {
    const add = (...args) => {
        const newElement = typeof defaultElement === 'function' ? defaultElement(...args) : defaultElement;

        value.push(cloneDeep(newElement));
        onChange(field, [...value]);
    };

    const remove = (index) => {
        value.splice(index, 1);
        onChange(field, [...value]);
    };

    const Component = element;

    const showAddButton = (maxCount ? value.length < maxCount : true) && !readOnly;
    const isIndexReadOnly = (index) => (addOnly && index === originalCount) ? false : readOnly;
    const customButton = addButtonComponent ? React.createElement(addButtonComponent, {onAdd: add}) : false;
    let addButton = row ? (customButton || <Button onClick={add} text={addButtonText} />) :
        (customButton || <Button onClick={add} text={addButtonText} tabIndex={0} enterKeyIsClick/>);

    const labelComponent = label ?
        <div>
            <div className={classNames('InputArray__label', labelClassName)}>{label}</div>
            {buttonWithLabel && showAddButton && addButton}
        </div> : null;

    return row ? (
        <Row noPadding={!!message}>
            {labelComponent}
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

            {!buttonWithLabel && showAddButton && addButton}
        </Row>
    ) : (
        <div>
            {labelComponent}
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

            {!buttonWithLabel && showAddButton && addButton}
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
    buttonWithLabel: PropTypes.bool,

    item: PropTypes.object,
    diff: PropTypes.object,
    formProfile: PropTypes.object,
    errors: PropTypes.object,
    showErrors: PropTypes.bool,
    row: PropTypes.bool,
    addButtonComponent: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.object,
    ]),
    labelClassName: PropTypes.string,
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
