import React from 'react';
import {get} from 'lodash';
import {IContact} from 'superdesk-api';
import {Spacer} from 'superdesk-ui-framework/react';

interface IProps {
    contact: IContact;
}

export const ContactLabel: React.FunctionComponent<IProps> = ({contact}) => (
    <div
        style={{
            padding: 4,
            paddingBlockStart: 10,
        }}
    >
        <Spacer h gap="16" justifyContent="center">
            <div
                style={{
                    backgroundColor: 'var(--sd-colour-success)',
                    borderRadius: '50%',
                    padding: 4,
                    width: 32,
                    height: 32,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                <i style={{color: 'white'}} className={`${contact.first_name ? 'icon-user' : 'icon-business'}`} />
            </div>
            <div className="contact-info__data">
                <h5 className="contact-info__name">
                    {contact.first_name ? `${contact.first_name} ${contact.last_name} ` : `${contact.organisation}`}
                    {(contact.first_name && contact.job_title && contact.organisation) && (
                        <span className="contact-info__job-info">, {contact.job_title}, {contact.organisation}</span>
                    )}
                </h5>
                {contact?.contact_email?.[0] != null && (
                    <span className="contact-info__mail">
                        {contact.contact_email[0]}
                    </span>
                )}
            </div>
        </Spacer>
    </div>
);
