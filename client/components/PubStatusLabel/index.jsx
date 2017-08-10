import React from 'react'
import PropTypes from 'prop-types'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { WORKFLOW_STATE } from '../../constants'
import classNames from 'classnames'
import { get } from 'lodash'

const STATUS_LABELS = {
    [WORKFLOW_STATE.PUBLISHED]: {
        label: 'P',
        labelVerbose: 'Published',
        labelType: 'success',
        tooltip:  <Tooltip id="pubStatusUsuableTT">Published</Tooltip>,
    },
    [WORKFLOW_STATE.KILLED]: {
        label: 'Killed',
        labelType: 'warning',
        tooltip: (<Tooltip id="pubStatusWithHoldTT">
            The event has been killed.
        </Tooltip>),
    },
    internal: {
        label: 'Internal',
        labelType: '',
    },
}

const PubStatusLabel = ({ status, verbose }) => {
    const pubStatus = STATUS_LABELS[status]
    if (!pubStatus || (pubStatus === STATUS_LABELS.internal && !verbose)) {
        return null
    }

    const labelClasses = classNames('label', `label--${pubStatus.labelType}`)
    const label = (
        <span className={labelClasses}>
            {verbose ? get(pubStatus, 'labelVerbose', pubStatus.label) : pubStatus.label}
        </span>
    )
    if (pubStatus.tooltip) {
        return (
            <OverlayTrigger placement="bottom" overlay={pubStatus.tooltip}>
                {label}
            </OverlayTrigger>
        )
    } else {
        return label
    }
}

PubStatusLabel.defaultProps = {
    status: 'internal',
    verbose: false,
}

PubStatusLabel.propTypes = {
    status: PropTypes.string.isRequired,
    verbose: PropTypes.bool,
}

export default PubStatusLabel
