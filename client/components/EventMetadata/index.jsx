import React from 'react'
import { get, has, some } from 'lodash'

function renderDict(event, label, ...keys) {
    if (some(keys, (k) => has(event, k))) {
        return [
            <dt>{label}</dt>,
            ...keys.map((key) => (
                <dd>{get(event, key)}</dd>
            )),
        ]
    }
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
                {FIELDS.map((arrayProps) => renderDict.bind(null, event).apply(null, arrayProps))}
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
    }),
}
