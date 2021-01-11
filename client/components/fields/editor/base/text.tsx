import * as React from 'react';
import {get} from 'lodash';

import {TextInput, Row} from '../../../UI/Form';
import {IEditorFieldProps} from '../../../../interfaces';

export class EditorFieldText extends React.PureComponent<IEditorFieldProps> {
    render() {
        const field = this.props.field;
        const value = get(this.props.item, field, this.props.defaultValue);
        const error = get(this.props.errors ?? {}, field);

        return (
            <Row testId={this.props.testId}>
                <TextInput
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
