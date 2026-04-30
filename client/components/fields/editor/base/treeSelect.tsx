import * as React from 'react';
import {get} from 'lodash';

import {IEditorFieldProps} from '../../../../interfaces';

import {TreeSelect} from 'superdesk-ui-framework/react';
import {ITreeNode} from 'superdesk-ui-framework/react/components/TreeSelect/TreeSelect';
import {Row} from '../../../UI/Form';

export interface IEditorFieldTreeSelectProps<T = any, IItem = any> extends IEditorFieldProps {
    getOptions(): Array<ITreeNode<T>>
    getId(item: T): string;
    getLabel(item: T): string;
    info?: string;
    allowMultiple?: boolean;
    valueAsString?: boolean;
    smallPadding?: boolean;
    sortable?: boolean;
    filterScheme?(value: Array<any>): Array<any>;
    optionTemplate?(item: T): React.ComponentType<T> | JSX.Element;
    valueTemplate?(): React.ComponentType<{item: T}>;

    /**
     * Is meant for use cases where more control is needed
     * e.g. when values are vocabulary items, but only qcode needs to be stored instead of the entire vocabulary item.
     */
    valueAdapter?: {
        // e.g. getValue: (event) => [event.urgency]
        getValue?(item: IItem, field: string): Array<T>;

        // e.g. prepareValueForStorage: (values) => values[0].qcode
        prepareValueForStorage?(values: Array<T>, valueAsString: boolean): any;
    };
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
        const nextValues = (() => {
            if (this.props.valueAdapter?.prepareValueForStorage != null) {
                return this.props.valueAdapter.prepareValueForStorage(values, this.props.valueAsString);
            } else {
                let result = this.props.valueAsString ?
                    values.map((item) => this.props.getId(item)) :
                    values;

                if (!this.props.allowMultiple) {
                    result = result[0];
                }

                return result;
            }
        })();

        this.props.onChange(this.props.field, nextValues);
    }

    getViewValue() {
        let valuesPrepared: Array<any> = (() => {
            if (this.props.valueAdapter?.getValue != null) {
                return this.props.valueAdapter.getValue(this.props.item, this.props.field);
            }

            let values = get(this.props.item, this.props.field, this.props.defaultValue);

            if (values == null) {
                values = [];
            } else if (!Array.isArray(values)) {
                values = [values];
            }

            return values;
        })();

        let viewValues;
        const options = this.props.getOptions();

        valuesPrepared = this.props.filterScheme ? this.props.filterScheme(valuesPrepared) : valuesPrepared;

        if (this.props.valueAsString) {
            viewValues = options
                .filter((item) => valuesPrepared.includes(this.props.getId(item.value)))
                .map((item) => item.value);
        } else {
            viewValues = valuesPrepared;
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
                    sortable={this.props.sortable}
                    optionTemplate={this.props.optionTemplate}
                    valueTemplate={this.props.valueTemplate}
                />
            </Row>
        );
    }
}
