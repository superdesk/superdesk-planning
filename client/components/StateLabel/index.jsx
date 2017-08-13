import React from 'react'
import PropTypes from 'prop-types'
import { OverlayTrigger } from 'react-bootstrap'
import classNames from 'classnames'
import { get } from 'lodash'
import { getItemStateUiLabel } from '../../utils'

const StateLabel = ({ item, verbose }) => {
    const state = getItemStateUiLabel(item)
    if (!state) {
        return null
    }

    const labelClasses = classNames('label',
        `label--${state.iconType}`,
        { 'label--hollow': state.iconHollow })
    const label = (
        <span className={labelClasses}>
            {verbose ? get(state, 'labelVerbose', state.label) : state.label}
        </span>
    )
    if (state.tooltip) {
        return (
            <OverlayTrigger placement="bottom" overlay={state.tooltip}>
                {label}
            </OverlayTrigger>
        )
    } else {
        return label
    }
}

StateLabel.propTypes = {
    item: PropTypes.object,
    verbose: PropTypes.bool,
}

export default StateLabel
