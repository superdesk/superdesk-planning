import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import * as ContactComponents from 'superdesk-core/scripts/apps/contacts/components/index';
import {renderContents} from 'superdesk-core/scripts/apps/contacts/helpers';
import ng from 'superdesk-core/scripts/core/services/ng';

export class ContactInfoContainer extends React.Component {
    constructor(props) {
        super(props);
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.handleKeyBoardEvent = this.handleKeyBoardEvent.bind(this);
    }

    componentDidMount() {
        document.addEventListener('click', this.handleClickOutside, true);
        document.addEventListener('keydown', this.handleKeyBoardEvent);
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.handleClickOutside, true);
        document.removeEventListener('keydown', this.handleKeyBoardEvent);
    }

    handleKeyBoardEvent(event) {
        if (event) {
            switch (event.keyCode) {
            case 27:
                // ESC key
                event.preventDefault();
                this.handleCancel();
                break;
            }
        }
    }

    handleClickOutside(event) {
        const domNode = ReactDOM.findDOMNode(this);

        if ((!domNode || !domNode.contains(event.target))) {
            this.handleCancel();
        }
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

        return (<div>
            {this.props.currentContact &&
                (<div className="mgrid-view">
                    {renderContents(contents)}
                </div>)
            }
        </div>);
    }
}

ContactInfoContainer.propTypes = {
    onCancel: PropTypes.func,
    currentContact: PropTypes.object
};
