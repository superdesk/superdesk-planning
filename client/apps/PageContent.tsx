import React from 'react';
import classNames from 'classnames';

import {WorkqueueContainer, ModalsContainer} from '../components';
import {PopupEditorPortal} from '../components/Main/ItemEditorModal';

import './style.scss';

export interface IBasePanelProps {
    toggleFilterPanel(): void;
}

export interface ISubNavPanelProps extends IBasePanelProps {
    filtersOpen: boolean;
}

export interface IListPanelProps extends IBasePanelProps {
    previewOpen: boolean;
}

interface IProps<SubnavProps = {}, EditorProps = {}, FilterProps = {}, ListProps = {}, PreviewProps = {}> {
    SubNavPanel?: React.ComponentType<ISubNavPanelProps & SubnavProps>;
    subNavProps?: SubnavProps;

    EditorPanel?: React.ComponentType<IBasePanelProps & EditorProps>;
    editorProps?: EditorProps;

    FilterPanel?: React.ComponentType<IBasePanelProps & FilterProps>;
    filterProps?: FilterProps;

    ListPanel?: React.ComponentType<IListPanelProps & ListProps>;
    listProps?: ListProps;

    PreviewPanel?: React.ComponentType<PreviewProps>;
    previewProps?: PreviewProps;

    marginBottom?: boolean; // defaults to true
    editorOpen?: boolean;
    previewOpen?: boolean;
    widePreviewPanel?: boolean;
    showModals?: boolean; // defaults to true
    showWorkqueue?: boolean; // defaults to true
    splitView?: boolean;
    fullPreview?: boolean;
    fullPreviewOpen?: boolean;

    ariaTitle: string;
}

interface IState {
    filtersOpen: boolean;
}

export class PageContent<T> extends React.Component<IProps<T>, IState> {
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
                'sd-content--margin-b30': marginBottom ?? true,
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
                <div className={mainClassName} aria-labelledby="planning-heading">
                    <h2 id="planning-heading" className="a11y-only">
                        {this.props.ariaTitle}
                    </h2>
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
                {mountEditorInMainPage && (
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
                {!(showModals ?? true) ? null : (
                    <ModalsContainer />
                )}
                {!(showWorkqueue ?? true) ? null : (
                    <WorkqueueContainer />
                )}

                <PopupEditorPortal />
            </div>
        );
    }
}
