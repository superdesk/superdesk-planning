import React from 'react';
import PropTypes from 'prop-types';
import {Item, Column, Row, ActionMenu} from '../../UI/List';
import {CollapseBox} from '../../UI/CollapseBox';
import {gettext, onEventCapture} from '../../../utils';
import {ContactInfoContainer} from '../ContactInfoContainer';
import '../SelectSearchContactsField/style.scss';

export const ContactMetaData = (
    {
        contact,
        scrollInView,
        scrollIntoViewOptions,
        tabEnabled,
        onEditContact,
        onRemoveContact,
        active,
    }
) => {
    const editContactComponent = onEditContact ?
        (<button
            data-sd-tooltip={gettext('Edit Contact')}
            data-flow="left"
            onClick={(event) => {
                onEventCapture(event);
                onEditContact();
            }}>
            <i className="icon-pencil" />
        </button>) : null;

    const removeContactComponent = onRemoveContact ?
        (<button
            data-sd-tooltip={gettext('Remove Contact')}
            data-flow="left"
            onClick={(event) => {
                onEventCapture(event);
                onRemoveContact();
            }}>
            <i className="icon-trash" />
        </button>) : null;

    const contactActions = [];

    if (editContactComponent) {
        contactActions.push(editContactComponent);
    }

    if (removeContactComponent) {
        contactActions.push(removeContactComponent);
    }

    const contactListView = (
        <div>
            <Item noBg={!active} activated={active} margin={true}>
                <div className="sd-list-item__border" />
                <Column grow={true} border={false}>
                    <Row>
                        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                            <span className="sd-list-item__text-strong">{contact.label}</span>
                        </span>
                    </Row>
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
            currentContact={contact.value} />
    );

    return (<div className="contact-metadata">
        <CollapseBox
            collapsedItem={contactListView}
            openItem={contactInDetail}
            scrollInView={scrollInView}
            scrollIntoViewOptions={scrollIntoViewOptions}
            tabEnabled={tabEnabled}
            tools={contactActions} />
    </div>);
};

ContactMetaData.propTypes = {
    contact: PropTypes.object,
    scrollInView: PropTypes.bool,
    scrollIntoViewOptions: PropTypes.object,
    tabEnabled: PropTypes.bool,
    onEditContact: PropTypes.func,
    onRemoveContact: PropTypes.func,
    active: PropTypes.bool,
};


ContactMetaData.defaultProps = {
    scrollInView: true,
};
