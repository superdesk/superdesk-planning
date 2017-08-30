import React from 'react'
import PropTypes from 'prop-types'
import { RepeatEventSummary } from '../index'
import { InputField } from '../fields'
import { get } from 'lodash'
import moment from 'moment'
import './style.scss'

export const EventScheduleSummary = ({ schedule }) => {
    const doesRepeat = get(schedule, 'recurring_rule', null) !== null
    const frequency = get(schedule, 'recurring_rule.frequency')
    const endRepeatMode = get(schedule, 'recurring_rule.endRepeatMode')
    const until = get(schedule, 'recurring_rule.until')
    const count = get(schedule, 'recurring_rule.count')
    const byDay = get(schedule, 'recurring_rule.byday')
    const start = get(schedule, 'start')
    const end = get(schedule, 'end')
    const interval = get(schedule, 'recurring_rule.interval')

    let startStr = moment(start).format('MMMM Do YYYY, h:mm:ss a')
    let endStr = moment(end).format('MMMM Do YYYY, h:mm:ss a')
    return (
        <div className="EventScheduleSummary">
            <div className="form__row">
                <InputField
                    label="Starts"
                    readOnly={true}
                    type="text"
                    meta={{}}
                    input={{
                        name: 'starts',
                        value: startStr,
                    }}
                />
            </div>
            <div className="form__row">
                <InputField
                    label="Ends"
                    readOnly={true}
                    type="text"
                    meta={{}}
                    input={{
                        name: 'ends',
                        value: endStr,
                    }}
                />
            </div>
            {doesRepeat &&
                <RepeatEventSummary
                    byDay={byDay}
                    interval={interval}
                    frequency={frequency}
                    endRepeatMode={endRepeatMode}
                    until={until}
                    count={count}
                    startDate={start}
                    asInputField={true}
                />
            }
        </div>
    )
}

EventScheduleSummary.propTypes = { schedule: PropTypes.object }
