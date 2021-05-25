import * as React from 'react';
import {IEditorFieldProps} from '../../../interfaces';
import {EditorFieldText} from './base/text';

import {superdeskApi} from '../../../superdeskApi';

export class EditorFieldHeadline extends React.PureComponent<IEditorFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const {
            refNode,
            ...props
        } = this.props;

        return (
            <EditorFieldText
                ref={refNode}
                {...props}
                field={props.field ?? 'headline'}
                label={props.label ?? gettext('Headline')}
            />
        );
    }
}
