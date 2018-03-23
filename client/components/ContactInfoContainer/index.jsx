import React from 'react';
import PropTypes from 'prop-types';

import * as ContactComponents from 'superdesk-core/scripts/apps/contacts/components/index';
import {renderContents} from 'superdesk-core/scripts/apps/contacts/helpers';
import ng from 'superdesk-core/scripts/core/services/ng';
import {gettext} from '../../utils';
import {Popup, Header, Content} from '../UI/Popup';


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
            datetime: ng.get('datetime')
        };

        let contents = [
            'div',
            {
                className: 'media-box contacts'
            }
        ];

        contents.push(
            <ContactHeader item={this.props.currentContact} svc={services} />,
            <ContactInfo item={this.props.currentContact} svc={services} />,
            <ContactFooter item={this.props.currentContact} svc={services} />
        );

        return (
            <Popup
                close={this.handleCancel.bind(this)}
                target={this.props.target}
                noPadding={true}
                className="contact-popup"
            >
                <Header text={gettext('Contact Details')} onClose={this.handleCancel} />
                <Content noPadding={true}>
                    {this.props.currentContact &&
                        (<div className="mgrid-view">
                            {renderContents(contents)}
                        </div>)
                    }
                </Content>
            </Popup>
        );
    }
}

ContactInfoContainer.propTypes = {
    onCancel: PropTypes.func,
    currentContact: PropTypes.object,
    target: PropTypes.string,
};
