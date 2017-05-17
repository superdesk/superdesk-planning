import React from 'react'
import moment from 'moment'
import { EventItem } from '../index'
import { InfiniteLoader, List, AutoSizer } from 'react-virtualized'
import { LIST_ITEM_HEIGHT, EVENT_LIST_DAY_HEADER_HEIGHT } from '../../constants'

import './style.scss'

export class EventsList extends React.Component {

    constructor(props) {
        super(props)
        this.state = { isNextPageLoading: false }
    }
    onEventClick(event) { this.props.onEventClick(event) }
    onEventDelete(event) { this.props.onEventDelete(event) }

    getRowHeight({ index }) {
        const { events } = this.props
        return events[index].events.length * LIST_ITEM_HEIGHT + EVENT_LIST_DAY_HEADER_HEIGHT
    }

    isRowLoaded({ index }) {
        const { events } = this.props
        return index <= events.length
    }

    loadMoreRows() {
        const { loadMoreEvents } = this.props
        const { isNextPageLoading } = this.state
        if (isNextPageLoading) {
            Promise.resolve()
        } else {
            this.setState({ isNextPageLoading: true })
            return loadMoreEvents()
            .then(() => {this.setState({ isNextPageLoading: false })})
        }
    }

    rowRenderer({ index, key, style }) {
        const { date, events } = this.props.events[index]
        const dateStr = moment(date).format('dddd LL')
        return (
            <div className="events-list__group" key={key} style={style}>
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
    }

    render() {
        const { events } = this.props
        return (
            <div className="events-list">
                <InfiniteLoader
                    isRowLoaded={this.isRowLoaded.bind(this)}
                    loadMoreRows={this.loadMoreRows.bind(this)}
                    rowCount={events.length + 20}
                >
                    {({ onRowsRendered, registerChild }) => (
                        <AutoSizer>
                            {({ height, width }) => (
                                <List
                                    ref={registerChild}
                                    onRowsRendered={onRowsRendered}
                                    rowRenderer={this.rowRenderer.bind(this)}
                                    height={height}
                                    width={width}
                                    events={events}
                                    rowCount={events.length}
                                    rowHeight={this.getRowHeight.bind(this)}
                                />
                            )}
                        </AutoSizer>
                    )}
                </InfiniteLoader>
            { !this.props.events || this.props.events.length === 0 &&
                <p className="events-list__empty-msg">There is no event yet</p>
            }
            </div>
        )
    }
}

EventsList.propTypes = {
    onEventClick: React.PropTypes.func,
    events: React.PropTypes.array.isRequired,
    onEventDelete: React.PropTypes.func,
    selectedEvent: React.PropTypes.string,
    loadMoreEvents: React.PropTypes.func.isRequired,
}
