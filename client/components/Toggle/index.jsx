import React from 'react'
import classNames from 'classnames'
import './style.scss'

export default function Toggle({ value, onChange, readOnly }) {
    const onClick = () => onChange({ target: { value: !value } })
    const className = classNames(
        'sd-toggle',
        { 'checked': value },
        { 'disabled': readOnly }
    )
    return (
        <span className={className} onClick={!readOnly && onChange ? onClick : null}>
            <span className="inner"/>
        </span>
    )
}

Toggle.propTypes = {
    value: React.PropTypes.bool,
    onChange: React.PropTypes.func,
    readOnly: React.PropTypes.bool,
}

Toggle.defaultProps = {
    value: false,
    readOnly: false,
}
