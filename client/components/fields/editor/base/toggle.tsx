import * as React from 'react';
import {get} from 'lodash';

import {IEditorFieldProps} from '../../../../interfaces';
import {Row} from '../../../UI/Form';
import {Switch} from 'superdesk-ui-framework/react';

export class EditorFieldToggle extends React.PureComponent<IEditorFieldProps> {
    render() {
        const field = this.props.field;
        const value = get(this.props.item, field, this.props.defaultValue);

        return (
            <Row testId={this.props.testId}>
                <Switch
                    ref={this.props.refNode}
                    value={value}
                    onChange={(newValue) => this.props.onChange(this.props.field, newValue)}
                    disabled={this.props.disabled}
                />
                <label>{this.props.label}</label>
            </Row>
        );
    }
}
