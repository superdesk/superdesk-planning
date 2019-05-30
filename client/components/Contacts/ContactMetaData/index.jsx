import React from 'react';
import PropTypes from 'prop-types';
import {StateLabel} from '../../';
import {Item, Column, Row, ActionMenu} from '../../UI/List';
import {CollapseBox} from '../../UI/CollapseBox';
import {gettext, onEventCapture} from '../../../utils';
import {ContactInfoContainer, ContactLabel} from '../';

import '../SelectSearchContactsField/style.scss';

export const ContactMetaData = ({
    contact,
    scrollInView,
    scrollIntoViewOptions,
    tabEnabled,
    onEditContact,
    onRemoveContact,
    active,
    readOnly,
    inner,
}) => {
    const contactActions = [];

    if (!readOnly) {
        if (onEditContact) {
            contactActions.push(
                <button
                    data-sd-tooltip={gettext('Edit Contact')}
                    data-flow="left"
                    onClick={(event) => {
                        onEventCapture(event);
                        onEditContact();
                    }}
                >
                    <i className="icon-pencil" />
                </button>
            );
        }

        if (onRemoveContact) {
            contactActions.push(
                <button
                    data-sd-tooltip={gettext('Remove Contact')}
                    data-flow="left"
                    onClick={(event) => {
                        onEventCapture(event);
                        onRemoveContact();
                    }}
                >
                    <i className="icon-trash" />
                </button>
            );
        }
    }

    const contactListView = (
        <div>
            <Item noBg={!active} activated={active} margin={true}>
                <div className="sd-list-item__border" />
                <Column grow={true} border={false}>
                    <Row>
                        <ContactLabel contact={contact} />
                    </Row>
                </Column>
                <Column border={false}>
                    <StateLabel
                        item={contact}
                        verbose={true}
                        className="pull-right"
                        fieldName="is_active" />
                </Column>
                {contactActions.length > 0 && contactActions.map((actionComponent, index) => (
                    <ActionMenu className="pull-right" key={index}>{actionComponent}</ActionMenu>
                ))}
            </Item>
        </div>
    );

    const contactInDetail = (
        <ContactInfoContainer
            target="sd-list-item__border"
            currentContact={contact}
        />
    );

    return (
        <div className="contact-metadata list-item-view">
            <CollapseBox
                collapsedItem={contactListView}
                openItem={contactInDetail}
                scrollInView={scrollInView}
                scrollIntoViewOptions={scrollIntoViewOptions}
                tabEnabled={tabEnabled}
                tools={contactActions}
                inner={inner}
            />
        </div>
    );
};

ContactMetaData.propTypes = {
    contact: PropTypes.object,
    scrollInView: PropTypes.bool,
    scrollIntoViewOptions: PropTypes.object,
    tabEnabled: PropTypes.bool,
    onEditContact: PropTypes.func,
    onRemoveContact: PropTypes.func,
    active: PropTypes.bool,
    readOnly: PropTypes.bool,
    inner: PropTypes.bool,
};


ContactMetaData.defaultProps = {
    scrollInView: true,
    readOnly: false,
    inner: false,
};
