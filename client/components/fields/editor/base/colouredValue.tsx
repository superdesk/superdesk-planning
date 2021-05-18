import * as React from 'react';
import {get} from 'lodash';

import {IEditorFieldProps} from '../../../../interfaces';
import {ColouredValueInput, Row} from '../../../UI/Form';

interface IProps extends IEditorFieldProps {
    options: Array<any>;
    valueKey?: string; // defaults to 'qcode'
    labelKey?: string;
    searchKey?: string;
    iconName: string;
    clearable?: boolean;
    valueAsString?: boolean;
}

export class EditorFieldColouredValue extends React.PureComponent<IProps> {
    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);
    }

    onChange(field: string, value: any | null) {
        if (value == null) {
            this.props.onChange(field, value);
        } else if (!this.props.valueAsString) {
            this.props.onChange(field, value);
        } else {
            this.props.onChange(field, value[this.props.valueKey ?? 'qcode']);
        }
    }

    getValue() {
        const value = get(this.props.item, this.props.field, this.props.defaultValue);

        return !this.props.valueAsString ?
            value :
            (this.props.options ?? []).find(
                (item) => item[this.props.valueKey ?? 'qcode'] === value
            );
    }

    render() {
        return (
            <Row testId={this.props.testId}>
                <ColouredValueInput
                    {...this.props}
                    label={this.props.label}
                    value={this.getValue()}
                    onChange={this.onChange}
                    readOnly={this.props.disabled}
                />
            </Row>
        );
    }
}
