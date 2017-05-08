import React from 'react'
import moment from 'moment'
import { EventItem } from '../index'
import './style.scss'
import { sortBy } from 'lodash'
import { isAllDay } from '../../utils'

export class EventsList extends React.Component {
    constructor(props) {
        super(props)
    }

    onEventClick(event) { this.props.onEventClick(event) }
    onEventDelete(event) { this.props.onEventDelete(event) }

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
                                           onClick={this.onEventClick.bind(this, event)}
                                           deleteEvent={this.onEventDelete.bind(this, event)}
                                           selectedEvent={this.props.selectedEvent}/>
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
        function addEventToDate(event, date) {
            date = date || event.dates.start
            date = date.format('YYYY-MM-DD')
            if (!days[date]) {
                days[date] = []
            }

            days[date].push(event)
        }
        events.forEach((event) => {
            // if the event happens during more that one day, add it to every day
            if (!isAllDay(event) && !event.dates.start.isSame(event.dates.end, 'day')) {
                // compute the number of days of the event
                var deltaDays = Math.max(event.dates.end.diff(event.dates.start, 'days'), 1)
                // add the event to the other days
                for (var i = 1; i <= deltaDays; i++) {
                    //  clone the date
                    const newDate = moment(event.dates.start)
                    newDate.add(i, 'days')
                    addEventToDate(event, newDate)
                }
            }
            // add event to its initial starting date
            addEventToDate(event)
        })

        let sortable = []
        for (let day in days) sortable.push({
            date: day,
            events: days[day],
        })

        return sortBy(sortable, [(e) => (e.date)])
    }
}

EventsList.propTypes = {
    onEventClick: React.PropTypes.func,
    events: React.PropTypes.array.isRequired,
    onEventDelete: React.PropTypes.func,
    selectedEvent: React.PropTypes.string,
}
