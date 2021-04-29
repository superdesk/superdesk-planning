import * as React from 'react';

import {IContactItem} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {onEventCapture} from '../../../utils';

import {StateLabel} from '../../';
import {Item, Column, Row, ActionMenu} from '../../UI/List';
import {CollapseBox} from '../../UI';
import {ContactInfoContainer, ContactLabel} from '../';

import '../SelectSearchContactsField/style.scss';

interface IProps {
    contact: IContactItem;
    scrollInView?: boolean; // defaults to true
    scrollIntoViewOptions?: any;
    tabEnabled?: boolean;
    active?: boolean;
    readOnly?: boolean;
    inner?: boolean;

    onEditContact(): void;
    onRemoveContact(): void;
}

export class ContactMetaData extends React.PureComponent<IProps> {
    constructor(props) {
        super(props);

        this.editContact = this.editContact.bind(this);
        this.removeContact = this.removeContact.bind(this);
    }

    editContact(event: React.MouseEvent<HTMLButtonElement>) {
        onEventCapture(event);
        this.props.onEditContact();
    }

    removeContact(event: React.MouseEvent<HTMLButtonElement>) {
        onEventCapture(event);
        this.props.onRemoveContact();
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {
            contact,
            scrollInView = true,
            scrollIntoViewOptions,
            tabEnabled,
            onEditContact,
            onRemoveContact,
            active,
            readOnly,
            inner,
        } = this.props;

        const contactActions = [];

        if (!readOnly) {
            if (onEditContact) {
                contactActions.push(
                    <button
                        data-sd-tooltip={gettext('Edit Contact')}
                        data-flow="left"
                        onClick={this.editContact}
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
                        onClick={this.removeContact}
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
                            fieldName="is_active"
                        />
                    </Column>
                    {contactActions.map(
                        (actionComponent, index) => (
                            <ActionMenu
                                key={index}
                                className="pull-right"
                            >
                                {actionComponent}
                            </ActionMenu>
                        )
                    )}
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
    }
}
