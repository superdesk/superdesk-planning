import * as React from 'react';
import moment from 'moment';
import {get} from 'lodash';

import {IEditorFieldProps} from '../../../../interfaces';
import {DateTimeInput} from '../../../UI/Form';

interface IProps extends IEditorFieldProps {
    canClear?: boolean;
    showToBeConfirmed?: boolean;
    toBeConfirmed?: boolean;
    onToBeConfirmed?(field: string): void;
}

export class EditorFieldDateTime extends React.PureComponent<IProps> {
    node: HTMLInputElement;

    focus() {
        if (this.node != null) {
            this.node.focus();
        }
    }

    render() {
        const field = this.props.field;
        const value = get(this.props.item, field, this.props.defaultValue);
        const momentValue = value != null ?
            moment(value) :
            null;
        const error = get(this.props.errors ?? {}, field);

        return (
            <DateTimeInput
                {...this.props}
                diff={this.props.item}
                field={field}
                value={momentValue}
                message={error}
                invalid={error?.length > 0 && this.props.invalid}
                testId={this.props.testId}
                readOnly={this.props.disabled}
                required={this.props.schema?.required}
                refNode={(node) => {
                    this.node = node;
                }}
            />
        );
    }
}
