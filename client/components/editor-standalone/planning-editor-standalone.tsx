import React from 'react';
import {IAuthoringStorage} from 'superdesk-api';
import {BaseEditorStandalone} from './base-editor-standalone';
import {getStorageAdapter} from './storage-adapter';

interface IProps {
    itemId: string;
    authoringStorage: IAuthoringStorage<IPlanningItem>;
}

export class PlanningEditorStandalone extends React.PureComponent<IProps> {
    render() {
        return (
            <BaseEditorStandalone
                entityType="planning"
                itemId={this.props.itemId}
                storageAdapter={getStorageAdapter('planning', ({storageAdapterPlanning}) => storageAdapterPlanning)}
                authoringStorage={this.props.authoringStorage}
            />
        );
    }
}
