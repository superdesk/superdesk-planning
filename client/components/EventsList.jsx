import React from 'react';
import moment from 'moment';

export class EventsList extends React.Component {
    constructor(props) {
        super(props);
        var days = {};
        props.events.forEach(function(event) {
            let eventDate = moment(event.event_details.dates.start);
            let eventDay = eventDate.format('YYYY-MM-DD');
            if (!days[eventDay]) {
                days[eventDay] = [];
            }

            days[eventDay].push(event);
        });

        let sortable = [];
        for (let day in days)
        sortable.push([day, days[day]]);
        sortable.sort(
            function(a, b) {
                return a[1] - b[1];
            }
        );
        this.state = {
            days: sortable,
            events: props.events
        };
    }

    render() {
        function renderEvents(events) {
            return events.map(function(event) {
                let description = event.event_details
                                       .description.definition_short;
                let date = moment(event.event_details.dates.start);
                let time = date.format('HH:mm');
                return (
                    <li key={event._id} className="event__list-item">
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
                this.state.days.map(function([day, events]) {
                    let date = moment(day).format('dddd LL');
                    return (
                        <div>
                            <div className="events-list__title">{date}</div>
                            <ul className="events-list__list">{renderEvents(events)}</ul>
                        </div>
                    );
                })
            }
            </div>
        );
    }
}
