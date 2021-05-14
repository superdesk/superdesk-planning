import * as React from 'react';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';
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
        if (this.props.readOnly || this.props.editorType === EDITOR_TYPE.POPUP) {
            return null;
        }

        const {gettext} = superdeskApi.localization;

        return (
            <OverlayTrigger
                placement="right"
                overlay={(
                    <Tooltip id="add_planning_item">
                        {gettext('Add Planning Item')}
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
                    aria-label={gettext('Add planning item')}
                    onClick={this.onClick}
                >
                    <Icon name="plus-large" />
                </button>
            </OverlayTrigger>
        );
    }
}
