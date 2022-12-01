import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get} from 'lodash';

import {Item, Column} from '../UI/List';

export const ContactLabel = ({contact}) => (
    <div className="contact-info">
        <figure
            className={classNames(
                'avatar',
                {organisation: !contact.first_name}
            )}
        />
        <div className="contact-info__data">
            <h5 className="contact-info__name">
                    {contact.first_name ?
                        `${contact.first_name} ${contact.last_name} ` :
                        `${contact.organisation} `
                    }
                    {(contact.first_name && contact.job_title && contact.organisation) && (
                        <span className="contact-info__job-info">, {contact.job_title}, {contact.organisation}</span>
                    )}
                </h5>

            {get(contact, 'contact_email[0]') && (
                <span className="contact-info__mail">
                    {contact.contact_email[0]}
                </span>
            )}
        </div>
    </div>
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
