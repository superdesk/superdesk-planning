import * as React from 'react';
import {get} from 'lodash';

import {IEditorFieldProps} from '../../../../interfaces';
import {ColouredValueInput, Row} from '../../../UI/Form';

interface IProps extends IEditorFieldProps {
    options: Array<any>;
    valueKey?: string;
    labelKey?: string;
    searchKey?: string;
    iconName: string;
    clearable?: boolean;
}

export class EditorFieldColouredValue extends React.PureComponent<IProps> {
    render() {
        const field = this.props.field;
        const value = get(this.props.item, field, this.props.defaultValue);
        const error = get(this.props.errors ?? {}, field);

        return (
            <Row testId={this.props.testId}>
                <ColouredValueInput
                    {...this.props}
                    field={field}
                    label={this.props.label}
                    value={value}
                />
            </Row>
        );
    }
}
