import * as React from 'react';
import {Tooltip} from 'superdesk-ui-framework/react';
import classNames from 'classnames';

import {EDITOR_TYPE, IBookmarkProps} from '../../../interfaces';
import {planningApi, superdeskApi} from '../../../superdeskApi';

import {Icon} from 'superdesk-ui-framework/react';

export class AddPlanningBookmark extends React.PureComponent<IBookmarkProps> {
    constructor(props) {
        super(props);

        this.onClick = this.onClick.bind(this);
    }

    onClick() {
        planningApi.editor(this.props.editorType).item.events.addPlanningItem();
    }

    render() {
        if (this.props.disabled || this.props.editorType === EDITOR_TYPE.POPUP) {
            return null;
        }

        const {gettext} = superdeskApi.localization;

        return (
            <Tooltip
                content={gettext('Add Planning Item')}
                placement="right"
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
                    aria-label={gettext('Add planning item')}
                    onClick={this.onClick}
                >
                    <Icon name="plus-large" />
                </button>
            </Tooltip>
        );
    }
}
