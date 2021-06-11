import React from 'react';
import PropTypes from 'prop-types';

import {superdeskApi} from '../../superdeskApi';

import {PageContent} from '../PageContent';
import {AssignmentList} from './AssignmentList';
import {AssignmentPreview} from './AssignmentPreview';
import {AssignmentsSubNav} from './AssignmentsSubNav';

export const AssignmentsUi = ({previewOpen, showModals, showWorkqueue, marginBottom}) => (
    <PageContent
        ariaTitle={superdeskApi.localization.gettext('Assignments Content')}
        showWorkqueue={false}
        widePreviewPanel={true}
        splitView={true}

        previewOpen={previewOpen}
        ListPanel={AssignmentList}
        listProps={{saveSortPreferences: true}}
        PreviewPanel={AssignmentPreview}
        SubNavPanel={AssignmentsSubNav}
        subNavProps={{saveSortPreferences: true}}
    />
);

AssignmentsUi.propTypes = {
    previewOpen: PropTypes.bool,
    showModals: PropTypes.bool,
    showWorkqueue: PropTypes.bool,
    marginBottom: PropTypes.bool,
};

AssignmentsUi.defaultProps = {
    showModals: true,
    showWorkqueue: false,
    marginBottom: true,
};
