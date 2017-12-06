import React from 'react';
import PropTypes from 'prop-types';

/**
 * This field removes programmatically setting the value of the input field, as this
 * is seen as a security threat and Browsers will not allow it showing an error like:
 *
 * Uncaught DOMException: Failed to set the 'value' property on 'HTMLInputElement':
 * This input element accepts a filename, which may only be programmatically set to the empty
 *
 * @param value
 * @param inputProps
 * @constructor
 */
export const FileInputField = ({input: {value, ...inputProps}}) => (
    <input
        {...inputProps}
        type="file"
    />
);

FileInputField.propTypes = {
    input: PropTypes.object
};
