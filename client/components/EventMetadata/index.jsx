import React from 'react'
import { get, has, some, cloneDeep } from 'lodash'
import moment from 'moment'

function renderDict(event, label, ...keys) {
    if (some(keys, (k) => has(event, k))) {
        return [
            <dt>{label}</dt>,
            ...keys.map((key) => (
                <dd>{get(event, key)}</dd>
            ))
        ]
    }
}

/**
* Function to perform any UI specific formatting required for rendering the event object
*/
function getUIFormattedEvent(event) {
    if (!event) return

    let formattedEvent = cloneDeep(event)
    if ( event.dates ) {
        formattedEvent.dates.start = event.dates.start ? moment(event.dates.start).format('MM/DD/YYYY HH:mm') : null
        formattedEvent.dates.end = event.dates.end ? moment(event.dates.end).format('MM/DD/YYYY HH:mm') : null
    }
    return formattedEvent
}

const FIELDS = [
    // Label, key1, key2, etc...
    ['Name', 'name'],
    ['From', 'dates.start'],
    ['To', 'dates.end'],
    ['Description', 'definition_short', 'definition_long'],
    ['Location', 'location[0].name'],
    ['Status', 'occur_status.name'],
]

export function EventMetadata ({ event }) {

    return (
        <div className="metadata-view">
            <dl>
                {FIELDS.map((arrayProps) => renderDict.bind(null, getUIFormattedEvent(event)).apply(null, arrayProps))}
            </dl>
        </div>
    )
}

EventMetadata.propTypes = {
    event: React.PropTypes.shape({
        name: React.PropTypes.string.isRequired,
        dates: React.PropTypes.object.isRequired,
        definition_short: React.PropTypes.string,
        definition_long: React.PropTypes.string,
        location: React.PropTypes.array,
        occur_status: React.PropTypes.object,
    })
}
