import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const ContactLabel = ({contact}) => (
    <span className="contact-info">
        <figure className={classNames(
            'avatar',
            {organisation: !contact.first_name}
        )} />

        <span>
            {contact.first_name ?
                `${contact.first_name} ${contact.last_name} ` :
                `${contact.organisation} `
            }
            {(contact.first_name && contact.job_title && contact.organisation) && (
                <h5>{contact.job_title}, {contact.organisation}</h5>
            )}
        </span>
    </span>
);

ContactLabel.propTypes = {
    contact: PropTypes.shape({
        first_name: PropTypes.string,
        last_name: PropTypes.string,
        organisation: PropTypes.string,
        job_title: PropTypes.string,
    }),
};
