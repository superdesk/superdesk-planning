import * as React from 'react';

import {IEditorFieldProps} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';
import {EditorFieldDateTime} from './base/dateTime';

interface IProps extends IEditorFieldProps {
    canClear?: boolean;
}

export class EditorFieldDateOnly extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const {
            field,
            label,
            refNode,
            ...props
        } = this.props;

        return (
            <EditorFieldDateTime
                ref={refNode}
                {...props}
                field={field}
                label={label ?? gettext('Date')}
                hideTime={true}
            />
        );
    }
}
