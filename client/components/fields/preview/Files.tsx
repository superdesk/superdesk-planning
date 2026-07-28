import * as React from 'react';
import {connect} from 'react-redux';

import {IFile, IListFieldProps} from '../../../interfaces';

import {FileReadOnlyList} from '../../UI';
import {getFileDownloadURL} from '../../../utils';
import * as selectors from '../../../selectors';

interface IProps extends IListFieldProps {
    files: {[key: string]: IFile};
    testId?: string;
    noToggle?: boolean; // set when rendered inside a toggle box group
}

const mapStateToProps = (state) => ({
    files: selectors.general.files(state),
});

const PreviewFieldFilesComponent: React.FunctionComponent<IProps> = (props) => (
    <FileReadOnlyList
        testId={props.testId}
        formProfile={props.profile}
        files={props.files}
        item={props.item}
        createLink={getFileDownloadURL}
        noToggle={props.noToggle ?? false}
    />
);

export const PreviewFieldFiles = connect(mapStateToProps)(PreviewFieldFilesComponent);
