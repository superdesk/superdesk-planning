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
            previewOpen,
            showModals,
            showWorkqueue,
        } = this.props;

        const sectionClassName = classNames(
            'sd-content',
            'sd-page-content--slide-in',
            {
                'sd-content--margin-b30': marginBottom,
                'sd-page-content--slide-in--open': editorOpen,
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

        const editorClassName = classNames(
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

                        {PreviewPanel && (
                            <div className="sd-preview-panel">
                                <PreviewPanel />
                            </div>
                        )}
                    </div>
                </div>
                {EditorPanel && (
                    <div className={editorClassName}>
                        <EditorPanel
                            toggleFilterPanel={this.toggleFilterPanel}
                        />
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
    showModals: PropTypes.bool,
    showWorkqueue: PropTypes.bool,
};

PageContent.defaultProps = {
    marginBottom: true,
    editorOpen: false,
    previewOpen: false,
    showModals: true,
    showWorkqueue: true
};
