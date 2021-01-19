import * as React from 'react';
import {get} from 'lodash';

import {SelectInput, Row} from '../../../UI/Form';
import {IEditorFieldProps} from '../../../../interfaces';

interface IProps extends IEditorFieldProps {
    options: Array<any>;
    labelField?: string; // label
    keyField?: string; // qcode
    placeholder?: string; // qcode
    valueAsString?: boolean;
    clearable?: boolean;
    readOnly?: boolean;
}

export class EditorFieldSelect extends React.PureComponent<IProps> {
    render() {
        const field = this.props.field;
        const value = get(this.props.item, field, this.props.defaultValue);
        const error = get(this.props.errors ?? {}, field);

        return (
            <Row testId={this.props.testId}>
                <SelectInput
                    {...this.props}
                    field={field}
                    value={value}
                    message={error ?? ''}
                    invalid={error?.length > 0 && this.props.invalid}
                />
            </Row>
        );
    }
}
