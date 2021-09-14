import * as React from 'react';
import {get} from 'lodash';

import {IEditorFieldProps} from '../../../../interfaces';
import {Row} from '../../../UI/Form';
import {Checkbox} from 'superdesk-ui-framework/react';

export class EditorFieldCheckbox extends React.PureComponent<IEditorFieldProps> {
    render() {
        const field = this.props.field;
        const value = get(this.props.item, field, this.props.defaultValue);

        return (
            <Row testId={this.props.testId}>
                <Checkbox
                    ref={this.props.refNode}
                    label={{text: this.props.label}}
                    checked={value}
                    onChange={(newValue) => this.props.onChange(this.props.field, newValue)}
                    disabled={this.props.disabled}
                />
            </Row>
        );
    }
}
