import PropTypes from 'prop-types';
import {AddGeoLookupInput} from '../index';
import classNames from 'classnames';
import React from 'react';

export const GeoLookupInput = ({
    input,
    label,
    readOnly,
    disableSearch,
    localSearchResults,
    meta: {
        touched,
        error,
        warning,
    },
}) => {
    const showMessage = touched && (error || warning);
    const divClass = classNames(
        'sd-line-input',
        {'sd-line-input--invalid': showMessage},
        {'sd-line-input--no-margin': !showMessage}
    );

    return (<div className={divClass}>
        {label && <label className="sd-line-input__label">{label}</label>}

        <AddGeoLookupInput
            onChange={input.onChange}
            initialValue={input.value || {}}
            readOnly={readOnly}
            disableSearch={disableSearch}
            localSearchResults={localSearchResults} />
        {touched && ((error && <span className="error-block">{error}</span>) ||
        (warning && <span className="help-block">{warning}</span>))}
    </div>);
};
GeoLookupInput.propTypes = {
    input: PropTypes.object.isRequired,
    label: PropTypes.string,
    meta: PropTypes.object.isRequired,
    readOnly: PropTypes.bool,
    disableSearch: PropTypes.bool,
    localSearchResults: PropTypes.array,
};

GeoLookupInput.defaultProps = {disableSearch: false};
