import React, {RefObject} from 'react';
import {IAuthoringStorage} from 'superdesk-api';
import {BaseEditorComponent, BaseEditorStandalone} from './base-editor-standalone';
import {getStorageAdapter} from './storage-adapter';

interface IProps {
    itemId: string;
    authoringStorage: IAuthoringStorage<IPlanningItem>;
}

export class PlanningEditorStandalone extends React.PureComponent<IProps> {
    editorRef: RefObject<BaseEditorComponent<IPlanningItem>>;

    constructor(props: IProps) {
        super(props);

        this.editorRef = React.createRef();
    }

    render() {
        return (
            <BaseEditorStandalone
                ref={this.editorRef}
                entityType="planning"
                itemId={this.props.itemId}
                storageAdapter={getStorageAdapter('planning', ({storageAdapterPlanning}) => storageAdapterPlanning)}
                authoringStorage={this.props.authoringStorage}
            />
        );
    }
}
