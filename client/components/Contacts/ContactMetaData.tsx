import * as React from 'react';
import {superdeskApi} from '../../superdeskApi';
import {onEventCapture} from '../../utils';
import {StateLabel} from '..';
import {ContactInfoContainer, ContactLabel} from '.';
import './SelectSearchContactsField/style.scss';
import {IconButton, Spacer, ToggleBox} from 'superdesk-ui-framework/react';
import {IContact} from 'superdesk-api';

interface IProps {
    contact: IContact;
    readOnly?: boolean;
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
            onEditContact,
            onRemoveContact,
            readOnly,
        } = this.props;

        return (
            <ToggleBox
                header={(
                    <div style={{backgroundColor: 'white', paddingBlockEnd: 2, paddingBlockStart: 2}}>
                        <Spacer gap="0" h noWrap justifyContent="start">
                            <ContactLabel contact={contact} />
                            <StateLabel
                                item={contact}
                                verbose={true}
                                className="pull-right"
                                fieldName="is_active"
                            />
                            <Spacer h gap="4" noWrap justifyContent="end" alignItems="center">
                                {((!readOnly && onEditContact) && (
                                    <IconButton
                                        icon="pencil"
                                        aria-label={gettext('Edit Contact')}
                                        ariaValue={gettext('Edit Contact')}
                                        onClick={this.editContact}
                                    />
                                ))}
                                {((!readOnly && onRemoveContact) && (
                                    <IconButton
                                        ariaValue={gettext('Remove Contact')}
                                        icon="trash"
                                        aria-label={gettext('Remove Contact')}
                                        onClick={this.removeContact}
                                    />
                                ))}
                            </Spacer>
                        </Spacer>
                    </div>
                )}
                getToggleButtonLabel={(isOpen) => isOpen ? gettext('Show less') : gettext('Show more')}
                variant="custom-header"
            >
                <ContactInfoContainer currentContact={contact} />
            </ToggleBox>
        );
    }
}
