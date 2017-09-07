/* eslint-disable react/no-multi-comp */
import React from 'react'
import PropTypes from 'prop-types'
import { OverlayTrigger } from 'react-bootstrap'
import classNames from 'classnames'
import { get } from 'lodash'
import { getItemWorkflowStateLabel, getItemPublishedStateLabel } from '../../utils'

export const StateLabel = ({ item, verbose, withPubStatus }) => {
    const state = getItemWorkflowStateLabel(item)
    const pubState = withPubStatus ? getItemPublishedStateLabel(item) : null

    if (!state) {
        return null
    }

    const getStateLabel = (state) => {
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


    return (
        <div>
            {getStateLabel(state)}
            &nbsp;&nbsp;
            {withPubStatus && pubState && getStateLabel(pubState)}
        </div>
    )
}

StateLabel.propTypes = {
    item: PropTypes.object,
    verbose: PropTypes.bool,
    withPubStatus: PropTypes.bool,
}

StateLabel.defaultProps = { withPubStatus: true }
