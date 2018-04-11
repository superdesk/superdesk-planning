import React from 'react';
import PropTypes from 'prop-types';

import {PageContent} from '../PageContent';
import {PlanningSubNav} from './PlanningSubNav';
import {SearchPanel, Editor, PreviewPanel} from '../../components/Main';
import {PlanningList} from './PlanningList';

export const PlanningUi = ({
    editorInModal,
    editorOpen,
    previewOpen,
}) => (
    <PageContent
        editorInModal={editorInModal}
        editorOpen={editorOpen}
        previewOpen={previewOpen}
        SubNavPanel={PlanningSubNav}
        FilterPanel={SearchPanel}
        ListPanel={PlanningList}
        PreviewPanel={PreviewPanel}
        EditorPanel={Editor}
    />
);

PlanningUi.propTypes = {
    editorInModal: PropTypes.editorInModal,
    editorOpen: PropTypes.bool,
    previewOpen: PropTypes.bool,
};

