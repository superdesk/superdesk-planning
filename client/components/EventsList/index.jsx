import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {EventItem} from '../index';
import {InfiniteLoader, List, AutoSizer} from 'react-virtualized';
import {LIST_ITEM_1_LINE_HEIGHT, EVENT_LIST_DAY_HEADER_HEIGHT} from '../../constants';
import './style.scss';

export class EventsList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {isNextPageLoading: false};
    }

    onClick(event) {
        this.props.onClick(event);
    }
    onDoubleClick(event) {
        this.props.onDoubleClick(event);
    }
    onEventSpike(event) {
        this.props.onEventSpike(event);
    }
    onEventUnspike(event) {
        this.props.onEventUnspike(event);
    }
    onEventDuplicate(event) {
        this.props.onEventDuplicate(event);
    }
    onCancelEvent(event) {
        this.props.onCancelEvent(event);
    }
    onEventUpdateTime(event) {
        this.props.onEventUpdateTime(event);
    }
    onRescheduleEvent(event) {
        this.props.onRescheduleEvent(event);
    }
    onPostponeEvent(event) {
        this.props.onPostponeEvent(event);
    }
    onConvertToRecurringEvent(event) {
        this.props.onConvertToRecurringEvent(event);
    }

    getRowHeight({index}) {
        const event = this.props.events[index];
        const isFirst = !!event.date;
        const isLast = this.props.events.length === index + 1;
        let height = LIST_ITEM_1_LINE_HEIGHT;
        // space to display the day date

        if (isFirst) {
            height += EVENT_LIST_DAY_HEADER_HEIGHT;
        }
        // margin to display the shadow at the bottom
        if (isLast) {
            height += 3;
        }
        return height;
    }

    isRowLoaded({index}) {
        return index <= this.props.events.length;
    }

    loadMoreRows() {
        const {loadMoreEvents} = this.props;
        const {isNextPageLoading} = this.state;

        if (isNextPageLoading) {
            Promise.resolve();
        } else {
            this.setState({isNextPageLoading: true});
            return loadMoreEvents()
                .then(() => {
                    this.setState({isNextPageLoading: false});
                });
        }
    }

    rowRenderer({index, key, style}) {
        const {lockedItems} = this.props;
        const {event, date} = this.props.events[index];
        const isFirst = !!date;

        return (
            <div key={key} style={style} className="events-list__group">
                {isFirst &&
                    <div className="events-list__title">{moment(date).format('dddd LL')}</div>
                }
                <EventItem event={event}
                    key={event._id}
                    onClick={this.props.onClick}
                    onDoubleClick={this.props.onDoubleClick}
                    onSpikeEvent={this.onEventSpike.bind(this, event)}
                    onUnspikeEvent={this.onEventUnspike.bind(this, event)}
                    onDuplicateEvent={this.onEventDuplicate.bind(this, event)}
                    onCancelEvent={this.onCancelEvent.bind(this, event)}
                    onUpdateEventTime={this.onEventUpdateTime.bind(this, event)}
                    onRescheduleEvent={this.onRescheduleEvent.bind(this, event)}
                    onPostponeEvent={this.onPostponeEvent.bind(this, event)}
                    onConvertToRecurringEvent={this.onConvertToRecurringEvent.bind(this)}
                    highlightedEvent={this.props.highlightedEvent}
                    isSelected={this.props.selectedEvents.indexOf(event._id) > -1}
                    onSelectChange={(value) => this.props.onEventSelectChange({
                        event: event._id,
                        value: value,
                    })}
                    privileges={this.props.privileges}
                    lockedItems={lockedItems}
                    addEventToCurrentAgenda={this.props.addEventToCurrentAgenda}
                    session={this.props.session} />
            </div>
        );
    }

    render() {
        const {events} = this.props;

        return (
            <div className="events-list">
                <InfiniteLoader
                    isRowLoaded={this.isRowLoaded.bind(this)}
                    loadMoreRows={this.loadMoreRows.bind(this)}
                    rowCount={events.length + 20}
                >
                    {({onRowsRendered, registerChild}) => (
                        <AutoSizer>
                            {({height, width}) => (
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
                { !events || events.length === 0 &&
                <p className="events-list__empty-msg">There is no event yet</p>
                }
            </div>
        );
    }
}

EventsList.propTypes = {
    onClick: PropTypes.func,
    onDoubleClick: PropTypes.func,
    events: PropTypes.array.isRequired,
    onEventSpike: PropTypes.func,
    onEventUnspike: PropTypes.func,
    onEventDuplicate: PropTypes.func,
    onCancelEvent: PropTypes.func,
    onEventUpdateTime: PropTypes.func,
    onRescheduleEvent: PropTypes.func,
    onPostponeEvent: PropTypes.func,
    onConvertToRecurringEvent: PropTypes.func,
    highlightedEvent: PropTypes.string,
    loadMoreEvents: PropTypes.func.isRequired,
    privileges: PropTypes.object,
    selectedEvents: PropTypes.array.isRequired,
    onEventSelectChange: PropTypes.func.isRequired,
    session: PropTypes.object,
    addEventToCurrentAgenda: PropTypes.func,
    lockedItems: PropTypes.object,
};
