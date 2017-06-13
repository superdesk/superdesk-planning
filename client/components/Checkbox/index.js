import React from 'react'
import PropTypes from 'prop-types'

function Checkbox({ value, onChange }) {
    const onClick = (e) => {
        e.stopPropagation()
        onChange({ target: { value: !value } })
    }

    return (
        <span className={'sd-checkbox ' + (value ? 'checked' : '')} onClick={onClick}/>
    )
}

Checkbox.propTypes = {
    value: PropTypes.bool,
    onChange: PropTypes.func,
}

export default Checkbox
