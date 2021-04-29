import * as React from 'react';
import {get} from 'lodash';

import {IEditorFieldProps} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {ContactField} from '../../Contacts';

export class EditorFieldContacts extends React.PureComponent<IEditorFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'contacts';
        const value = get(this.props.item, field, this.props.defaultValue ?? []);

        return (
            <ContactField
                testId={this.props.testId}
                field={field}
                label={this.props.label ?? gettext('Contacts')}
                value={value}
                onChange={this.props.onChange}
                readOnly={this.props.disabled}
            />
        );
    }
}
