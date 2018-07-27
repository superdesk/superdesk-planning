import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as selectors from '../../selectors';
import {get} from 'lodash';
import moment from 'moment';
import {gettext} from '../../utils/gettext';

export const AuditInformationComponent = ({
    createdBy,
    createdAt,
    updatedBy,
    updatedAt,
    postedBy,
    postedAt,
    users,
    ingestProviders,
}) => {
    const getAuthor = (createdBy) => {
        let user, provider;

        user = get(createdBy, 'display_name') ? createdBy : users.find((u) => (u._id === createdBy));
        provider = ingestProviders ? ingestProviders.find((p) => (p.id === createdBy)) : null;
        if (!user && provider) {
            provider.display_name = gettext('Ingest') + ': ' + provider.name;
        }

        return user || provider;
    };

    const creator = getAuthor(createdBy);
    const versionCreator = get(updatedBy, 'display_name') ? updatedBy : users.find((user) => user._id === updatedBy);
    const createdDateTime = createdAt ? moment(createdAt).fromNow() : null;
    const modifiedDateTime = updatedAt ? moment(updatedAt).fromNow() : null;
    const postCreator = get(postedBy, 'display_name') ? postedBy : users.find((user) => user._id === postedBy);
    const postedDateTime = postedAt ? moment(postedAt).fromNow() : null;


    return (
        <div className="TimeAndAuthor">
            {createdDateTime && creator &&
                <div className="sd-text__date-and-author">
                    <time>{gettext('Created') + ' ' + createdDateTime + ' ' + gettext('by') + ' '}</time>
                    <span className="TimeAndAuthor__author sd-text__author">
                        {creator.display_name || creator.name}
                    </span>
                </div>
            }

            {modifiedDateTime && versionCreator &&
                <div className="sd-text__date-and-author">
                    <time>{gettext('Updated') + ' ' + modifiedDateTime + ' ' + gettext('by') + ' '}</time>
                    <span className="TimeAndAuthor__author sd-text__author">
                        {versionCreator.display_name}
                    </span>
                </div>
            }

            {postedDateTime && postCreator &&
                <div className="sd-text__date-and-author">
                    <time>{gettext('Posted') + ' ' + modifiedDateTime + ' ' + gettext('by') + ' '}</time>
                    <span className="TimeAndAuthor__author sd-text__author">
                        {postCreator.display_name}
                    </span>
                </div>
            }
        </div>
    );
};

AuditInformationComponent.propTypes = {
    users: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.object,
    ]),
    ingestProviders: PropTypes.array,
    createdBy: PropTypes.any,
    createdAt: PropTypes.any,
    updatedBy: PropTypes.any,
    updatedAt: PropTypes.any,
    postedAt: PropTypes.any,
    postedBy: PropTypes.any,
};

const mapStateToProps = (state) => (
    {
        users: selectors.general.users(state),
        ingestProviders: selectors.general.ingestProviders(state),
    }
);

export const AuditInformation = connect(mapStateToProps)(AuditInformationComponent);
