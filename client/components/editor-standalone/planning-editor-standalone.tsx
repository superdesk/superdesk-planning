import React, {RefObject} from 'react';
import {IAuthoringStorage} from 'superdesk-api';
import {BaseEditorStandalone} from './base-editor-standalone';
import {getStorageAdapter} from './storage-adapter';
import {AuthoringReact} from 'apps/authoring-react/authoring-react';

interface IProps {
    itemId: string;
    authoringStorage: IAuthoringStorage<IPlanningItem>;
    editorRef: RefObject<AuthoringReact<IPlanningItem>>;
}

export class PlanningEditorStandalone extends React.PureComponent<IProps> {
    render() {
        return (
            <BaseEditorStandalone
                editorRef={this.props.editorRef}
                entityType="planning"
                itemId={this.props.itemId}
                storageAdapter={getStorageAdapter('planning', ({storageAdapterPlanning}) => storageAdapterPlanning)}
                authoringStorage={this.props.authoringStorage}
            />
        );
    }
}
