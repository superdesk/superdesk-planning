import * as React from 'react';

import {IListFieldProps} from '../../../interfaces';
import {getItemWorkflowStateLabel} from '../../../utils';
import {Label} from '../../';

interface IProps extends IListFieldProps {
    className?: string;
}

export class ListFieldState extends React.PureComponent<IProps> {
    render() {
        const field = this.props.field ?? 'state';
        const itemState = getItemWorkflowStateLabel(this.props.item, field);

        return (
            <Label
                text={itemState.label}
                iconType={itemState.iconType}
                className={this.props.className}
            />
        );
    }
}
