import React from 'react';
import {IContact} from 'superdesk-api';
import * as ContactComponents from 'superdesk-core/scripts/apps/contacts/components/index';
import ng from 'superdesk-core/scripts/core/services/ng';

interface IProps {
    currentContact: IContact;
}

export class ContactInfoContainer extends React.Component<IProps> {
    render() {
        const {ContactHeader, ContactInfo, ContactFooter} = ContactComponents;
        const services = {
            datetime: ng.get('datetime'),
        };

        return (
            <>
                <ContactHeader item={this.props.currentContact} />
                <ContactInfo item={this.props.currentContact} labelInactive />
                <ContactFooter item={this.props.currentContact} svc={services} />
            </>
        );
    }
}
