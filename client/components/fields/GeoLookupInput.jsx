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
    input: React.PropTypes.object.isRequired,
    label: React.PropTypes.string,
    meta: React.PropTypes.object.isRequired,
    readOnly: React.PropTypes.bool,
    disableSearch: React.PropTypes.bool,
    localSearchResults: React.PropTypes.array,
};

GeoLookupInput.defaultProps = {disableSearch: false};
