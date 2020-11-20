import React from 'react';

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

import {FileInput} from './Form';
import {ToggleBox} from './index';

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

        if (field === 'files' && formProfile?.editor?.files?.enabled !== true) {
            return null;
        }

        let filesInput = [];

        if (item?.[field] != null) {
            filesInput = Array.isArray(item[field]) ?
                item[field] :
                [item[field]];
        }

        const fileList = filesInput.length > 0 ?
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
            (
                <div className="sd-text__info">
                    {gettext('No attached files added.')}
                </div>
            );

        if (noToggle === true) {
            return fileList;
        }

        return (
            <ToggleBox
                title={gettext('Attached Files')}
                isOpen={false}
                badgeValue={(item?.[field]?.length ?? 0) > 0 ?
                    item[field].length :
                    null
                }
            >
                {fileList}
            </ToggleBox>
        );
    }
}
