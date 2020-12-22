import * as React from 'react';
import {get} from 'lodash';

import {Row, RadioButtonInput} from '../../../UI/Form';
import {IEditorFieldProps} from '../../../../interfaces';

interface IProps extends IEditorFieldProps {
    options: Array<any>;
}

export class EditorFieldRadio extends React.PureComponent<IProps> {
    render() {
        const field = this.props.field;
        const value = get(this.props.item, field, this.props.defaultValue);
        const error = get(this.props.errors ?? {}, field);

        return (
            <Row>
                <RadioButtonInput
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
