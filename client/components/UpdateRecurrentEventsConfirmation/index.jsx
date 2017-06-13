import React from 'react'
import PropTypes from 'prop-types'

function UpdateRecurrentEventsConfirmation({ updatedEvent, relatedCount }) {
    return (
        <div>
            <p>
                You are going to update {updatedEvent.name} which is a recurring event and has
                <b>{relatedCount}</b> future occurences.
            </p>
            <p>
                This update may spike them. If there are associated plannings,
                it will spike the plannings too.
            </p>
        </div>
    )
}

const eventPropTypes = PropTypes.shape({
    name: PropTypes.string.isRequired,
    dates: PropTypes.object.isRequired,
    definition_short: PropTypes.string,
    definition_long: PropTypes.string,
    location: PropTypes.array,
    occur_status: PropTypes.object,
    _created: PropTypes.string,
    source: PropTypes.string,
})

UpdateRecurrentEventsConfirmation.propTypes = {
    updatedEvent: eventPropTypes,
    relatedCount: PropTypes.number,
}

export default UpdateRecurrentEventsConfirmation
