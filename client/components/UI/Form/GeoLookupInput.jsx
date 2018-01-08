import PropTypes from 'prop-types';
import {AddGeoLookupInput} from './AddGeoLookupInput';
import React from 'react';
import {LineInput, Label} from './';

export const GeoLookupInput = ({
    label,
    disableSearch,
    localSearchResults,
    onChange,
    value,
    field,
    readOnly,
    ...props
}) => (
    <LineInput {...props} readOnly={readOnly}>
        <Label text={label} />
        <AddGeoLookupInput
            field={field}
            onChange={onChange}
            initialValue={value || {}}
            readOnly={readOnly}
            disableSearch={disableSearch}
            localSearchResults={localSearchResults}
        />
    </LineInput>
);

GeoLookupInput.propTypes = {
    field: PropTypes.string.isRequired,
    label: PropTypes.string,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
    ]),
    onChange: PropTypes.func.isRequired,
    disableSearch: PropTypes.bool,
    localSearchResults: PropTypes.array,

    hint: PropTypes.string,
    message: PropTypes.string,
    required: PropTypes.bool,
    invalid: PropTypes.bool,
    readOnly: PropTypes.bool,
    boxed: PropTypes.bool,
    noMargin: PropTypes.bool,
};

GeoLookupInput.defaultProps = {
    disableSearch: false,
    required: false,
    invalid: false,
    readOnly: false,
    boxed: false,
    noMargin: false,
};
