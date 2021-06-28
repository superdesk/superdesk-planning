import * as React from 'react';

import {superdeskApi} from '../../../superdeskApi';
import {IEditorFieldProps} from '../../../interfaces';
import {EditorFieldDateTime} from './base/dateTime';

interface IProps extends IEditorFieldProps {
    canClear?: boolean;
    timeField?: string;
}

export class EditorFieldCoverageSchedule extends React.PureComponent<IProps> {
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
                field={field ?? 'scheduled'}
                label={label ?? gettext('Due')}
                showToBeConfirmed
            />
        );
    }
}
