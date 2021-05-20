import * as React from 'react';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';
import classNames from 'classnames';

import {EDITOR_TYPE, IBookmarkProps, IEditorBookmarkGroup} from '../../../interfaces';
import {planningApi} from '../../../superdeskApi';

import {Icon} from 'superdesk-ui-framework/react';

interface IProps extends IBookmarkProps {
    bookmark: IEditorBookmarkGroup;
}

export class FormGroupBookmark extends React.PureComponent<IProps> {
    constructor(props) {
        super(props);

        this.onClicked = this.onClicked.bind(this);
    }

    onClicked() {
        const editor = planningApi.editor(this.props.editorType);
        const bookmark = this.props.bookmark;

        (bookmark.index === 0 && editor.dom.formContainer?.current != null) ?
            editor.form.scrollToTop() :
            editor.form.scrollToBookmarkGroup(bookmark.group_id);
    }

    renderForPanel() {
        return (
            <OverlayTrigger
                placement="right"
                overlay={(
                    <Tooltip id={this.props.bookmark.id}>
                        {this.props.bookmark.tooltip}
                    </Tooltip>
                )}
            >
                <button
                    data-test-id={`editor--bookmarks__${this.props.bookmark.id}`}
                    type="button"
                    className={classNames(
                        'sd-navbtn sd-navbtn--default',
                        'editor-bookmark',
                        {active: this.props.active}
                    )}
                    tabIndex={0}
                    aria-label={this.props.bookmark.name}
                    onClick={this.onClicked}
                >
                    <Icon name={this.props.bookmark.icon} />
                </button>
            </OverlayTrigger>
        );
    }

    renderForPopup() {
        return (
            <button
                data-test-id={`editor--bookmarks__${this.props.bookmark.id}`}
                key={this.props.bookmark.id}
                type="button"
                className={classNames(
                    'sd-navbtn sd-navbtn--default sd-padding-l--2',
                    'editor-bookmark',
                    {
                        'sd-text__strong': this.props.active,
                        active: this.props.active,
                        'sd-margin-t--2': this.props.index === 0,
                    }
                )}
                tabIndex={0}
                aria-label={this.props.bookmark.name}
                onClick={this.onClicked}
            >{this.props.bookmark.name}</button>
        );
    }

    render() {
        if (this.props.bookmark.disabled) {
            return null;
        }

        return this.props.editorType === EDITOR_TYPE.POPUP ?
            this.renderForPopup() :
            this.renderForPanel();
    }
}
