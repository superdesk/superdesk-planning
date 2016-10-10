import React from 'react';
import ReactDOM from 'react-dom';

EventsListDirectiveController.$inject = ['$element'];
export function EventsListDirectiveController($element) {
    let events = [{ id: 1, title: 'qwe' }, { id: 2, title: 'ert' }];
    ReactDOM.render(<EventsList events={events} />, $element.get(0));
}

class EventsList extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <ul>
            {
                this.props.events.map(function(event) {
                    return <li key={event.id}>{event.title}</li>;
                })
            }
            </ul>
        );
    }
}
