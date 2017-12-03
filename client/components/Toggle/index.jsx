import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './style.scss';

export default function Toggle({value, onChange, readOnly}) {
    const onClick = () => onChange({target: {value: !value}});
    const className = classNames(
        'sd-toggle',
        {checked: value},
        {disabled: readOnly}
    );

    return (
        <span className={className} onClick={!readOnly && onChange ? onClick : null}>
            <span className="inner"/>
        </span>
    );
}

Toggle.propTypes = {
    value: PropTypes.bool,
    onChange: PropTypes.func,
    readOnly: PropTypes.bool,
};

Toggle.defaultProps = {
    value: false,
    readOnly: false,
};
