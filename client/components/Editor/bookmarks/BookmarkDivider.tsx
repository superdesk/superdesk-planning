import * as React from 'react';

import {EDITOR_TYPE, IBookmarkProps} from '../../../interfaces';

import {Divider} from 'superdesk-ui-framework/react';

export class BookmarkDivider extends React.PureComponent<IBookmarkProps> {
    render() {
        // We don't want to render dividers in the popup editor
        return this.props.editorType === EDITOR_TYPE.POPUP ? null : (
            <div className="sd-padding-x--1-5">
                <Divider
                    size="large"
                    border={true}
                />
            </div>
        );
    }
}
