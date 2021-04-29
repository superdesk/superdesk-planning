import * as React from 'react';
import {get} from 'lodash';

import {
    ICoverageScheduledUpdate,
    IEditorFieldProps,
    IEventItem, IFile,
    IG2ContentType,
    IPlanningCoverageItem,
    IPlanningItem
} from '../../../interfaces';
import {IArticle} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';

import {CoverageArrayInput, CoverageEditor} from '../../Coverages';
import {getFileDownloadURL} from '../../../utils';

interface IProps extends IEditorFieldProps {
    item: IPlanningItem;
    addButtonText?: string; // defaults to 'Add a coverage'
    addNewsItemToPlanning?: IArticle;
    useLocalNavigation?: boolean;
    navigation?: any;
    maxCoverageCount?: number;
    addOnly?: boolean;
    originalCount?: number;
    message: string | {[key: string]: any};
    event?: IEventItem;
    preferredCoverageDesks: {[key: string]: string};

    popupContainer?(): HTMLElement;
    onPopupOpen?(): void;
    onPopupClose?(): void;
    setCoverageDefaultDesk(coverage: IPlanningCoverageItem): void;
    setCoverageAddAdvancedMode(enabled: boolean): Promise<void>;
    onDuplicateCoverage(coverage: IPlanningCoverageItem, duplicateAs: IG2ContentType['qcode']): void;
    onCancelCoverage(
        coverage: IPlanningCoverageItem,
        index: number,
        scheduledUpdate?: ICoverageScheduledUpdate,
        scheduledUpdateIndex?: number,
    ): void;
    onAddCoverageToWorkflow(coverage: IPlanningCoverageItem, index: number): void;
    onAddScheduledUpdateToWorkflow(
        coverage: IPlanningCoverageItem,
        index: number,
        scheduledUpdate?: ICoverageScheduledUpdate,
        scheduledUpdateIndex?: number
    ): void;
    onRemoveAssignment(
        coverage: IPlanningCoverageItem,
        index: number,
        scheduledUpdate?: ICoverageScheduledUpdate,
        scheduledUpdateIndex?: number
    ): void;
    uploadFiles(files: Array<Array<File>>): Promise<Array<IFile>>;
    notifyValidationErrors(errors: Array<string>): void;
    getRef?(field: string, value: IPlanningCoverageItem): React.RefObject<CoverageEditor>;
}

export class EditorFieldCoverages extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'coverages';
        const value = get(this.props.item, field, this.props.defaultValue);

        return (
            <CoverageArrayInput
                {...this.props}
                field={this.props.field ?? 'coverages'}
                value={value}
                addButtonText={this.props.addButtonText ?? gettext('Add a coverage')}
                createUploadLink={getFileDownloadURL}
            />
        );
    }
}
