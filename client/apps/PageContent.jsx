import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import {WorkqueueContainer, ModalsContainer} from '../components';

import './style.scss';

export class PageContent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {filtersOpen: false};
        this.toggleFilterPanel = this.toggleFilterPanel.bind(this);
    }

    toggleFilterPanel() {
        this.setState({filtersOpen: !this.state.filtersOpen});
    }

    render() {
        const {
            marginBottom,
            SubNavPanel,
            FilterPanel,
            ListPanel,
            PreviewPanel,
            EditorPanel,
            editorOpen,
            fullPreviewOpen,
            previewOpen,
            showModals,
            showWorkqueue,
            widePreviewPanel,
            splitView,
            fullPreview,
        } = this.props;

        const mountEditorInMainPage = EditorPanel && !fullPreviewOpen;
        const sectionClassName = classNames(
            'sd-content',
            {
                'sd-page-content--slide-in': !splitView,
                'sd-page-content--split': splitView,
                'sd-content--margin-b30': marginBottom,
                'sd-page-content--slide-in--open': mountEditorInMainPage && editorOpen,
            }
        );

        const mainClassName = classNames(
            'sd-page-content__content-block',
            'sd-page-content__content-block--main',
            {
                'open-filters': this.state.filtersOpen,
                'open-preview': previewOpen,
            }
        );

        const previewClassName = classNames(
            'sd-preview-panel',
            {'sd-preview-panel--width-560px': widePreviewPanel}
        );

        const slideInClassName = classNames(
            'sd-edit-panel',
            'sd-page-content__content-block',
            'sd-page-content__content-block--right',
            'sd-page-content__content-block--30-slide'
        );

        return (
            <div className={sectionClassName}>
                <div className={mainClassName}>
                    {SubNavPanel && (
                        <SubNavPanel
                            filtersOpen={this.state.filtersOpen}
                            toggleFilterPanel={this.toggleFilterPanel}
                        />
                    )}

                    <div className="sd-column-box--3">
                        {FilterPanel && (
                            <div className="sd-filters-panel">
                                <FilterPanel
                                    toggleFilterPanel={this.toggleFilterPanel}
                                />
                            </div>
                        )}

                        {ListPanel && (
                            <div className="sd-column-box__main-column sd-column-box__main-column__listpanel">
                                <ListPanel
                                    previewOpen={previewOpen}
                                    toggleFilterPanel={this.toggleFilterPanel}
                                />
                            </div>
                        )}

                        {!fullPreview && PreviewPanel && (
                            <div className={previewClassName}>
                                <PreviewPanel />
                            </div>
                        )}
                    </div>
                </div>
                { mountEditorInMainPage && (
                    <div className={slideInClassName}>
                        <EditorPanel
                            toggleFilterPanel={this.toggleFilterPanel}
                        />
                    </div>
                )}
                {fullPreview && PreviewPanel && (
                    <div className={slideInClassName}>
                        <PreviewPanel />
                    </div>
                )}
                {showModals && <ModalsContainer />}
                {showWorkqueue && <WorkqueueContainer />}
            </div>
        );
    }
}

PageContent.propTypes = {
    marginBottom: PropTypes.bool,
    editorOpen: PropTypes.bool,
    previewOpen: PropTypes.bool,
    SubNavPanel: PropTypes.func,
    EditorPanel: PropTypes.func,
    FilterPanel: PropTypes.func,
    ListPanel: PropTypes.func,
    PreviewPanel: PropTypes.func,
    widePreviewPanel: PropTypes.bool,
    showModals: PropTypes.bool,
    showWorkqueue: PropTypes.bool,
    splitView: PropTypes.bool,
    fullPreview: PropTypes.bool,
    fullPreviewOpen: PropTypes.bool,
};

PageContent.defaultProps = {
    marginBottom: true,
    editorOpen: false,
    previewOpen: false,
    showModals: true,
    showWorkqueue: true,
    widePreviewPanel: false,
    splitView: false,
    fullPreview: false,
    fullPreviewOpen: false,
};
