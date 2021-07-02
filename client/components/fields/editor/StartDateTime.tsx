import * as React from 'react';
import {IEditorFieldProps} from '../../../interfaces';

import {superdeskApi} from '../../../superdeskApi';
import {EditorFieldDateTime} from './base/dateTime';

interface IProps extends IEditorFieldProps {
    canClear?: boolean;
    timeField?: string;
    showToBeConfirmed?: boolean;
    onToBeConfirmed?(field: string): void;
    toBeConfirmed: boolean;
}

export class EditorFieldStartDateTime extends React.PureComponent<IProps> {
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
                field={field ?? 'start_date'}
                label={label ?? gettext('From')}
            />
        );
    }
}
