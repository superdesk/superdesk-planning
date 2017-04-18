import React from 'react'

export default function Toggle({ value, onChange }) {
    const onClick = () => onChange({ target: { value: !!value } })
    return (
        <span className={'sd-toggle ' + (value ? 'checked' : '')} onClick={onClick}>
            <span className="inner"/>
        </span>
    )
}

Toggle.propTypes = {
    value: React.PropTypes.bool,
    onChange: React.PropTypes.func,
}
