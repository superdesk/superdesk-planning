/* eslint-disable react/no-multi-comp */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get} from 'lodash';

import {Button} from '../../';
import {Row, LineInput} from '../';
import './style.scss';

/**
 * @ngdoc react
 * @name InputArray
 * @description Component to create an array of input components
 */
export const InputArray = ({
    field,
    value,
    onChange,
    addButtonComponent,
    addButtonProps,
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
    const add = ((...args) => {
        let currentValue = args.shift();
        const newElement = typeof defaultElement === 'function' ? defaultElement(...args) : defaultElement;

        onChange(field, [...currentValue, newElement]);
    }).bind(null, value);

    const remove = (index) => {
        onChange(field, value.filter((v, ind) => ind !== index));
    };

    const Component = element;

    const showAddButton = (maxCount ? value.length < maxCount : true) && !readOnly;
    const isIndexReadOnly = (index) => (addOnly && index === originalCount) ? false : readOnly;
    const customButton = addButtonComponent ? React.createElement(addButtonComponent,
        {...addButtonProps, onAdd: add}) : false;
    let addButton = row ? (customButton || <Button onClick={add} text={addButtonText} />) :
        (customButton || <Button onClick={add} text={addButtonText} tabIndex={0} enterKeyIsClick/>);

    const labelComponent = label ?
        <div>
            <div className={classNames('InputArray__label', labelClassName)}>{label}</div>
            {buttonWithLabel && showAddButton && addButton}
        </div> : null;

    const getComponent = (val, index, row) => {
        const indexReadOnly = isIndexReadOnly(index);

        return row ?
            (<Component
                key={index}
                index={index}
                field={`${field}[${index}]`}
                onChange={onChange}
                value={val}
                remove={remove.bind(null, index)}
                readOnly={indexReadOnly}
                message={get(message, `[${index}]`)}
                invalid={!!get(message, `[${index}]`)}
                openComponent={addOnly && !indexReadOnly}
                {...props}
            />) :
            (<Component
                key={index}
                index={index}
                field={`${field}[${index}]`}
                onChange={onChange}
                value={val}
                remove={remove.bind(null, index)}
                readOnly={indexReadOnly}
                message={get(message, `[${index}]`)}
                invalid={!!get(message, `[${index}]`)}
                openComponent={addOnly && !indexReadOnly}
                {...props}
            />);
    };

    return (
        <Row noPadding={!!message}>
            {labelComponent}
            {get(message, field) && (
                <LineInput
                    invalid={true}
                    message={get(message, field)}
                    readOnly
                    noLabel
                />
            )}
            {value && value.map((val, index) => (getComponent(val, index, row)))}
            {!buttonWithLabel && showAddButton && addButton}
        </Row>
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
    addButtonProps: PropTypes.object,
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
