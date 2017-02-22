import React from 'react'
import moment from 'moment'
import { EventItem } from '../index'
import './style.scss'

export class EventsList extends React.Component {
    constructor(props) {
        super(props)
    }

    onEventClick(event) { this.props.onEventClick(event) }

    render() {
        return (
            <div className="events-list">
            {
                this.orderEventsByDay(this.props.events).map(({ date, events }) => {
                    let dateStr = moment(date).format('dddd LL')
                    return (
                        <div className="events-list__group" key={dateStr}>
                            <div className="events-list__title">{dateStr}</div>
                            <ul className="events-list__list list-view compact-view">
                                {events.map((event) => (
                                    <EventItem event={event}
                                           key={event._id}
                                           onClick={this.onEventClick.bind(this, event)} />
                                ))}
                            </ul>
                        </div>
                    )
                })
            }
            { !this.props.events || this.props.events.length === 0 &&
                <p className="events-list__empty-msg">There is no event yet</p>
            }
            </div>
        )
    }

    /**
    * Will produce an array of days, which contain the day date and
    * the associated events.
    * @param {Array} events - List of events
    */
    orderEventsByDay(events) {
        if (!events) return []
        // order by date
        events = events.sort((a, b) => a.dates.start - b.dates.start)
        var days = {}
        events.forEach((event) => {
            let eventDate = moment(event.dates.start)
            let eventDay = eventDate.format('YYYY-MM-DD')
            if (!days[eventDay]) {
                days[eventDay] = []
            }

            days[eventDay].push(event)
        })

        let sortable = []
        for (let day in days) sortable.push({ date: day, events: days[day] })
        sortable.sort((a, b) => a.date > b.date)
        return sortable
    }
}

EventsList.propTypes = {
    onEventClick: React.PropTypes.func,
    events: React.PropTypes.array.isRequired,
}
