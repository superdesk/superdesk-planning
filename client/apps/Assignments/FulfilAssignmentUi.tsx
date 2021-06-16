import React from 'react';
import PropTypes from 'prop-types';

import {superdeskApi} from '../../superdeskApi';

import {PageContent} from '../PageContent';
import {AssignmentList} from './AssignmentList';
import {AssignmentPreview} from './AssignmentPreview';
import {AssignmentsSubNav} from './AssignmentsSubNav';

export const FulfilAssignmentUi = ({previewOpen, newsItem}) => (
    <PageContent
        ariaTitle={superdeskApi.localization.gettext('Assignments Content')}
        showModals={false}
        showWorkqueue={false}
        marginBottom={false}
        widePreviewPanel={true}

        SubNavPanel={AssignmentsSubNav}
        subNavProps={{
            archiveItem: newsItem,
            withArchiveItem: true,
            showAllDeskOption: true,
            saveSortPreferences: false,
            ignoreScheduledUpdates: true,
        }}

        ListPanel={AssignmentList}
        listProps={{
            hideItemActions: true,
            saveSortPreferences: false,
        }}

        editorOpen={previewOpen}
        EditorPanel={AssignmentPreview}
        editorProps={{
            hideItemActions: true,
            showFulfilAssignment: true,
        }}
    />
);

FulfilAssignmentUi.propTypes = {
    previewOpen: PropTypes.bool,
    newsItem: PropTypes.object,
};
