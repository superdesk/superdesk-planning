import React from 'react';
import {get} from 'lodash';

import {FileInput} from './Form';
import {ToggleBox} from './index';

import {superdeskApi} from '../../superdeskApi';
import {
    IEventFormProfile,
    IFile,
    IPlanningFormProfile,
    ICoverageFormProfile,
    IEventItem,
    IPlanningItem,
    IPlanningCoverageItem,
} from '../../interfaces';

interface IProps {
    formProfile?: IEventFormProfile | IPlanningFormProfile | ICoverageFormProfile;
    item: IEventItem | IPlanningItem | IPlanningCoverageItem;
    createLink(file: IFile): string;
    files: {[key: string]: IFile};
    field?: string;
    noToggle: boolean;
}

export default class FileReadOnlyList extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const {
            formProfile,
            item,
            field = 'files',
            createLink,
            files,
            noToggle,
        } = this.props;

        if (field === 'files' && !get(formProfile, 'editor.files.enabled')) {
            return null;
        }


        let filesInput = [];

        if (item[field]) {
            filesInput = Array.isArray(item[field]) ? item[field] : [item[field]];
        }

        const fileList = get(filesInput, 'length', 0) > 0 ?
            (
                <ul>
                    {filesInput.map((file, index) => (
                        <li key={index}>
                            <FileInput
                                value={file}
                                createLink={createLink}
                                readOnly={true}
                                files={files}
                            />
                        </li>
                    ))}
                </ul>
            ) :
            (<div className="sd-text__info">{gettext('No attached files added.')}</div>);

        if (noToggle) {
            return fileList;
        }

        return (
            <ToggleBox
                title={gettext('Attached Files')}
                isOpen={false}
                badgeValue={get(item, `${field}.length`, 0) > 0 ? item[field].length : null}
            >
                {fileList}
            </ToggleBox>
        );
    }
}
