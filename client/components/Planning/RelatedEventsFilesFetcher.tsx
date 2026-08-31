import React from 'react';
import {isEqual} from 'lodash';

import {IEventItem} from '../../interfaces';

interface IProps {
    events: Array<IEventItem>;
    fetchEventFiles(event: IEventItem): void;
    children: React.ReactNode;
}

/**
 * Live event updates can add attachments whose file resources are not in the store yet,
 * leaving their rows in the preview without name and size. Fetch the resources whenever an
 * event's file list changes (`fetchEventFiles` is a no-op for files already in the store).
 */
export class RelatedEventsFilesFetcher extends React.PureComponent<IProps> {
    componentDidMount() {
        this.props.events.forEach((event) => this.props.fetchEventFiles(event));
    }

    componentDidUpdate(prevProps: Readonly<IProps>) {
        this.props.events.forEach((event) => {
            const previous = prevProps.events.find(({_id}) => _id === event._id);

            if (!isEqual(previous?.files, event.files)) {
                this.props.fetchEventFiles(event);
            }
        });
    }

    render() {
        return this.props.children;
    }
}
