import * as React from 'react';

import {superdeskApi} from '../../../superdeskApi';
import {IEditorFieldProps} from '../../../interfaces';
import {EditorFieldDateTime} from './base/dateTime';

interface IProps extends IEditorFieldProps {
    canClear: boolean;
}

export class EditorFieldEndDateTime extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldDateTime
                field={this.props.field ?? 'end_date'}
                label={this.props.label ?? gettext('To')}
                canClear={this.props.canClear}
                {...this.props}
            />
        );
    }
}
