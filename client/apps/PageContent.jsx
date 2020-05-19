import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import {WorkqueueContainer, ModalsContainer} from '../components';
import {PopupEditorPortal} from '../components/Main/ItemEditorModal';

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
            subNavProps,
            FilterPanel,
            filterProps,
            ListPanel,
            listProps,
            PreviewPanel,
            previewProps,
            EditorPanel,
            editorOpen,
            fullPreviewOpen,
            previewOpen,
            showModals,
            showWorkqueue,
            widePreviewPanel,
            splitView,
            fullPreview,
            editorProps,
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
                            {...subNavProps}
                        />
                    )}

                    <div className="sd-column-box--3">
                        {FilterPanel && (
                            <div className="sd-filters-panel sd-filters-panel--fixed">
                                <FilterPanel
                                    toggleFilterPanel={this.toggleFilterPanel}
                                    {...filterProps}
                                />
                            </div>
                        )}

                        {ListPanel && (
                            <div className="sd-column-box__main-column sd-column-box__main-column__listpanel">
                                <ListPanel
                                    previewOpen={previewOpen}
                                    toggleFilterPanel={this.toggleFilterPanel}
                                    {...listProps}
                                />
                            </div>
                        )}

                        {!fullPreview && PreviewPanel && (
                            <div className={previewClassName}>
                                <PreviewPanel
                                    {...previewProps}
                                />
                            </div>
                        )}
                    </div>
                </div>
                { mountEditorInMainPage && (
                    <div className={slideInClassName}>
                        <EditorPanel
                            toggleFilterPanel={this.toggleFilterPanel}
                            {...editorProps}
                        />
                    </div>
                )}
                {fullPreview && PreviewPanel && (
                    <div className={slideInClassName}>
                        <PreviewPanel
                            {...previewProps}
                        />
                    </div>
                )}
                {showModals && <ModalsContainer />}
                {showWorkqueue && <WorkqueueContainer />}

                <PopupEditorPortal />
            </div>
        );
    }
}

PageContent.propTypes = {
    marginBottom: PropTypes.bool,
    editorOpen: PropTypes.bool,
    previewOpen: PropTypes.bool,
    SubNavPanel: PropTypes.func,
    subNavProps: PropTypes.object,
    EditorPanel: PropTypes.func,
    editorProps: PropTypes.object,
    FilterPanel: PropTypes.func,
    filterProps: PropTypes.object,
    ListPanel: PropTypes.func,
    listProps: PropTypes.object,
    PreviewPanel: PropTypes.func,
    previewProps: PropTypes.object,
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
