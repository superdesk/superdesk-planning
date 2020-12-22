import * as React from 'react';
import {IEditorFieldProps} from '../../../interfaces';
import {EditorFieldText} from './base/text';

import {superdeskApi} from '../../../superdeskApi';

export class EditorFieldSlugline extends React.PureComponent<IEditorFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldText
                field={this.props.field ?? 'slugline'}
                label={this.props.label ?? gettext('Slugline')}
                {...this.props}
            />
        );
    }
}
