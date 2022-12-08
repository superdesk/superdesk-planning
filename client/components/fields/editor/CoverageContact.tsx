import * as React from 'react';
import {get} from 'lodash';

import {IEditorFieldProps} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {ContactField, ContactsPreviewList} from '../../Contacts';
import {Row, Label} from '../../UI/Form';

interface IProps extends IEditorFieldProps {
    assignmentField?: string;
}

export class EditorFieldCoverageContact extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const field = this.props.field ?? 'planning.contact_info';
        const assignmentField = this.props.assignmentField ?? 'assigned_to.contact';
        const value = get(this.props.item, field);
        const assignmentValue = get(this.props.item, assignmentField);
        const label = this.props.label ?? gettext('Contacts');

        return assignmentValue != null ? (
            <Row
                className="coverage-editor__contact"
                testId={this.props.testId}
            >
                <Label
                    row={true}
                    text={label}
                />
                <ContactsPreviewList
                    contactIds={[assignmentValue]}
                    scrollInView={true}
                    scrollIntoViewOptions={{block: 'center'}}
                />
            </Row>
        ) : (
            <ContactField
                testId={this.props.testId}
                field={field}
                label={label}
                value={value}
                onChange={this.props.onChange}
                readOnly={this.props.disabled}
                singleValue={true}
            />
        );
    }
}
