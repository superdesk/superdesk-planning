import * as React from 'react';
import {connect} from 'react-redux';
import classNames from 'classnames';

import {BOOKMARK_TYPE, EDITOR_TYPE, IEditorBookmark, IEventOrPlanningItem, IPlanningAppState} from '../../interfaces';
import {planningApi, superdeskApi} from '../../superdeskApi';

import {editorSelectors} from '../../selectors/editors';

import {Button, ButtonGroup} from 'superdesk-ui-framework/react';
import {BookmarkDivider, FormGroupBookmark} from './bookmarks';
import {RelatedPlanningListItem} from '../RelatedPlannings/PlanningMetaData/RelatedPlanningListItem';
import {RelatedEventListItem} from '../Events/EventMetadata/RelatedEventListItem';

interface IProps {
    bookmarks?: Array<IEditorBookmark>;
    activeBookmarkId?: IEditorBookmark['id'];
    editorType: EDITOR_TYPE;
    item?: DeepPartial<IEventOrPlanningItem>;
}

const mapStateToProps = (state: IPlanningAppState, props: IProps) => ({
    bookmarks: editorSelectors[props.editorType].getEditorBookmarksSorted(state),
    activeBookmarkId: editorSelectors[props.editorType].getActiveBookmarkId(state),
    item: editorSelectors[props.editorType].getEditorDiff(state),
});

class EditorBookmarksBarComponent extends React.PureComponent<IProps> {
    renderHeader() {
        if (this.props.editorType !== EDITOR_TYPE.POPUP) {
            return null;
        }

        return this.props.item.type === 'planning' ? (
            <RelatedPlanningListItem
                item={this.props.item}
                showIcon={true}
                shadow={1}
            />
        ) : (
            <RelatedEventListItem
                item={this.props.item}
                showIcon={true}
                shadow={1}
            />
        );
    }

    renderFooter() {
        const editor = planningApi.editor(this.props.editorType);

        if (editor.form.isReadOnly() ||
            this.props.editorType !== EDITOR_TYPE.POPUP ||
            this.props.item.type !== 'event'
        ) {
            return null;
        }

        const {gettext} = superdeskApi.localization;

        return (
            <div className="sd-shadow--z3 sd-padding--2">
                <Button
                    text={gettext('Create Planning')}
                    style="hollow"
                    type="primary"
                    expand={true}
                    onClick={editor.item.events.addPlanningItem}
                />
            </div>
        );
    }

    render() {
        if (this.props.item._id == null) {
            return null;
        }

        const readOnly = planningApi.editor(this.props.editorType).form.isReadOnly();

        return (
            <div
                data-test-id="editor--bookmarks"
                style={{display: 'contents'}}
            >
                {this.renderHeader()}
                <div
                    className={classNames(
                        'editor-bookmarks',
                        {'editor-bookmarks--popup': this.props.editorType === EDITOR_TYPE.POPUP}
                    )}
                >
                    <ButtonGroup orientation="vertical">
                        {this.props.bookmarks.map((bookmark, index) => {
                            if (bookmark.type === BOOKMARK_TYPE.divider) {
                                return (
                                    <BookmarkDivider
                                        key={bookmark.id}
                                        bookmark={bookmark}
                                        active={this.props.activeBookmarkId === bookmark.id}
                                        editorType={this.props.editorType}
                                        index={index}
                                        item={this.props.item}
                                        readOnly={readOnly}
                                    />
                                );
                            } else if (bookmark.type === BOOKMARK_TYPE.formGroup) {
                                return (
                                    <FormGroupBookmark
                                        key={bookmark.id}
                                        bookmark={bookmark}
                                        active={this.props.activeBookmarkId === bookmark.id}
                                        editorType={this.props.editorType}
                                        index={index}
                                        item={this.props.item}
                                        readOnly={readOnly}
                                    />
                                );
                            } else if (bookmark.type === BOOKMARK_TYPE.custom) {
                                const Component = bookmark.component;

                                return (
                                    <Component
                                        key={bookmark.id}
                                        bookmark={bookmark}
                                        active={this.props.activeBookmarkId === bookmark.id}
                                        editorType={this.props.editorType}
                                        index={index}
                                        item={this.props.item}
                                        readOnly={readOnly}
                                    />
                                );
                            }

                            return null;
                        })}
                    </ButtonGroup>
                </div>
                {this.renderFooter()}
            </div>
        );
    }
}

export const EditorBookmarksBar = connect(mapStateToProps)(EditorBookmarksBarComponent);
