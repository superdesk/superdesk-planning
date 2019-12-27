import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {FileInput} from './Form';
import {ToggleBox} from './index';

/**
 * @ngdoc react
 * @name FileReadOnlyList
 * @description Generic read-only file list
 */
const FileReadOnlyList = ({formProfile, item, field, createLink, files, noToggle}) => {
    if (field === 'files' && !get(formProfile, 'editor.files.enabled')) {
        return null;
    }


    let filesInput = []
    if (item[field]) {
        filesInput = Array.isArray(item[field]) ? item[field] : [item[field]]
    }
    
    const fileList = get(filesInput, 'length', 0) > 0 ?
        (<ul>
            {filesInput.map((file, index) => (
                <li key={index}>
                    <FileInput
                        value={file}
                        createLink={createLink}
                        readOnly={true}
                        files={files} />
                </li>
            ))}
        </ul>) :
        (<div className="sd-text__info">{gettext('No attached files added.')}</div>);

    if (noToggle) {
        return fileList;
    }

    return (
        <ToggleBox
            title={gettext('Attached Files')}
            isOpen={false}
            badgeValue={get(item, `${field}.length`, 0) > 0 ? item[field].length : null}>
            {fileList}
        </ToggleBox>);
};

FileReadOnlyList.propTypes = {
    formProfile: PropTypes.object,
    item: PropTypes.object,
    createLink: PropTypes.func,
    files: PropTypes.array,
    field: PropTypes.string,
    noToggle: PropTypes.bool,
};

FileReadOnlyList.defaultProps = {field: 'files'};

export default FileReadOnlyList;
