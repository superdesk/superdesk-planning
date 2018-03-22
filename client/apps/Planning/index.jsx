import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import * as selectors from '../../selectors';

import {PageContent} from '../PageContent';
import {PlanningSubNav} from './PlanningSubNav';
import {SearchPanel, Editor, PreviewPanel} from '../../components/Main';
import {PlanningList} from './PlanningList';

export const PlanningAppComponent = ({
    editorOpen,
    previewOpen,
    marginBottom,
    addNewsItemToPlanning,
    showModals,
    showWorkqueue,
}) => (
    <PageContent
        editorOpen={editorOpen}
        previewOpen={previewOpen}
        marginBottom={marginBottom}
        SubNavPanel={PlanningSubNav}
        FilterPanel={SearchPanel}
        ListPanel={PlanningList}
        showModals={showModals}
        showWorkqueue={showWorkqueue}
        PreviewPanel={PreviewPanel}

        // Anonymous functional component so we can parse addNewsItemToPlanning here
        // This is temporary so AddToPlanning isn't broken
        // This will be moved when we create the AddToPlanning app
        EditorPanel={(editorProps) => (
            <Editor
                {...editorProps}
                addNewsItemToPlanning={addNewsItemToPlanning}
            />
        )}
    />
);

PlanningAppComponent.propTypes = {
    editorOpen: PropTypes.bool,
    previewOpen: PropTypes.bool,
    marginBottom: PropTypes.bool,
    addNewsItemToPlanning: PropTypes.object,
    showModals: PropTypes.bool,
    showWorkqueue: PropTypes.bool,
};

PlanningAppComponent.defaultProps = {
    marginBottom: true,
    showModals: true,
    showWorkqueue: true,
};

const mapStateToProps = (state) => ({
    editorOpen: !!selectors.forms.currentItemType(state),
    previewOpen: !!selectors.main.previewType(state),
});

export const PlanningApp = connect(mapStateToProps)(PlanningAppComponent);
