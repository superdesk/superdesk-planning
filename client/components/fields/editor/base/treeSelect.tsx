import * as React from 'react';
import {get} from 'lodash';

import {IEditorFieldProps} from '../../../../interfaces';

import {TreeSelect} from 'superdesk-ui-framework/react';
import {ITreeNode} from 'superdesk-ui-framework/react/components/TreeSelect';
import {Row} from '../../../UI/Form';

export interface IEditorFieldTreeSelectProps<T = any> extends IEditorFieldProps {
    getOptions(): Array<ITreeNode<T>>
    getId(item: T): string;
    getLabel(item: T): string;
    info?: string;
    allowMultiple?: boolean;
    valueAsString?: boolean;
    smallPadding?: boolean;
    sortable?: boolean;
    scheme?: string;
}

export class EditorFieldTreeSelect<T> extends React.PureComponent<IEditorFieldTreeSelectProps<T>> {
    static defaultProps = {
        defaultValue: [],
    }

    constructor(props: IEditorFieldTreeSelectProps) {
        super(props);

        this.onChange = this.onChange.bind(this);
    }

    onChange(values: Array<any>) {
        let newValues = this.props.valueAsString ?
            values.map((item) => this.props.getId(item)) :
            values;

        if (!this.props.allowMultiple) {
            newValues = newValues[0];
        }

        let otherCvValues = get(this.props.item, this.props.field, this.props.defaultValue);

        if (this.props.valueAsString == null) {
            newValues = newValues.concat(
                otherCvValues.filter((value) => value?.scheme != this.props.scheme));
        }

        this.props.onChange(this.props.field, newValues);
    }

    getViewValue() {
        let values = get(this.props.item, this.props.field, this.props.defaultValue);
        let viewValues;
        const options = this.props.getOptions();

        if (values == null) {
            values = [];
        } else if (!Array.isArray(values)) {
            values = [values];
        }

        values = values?.filter((value) => this.props.scheme == null || value?.scheme === this.props.scheme);

        if (this.props.valueAsString) {
            viewValues = options
                .filter((item) => values.includes(this.props.getId(item.value)))
                .map((item) => item.value);
        } else {
            viewValues = values;
        }

        return viewValues;
    }

    render() {
        const field = this.props.field;
        const error = get(this.props.errors ?? {}, field);

        return (
            <Row testId={this.props.testId} smallPadding={this.props.smallPadding}>
                <TreeSelect
                    kind="synchronous"
                    value={this.getViewValue()}
                    getOptions={this.props.getOptions}
                    getId={this.props.getId}
                    getLabel={this.props.getLabel}
                    onChange={this.onChange}
                    allowMultiple={this.props.allowMultiple}
                    invalid={error?.length > 0 || this.props.invalid}
                    error={this.props.showErrors ? error : undefined}
                    readOnly={this.props.disabled}
                    disabled={this.props.disabled}
                    required={this.props.required}
                    label={this.props.label}
                    tabindex={0}
                    info={this.props.info}
                    zIndex={1051}
                    sortable={this.props.sortable}
                />
            </Row>
        );
    }
}
