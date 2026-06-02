import * as React from 'react';
import {get} from 'lodash';

import {IDesk} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';
import {IEditorFieldProps} from '../../../interfaces';

import {Row} from '../../UI/Form';

interface IEditorFieldUserProps extends IEditorFieldProps {
    deskId?: IDesk['_id'];
    valueStoredAsArray?: boolean;
}

export class EditorFieldUser extends React.PureComponent<IEditorFieldUserProps> {
    render() {
        const {SelectUser} = superdeskApi.components;
        const value = get(this.props.item, this.props.field);

        return (
            <Row
                key={this.props.field}
                id={`form-row-${this.props.field}`}
                testId={this.props.testId?.length ? this.props.testId : undefined}
            >
                <label className="form-label">
                    {this.props.label}
                </label>
                <SelectUser
                    deskId={this.props.deskId}
                    onSelect={(user) => {
                        this.props.onChange(this.props.field, this.props.valueStoredAsArray ? [user?._id] : user?._id);
                    }}
                    selectedUserId={this.props.valueStoredAsArray ? value?.[0] : value}
                    autoFocus={false}
                    horizontalSpacing={true}
                    clearable={true}
                />
            </Row>
        );
    }
}
