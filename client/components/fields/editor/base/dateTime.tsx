import * as React from 'react';
import moment from 'moment';
import {get} from 'lodash';

import {IEditorFieldProps} from '../../../../interfaces';
import {DateTimeInput, Row} from '../../../UI/Form';

interface IProps extends IEditorFieldProps {
    canClear?: boolean;
}

export class EditorFieldDateTime extends React.PureComponent<IProps> {
    render() {
        const field = this.props.field;
        const value = get(this.props.item, field, this.props.defaultValue);
        const momentValue = value != null ?
            moment(value) :
            null;
        const error = get(this.props.errors ?? {}, field);

        return (
            <Row>
                <DateTimeInput
                    {...this.props}
                    field={field}
                    value={momentValue}
                    message={error}
                    invalid={error?.length > 0 && this.props.invalid}
                />
            </Row>
        );
    }
}
