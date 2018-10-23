import React from 'react';
import PropTypes from 'prop-types';

import * as ContactComponents from 'superdesk-core/scripts/apps/contacts/components/index';
import {renderContents} from 'superdesk-core/scripts/apps/contacts/helpers';
import ng from 'superdesk-core/scripts/core/services/ng';


export class ContactInfoContainer extends React.Component {
    constructor(props) {
        super(props);
        this.handleCancel = this.handleCancel.bind(this);
    }

    handleCancel() {
        this.props.onCancel();
    }

    render() {
        const {ContactHeader, ContactInfo, ContactFooter} = ContactComponents;

        // Provides required services for Contact components
        const services = {
            gettextCatalog: ng.get('gettextCatalog'),
            $filter: ng.get('$filter'),
            datetime: ng.get('datetime'),
        };

        let contents = [
            'div',
            {
                className: 'media-box contacts',
            },
        ];

        contents.push(
            <ContactHeader item={this.props.currentContact} svc={services} />,
            <ContactInfo item={this.props.currentContact} svc={services} labelInactive />,
            <ContactFooter item={this.props.currentContact} svc={services} />
        );

        return (
            <div className="contact-popup">
                <span className="mgrid-view">{renderContents(contents)}</span>
            </div>
        );
    }
}

ContactInfoContainer.propTypes = {
    onCancel: PropTypes.func,
    currentContact: PropTypes.object,
    target: PropTypes.string,
};
