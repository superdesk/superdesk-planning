import React from 'react';
import {IAuthoringStorage} from 'superdesk-api';
import {BaseEditorStandalone} from './base-editor-standalone';
import {getStorageAdapter} from './storage-adapter';

interface IProps {
    itemId: string;
    authoringStorage: IAuthoringStorage<IEventItem>;
}

export class EventEditorStandalone extends React.PureComponent<IProps> {
    render() {
        return (
            <BaseEditorStandalone
                entityType="event"
                itemId={this.props.itemId}
                storageAdapter={getStorageAdapter('event', ({storageAdapterEvent}) => storageAdapterEvent)}
                authoringStorage={this.props.authoringStorage}
            />
        );
    }
}
