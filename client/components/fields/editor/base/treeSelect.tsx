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
    cvName?: string;
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

        if (this.props.valueAsString) {
            viewValues = options
                .filter((item) => values.includes(this.props.getId(item.value)))
                .map((item) => item.value);
        } else {
            viewValues = values;
        }

        let newvalue = viewValues
    
        const selectedIds: Array<string> = (values || []).map(
            (option) => option["qcode"]
        );
        let selected = options
                    .filter((option) => selectedIds.includes(option.value?.qcode))
                    .map((item) =>Object.assign({scheme: this.props.cvName}, item.value))
        if (this.props.cvName) {
            newvalue = selected
            .filter((val) => val.scheme === this.props.cvName)
        }
        return newvalue;
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
