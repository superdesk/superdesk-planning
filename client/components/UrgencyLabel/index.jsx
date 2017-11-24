import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import classNames from 'classnames'
import { get } from 'lodash'
import * as selectors from '../../selectors'

const UrgencyLabelComponent = ({ item, urgencies, label, tooltipFlow }) => {
    const qcode = get(item, 'urgency', null)
    if (!qcode) {
        return null
    }

    const urgency = urgencies.find((u) => u.qcode === qcode)

    return (
        <span
            className={classNames(
                'urgency-label',
                'urgency-label--' + qcode
            )}
            data-sd-tooltip={label + ': ' + urgency.name}
            data-flow={tooltipFlow}
        >
            {urgency.qcode}
        </span>
    )
}

UrgencyLabelComponent.propTypes = {
    item: PropTypes.object,
    urgencies: PropTypes.array,
    label: PropTypes.string,
    tooltipFlow: PropTypes.oneOf(['up', 'right', 'down', 'left']),
}

UrgencyLabelComponent.defaultProps = { tooltipFlow: 'right' }

const mapStateToProps = (state) => ({
    label: get(state, 'urgency.label', 'Urgency'),
    urgencies: selectors.getUrgencies(state),
})

export const UrgencyLabel = connect(
    mapStateToProps,
    null
)(UrgencyLabelComponent)
