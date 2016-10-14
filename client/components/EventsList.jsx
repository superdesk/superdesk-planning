import React from 'react';
import moment from 'moment';

export class EventsList extends React.Component {
    constructor(props) {
        super(props);
    }

    onEventClick(event) { this.props.onEventClick(event); }

    render() {
        /**
        * Render the given events
        * @param {Array} events - list of events to render
        * @return {Components} - a list of li for each event
        */
        function renderEvents(events) {
            return events.map((event) => {
                let description = event.event_details
                                       .description.definition_short;
                let date = moment(event.event_details.dates.start);
                let time = date.format('HH:mm');
                return (
                    <li key={event._id}
                        className="event__list-item"
                        onClick={this.onEventClick.bind(this, event)}>
                        <div className="event__wrapper">
                            <div className="event__unique-name">{event.unique_name}</div>
                            <div className="event__time">{time}</div>
                            <div className="event__description">{description}</div>
                        </div>
                    </li>
                );
            });
        }

        return (
            <div>
            {
                this.orderEventsByDay(this.props.events).map(({ date, events }) => {
                    let dateStr = moment(date).format('dddd LL');
                    return (
                        <div key={dateStr}>
                            <div className="events-list__title">{dateStr}</div>
                            <ul className="events-list__list">{renderEvents.bind(this)(events)}</ul>
                        </div>
                    );
                })
            }
            </div>
        );
    }

    /**
    * Will produce an array of days, which contain the day date and
    * the associated events.
    * @param {Array} events - List of events
    */
    orderEventsByDay(events) {
        var days = {};
        events.forEach((event) => {
            let eventDate = moment(event.event_details.dates.start);
            let eventDay = eventDate.format('YYYY-MM-DD');
            if (!days[eventDay]) {
                days[eventDay] = [];
            }

            days[eventDay].push(event);
        });

        let sortable = [];
        for (let day in days) sortable.push({ date: day, events: days[day] });
        sortable.sort((a, b) => a[1] - b[1]);
        return sortable;
    }
}
