import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get} from 'lodash';

import {Item, Column} from '../UI/List';

export const ContactLabel = ({contact}) => (
    <Item className="contact-info">
        <Column border={false} noPadding={true}>
            <figure
                className={classNames(
                    'avatar',
                    {organisation: !contact.first_name}
                )}
            />
        </Column>
        <Column>
            <div>
                <span className="sd-list-item__text-strong sd-overflow-ellipsis">
                    {contact.first_name ?
                        `${contact.first_name} ${contact.last_name} ` :
                        `${contact.organisation} `
                    }
                    {(contact.first_name && contact.job_title && contact.organisation) && (
                        <h5 className="sd-overflow-ellipsis">{contact.job_title}, {contact.organisation}</h5>
                    )}
                </span>
            </div>
            {get(contact, 'contact_email[0]') && (
                <div>
                    <span className="sd-overflow-ellipsis">
                        {contact.contact_email[0]}
                    </span>
                </div>
            )}
        </Column>
    </Item>
);

ContactLabel.propTypes = {
    contact: PropTypes.shape({
        first_name: PropTypes.string,
        last_name: PropTypes.string,
        organisation: PropTypes.string,
        job_title: PropTypes.string,
        contact_email: PropTypes.arrayOf(PropTypes.string),
    }),
};
