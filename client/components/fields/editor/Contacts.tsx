import * as React from 'react';
import {get} from 'lodash';

import {IEditorFieldProps} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {ContactField} from '../../Contacts/ContactField';

export class EditorFieldContacts extends React.PureComponent<IEditorFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'contacts';
        const value = get(this.props.item, field, this.props.defaultValue ?? []);
        const error = get(this.props.errors ?? {}, field);
        const invalid = this.props.invalid ?? (error != null && this.props.showErrors);

        return (
            <ContactField
                testId={this.props.testId}
                field={field}
                label={this.props.label ?? gettext('Contacts')}
                value={value}
                onChange={this.props.onChange}
                required={this.props.schema?.required}
                message={this.props.showErrors ? error : undefined}
                invalid={invalid}
                readOnly={this.props.disabled}
                singleValue={false}
            />
        );
    }
}
