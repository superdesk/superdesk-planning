import * as React from 'react';
import {IEditorFieldProps} from '../../../interfaces';

import {superdeskApi} from '../../../superdeskApi';
import {EditorFieldDateTime} from './base/dateTime';

interface IProps extends IEditorFieldProps {
    canClear: boolean;
}

export class EditorFieldStartDateTime extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldDateTime
                field={this.props.field ?? 'start_date'}
                label={this.props.label ?? gettext('From')}
                canClear={this.props.canClear}
                {...this.props}
            />
        );
    }
}
