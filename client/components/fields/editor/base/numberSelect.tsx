import * as React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../../superdeskApi';
import {Select, Option, TreeSelect} from 'superdesk-ui-framework/react';
import {IEditorFieldProps} from '../../../../interfaces';

import {Row} from '../../../UI/Form';

interface IPropsBase extends IEditorFieldProps {
    options: Array<number>;
    clearable?: boolean;
    readOnly?: boolean;
    info?: string;
}

interface IPropsSingle extends IPropsBase {
    multiple: false;
    defaultValue?: number;
    onChange(field: string, value: number): void;
}

interface IPropsMultiple extends IPropsBase {
    multiple: true;
    defaultValue?: Array<number>;
    onChange(field: string, value: Array<number>): void;
}

type IProps = IPropsSingle | IPropsMultiple;


export class EditorFieldNumberSelect extends React.PureComponent<IProps> {
    node: React.RefObject<HTMLDivElement>;

    constructor(props) {
        super(props);

        this.node = React.createRef();
        this.onChangeSingle = this.onChangeSingle.bind(this);
        this.onChangeMultiple = this.onChangeMultiple.bind(this);
    }

    onChangeSingle(newValue: string) {
        if (this.props.multiple === false) {
            this.props.onChange(this.props.field, parseInt(newValue, 10));
        }
    }

    onChangeMultiple(newValue: Array<number>) {
        if (this.props.multiple === true) {
            this.props.onChange(this.props.field, newValue);
        }
    }

    focus() {
        if (this.node.current != null) {
            this.node.current.getElementsByTagName('select')[0]?.focus();
        }
    }

    renderSingle(value: number) {
        const {gettext} = superdeskApi.localization;
        const error = get(this.props.errors ?? {}, this.props.field);

        return (
            <Select
                value={(value || 0).toString()}
                required={this.props.required ?? this.props.schema?.required}
                onChange={this.onChangeSingle}
                label={this.props.label}
                info={this.props.info}
                error={error}
                disabled={this.props.disabled}
                invalid={this.props.invalid}
            >
                {this.props.schema?.required === true ? null : (
                    <Option value={undefined}>
                        {gettext('None')}
                    </Option>
                )}
                {this.props.options.map((value) => (
                    <Option
                        key={value}
                        value={value.toString(10)}
                    >
                        {value}
                    </Option>
                ))}
            </Select>
        );
    }

    renderMultiple(values: Array<number>) {
        return (
            <TreeSelect
                kind="synchronous"
                label={this.props.label}
                getOptions={() => this.props.options.map((value) => ({
                    value: value,
                }))}
                getLabel={(item) => item.toString(10)}
                getId={(item) => item.toString(10)}
                value={values}
                onChange={this.onChangeMultiple}
                allowMultiple={true}
                zIndex={1051}
            />
        );
    }

    render() {
        const value = get(this.props.item, this.props.field, this.props.defaultValue);

        return (
            <Row
                testId={this.props.testId}
                refNode={this.node}
            >
                {this.props.multiple === false ?
                    this.renderSingle(value) :
                    this.renderMultiple(value)
                }
            </Row>
        );
    }
}
