import React from 'react'
import { get, some } from 'lodash'
import { Datetime, StateLabel } from '../index'
import { InputTextAreaField } from '../fields'

const formatDate = (d) => React.createElement(Datetime, { date: d })
const FIELDS = [
    // 'Label', 'key1', 'key2', ['key3', func(value)] etc...
    ['Name', 'name'],
    ['From', ['dates.start', formatDate]],
    ['To', ['dates.end', formatDate]],
    ['Short Description', 'definition_short'],
    ['Internal note', 'internal_note'],
    ['Location', 'location[0].name'],
    ['Status', 'occur_status.label'],
    ['Source', 'source'],
    ['Description', 'definition_long'],
]

function renderDict(event, label, ...keys) {
    function getValue(k) {
        // key can be either a string or an array ['key', func] where
        // func will take the value as parameter
        if (typeof k === 'string') {
            return get(event, k)
        } else {
            // this is an array with a function at the second position
            const value = get(event, k[0])
            if (value) {
                return k[1](value)
            }
        }
    }
    const keysContainValue = some(keys, (k) => getValue(k))
    if (keysContainValue) {
        return [
            <dt>{label}</dt>,
            ...keys.map((key) => (
                (key === 'definition_long') ? (
                    <InputTextAreaField
                        input={{
                            value: getValue(key),
                            name: key,
                        }}
                        meta={{}}
                    />
                ) : (
                    <dd>{getValue(key)}</dd>
                )
            )),
        ]
    }
}
// eslint-disable-next-line react/no-multi-comp
export function EventMetadata ({ event }) {
    return (
        <div>
            <StateLabel item={event} verbose={true}/>
            <div className="metadata-view EditPlanningPanel__body--event">
                <dl>
                    {FIELDS.map((arrayProps) => renderDict.bind(null, event).apply(null, arrayProps))}
                </dl>
            </div>
        </div>
    )
}

EventMetadata.propTypes = {
    event: React.PropTypes.shape({
        name: React.PropTypes.string.isRequired,
        dates: React.PropTypes.object.isRequired,
        definition_short: React.PropTypes.string,
        definition_long: React.PropTypes.string,
        internal_note: React.PropTypes.string,
        location: React.PropTypes.array,
        occur_status: React.PropTypes.object,
        source: React.PropTypes.string,
    }),
}
