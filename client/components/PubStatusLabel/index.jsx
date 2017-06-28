import React from 'react'
import PropTypes from 'prop-types'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { EVENTS } from '../../constants'
import classNames from 'classnames'
import { get } from 'lodash'

const PUB_STATUS_LABELS = {
    [EVENTS.PUB_STATUS.USABLE]: {
        label: 'P',
        labelVerbose: 'Published',
        labelType: 'success',
        tooltip:  <Tooltip id="pubStatusUsuableTT">Published</Tooltip>,
    },
    [EVENTS.PUB_STATUS.WITHHOLD]: {
        label: 'Unpublished',
        labelType: 'warning',
        tooltip: (<Tooltip id="pubStatusWithHoldTT">
            The event has been already published but is now set as internal event.
        </Tooltip>),
    },
    internal: {
        label: 'Internal',
        labelType: 'default',
        tooltip:  <Tooltip id="pubStatuInternalTT">Internal</Tooltip>,
    },
}

const PubStatusLabel = ({ status, verbose }) => {
    const pubStatus = PUB_STATUS_LABELS[status]
    if (!pubStatus || (pubStatus === PUB_STATUS_LABELS.internal && !verbose)) {
        return null
    }

    const labelClasses = classNames('label', `label--${pubStatus.labelType}`)
    return (
        <OverlayTrigger placement="bottom" overlay={pubStatus.tooltip}>
            <span className={labelClasses}>
                {verbose ? get(pubStatus, 'labelVerbose', pubStatus.label) : pubStatus.label}
            </span>
        </OverlayTrigger>
    )
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
