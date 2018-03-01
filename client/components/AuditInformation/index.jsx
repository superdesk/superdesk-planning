import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as selectors from '../../selectors';
import {get} from 'lodash';
import moment from 'moment';

export const AuditInformationComponent = ({
    createdBy,
    createdAt,
    updatedBy,
    updatedAt,
    users,
    ingestProviders,
}) => {
    const getAuthor = (createdBy) => {
        let user, provider;

        user = get(createdBy, 'display_name') ? createdBy : users.find((u) => (u._id === createdBy));
        provider = ingestProviders ? ingestProviders.find((p) => (p.id === createdBy)) : null;
        if (!user && provider) {
            provider.display_name = 'Ingest: ' + provider.name;
        }

        return user || provider;
    };

    const creator = getAuthor(createdBy);
    const versionCreator = get(updatedBy, 'display_name') ? updatedBy : users.find((user) => user._id === updatedBy);
    const createdDateTime = createdAt ? moment(createdAt).fromNow() : null;
    const modifiedDateTime = updatedAt ? moment(updatedAt).fromNow() : null;

    return (
        <div className="TimeAndAuthor">
            {createdDateTime && creator &&
                <div className="sd-text__date-and-author">
                    <time>Created {createdDateTime} by </time>
                    <span className="TimeAndAuthor__author sd-text__author">
                        {creator.display_name || creator.name}
                    </span>
                </div>
            }

            {modifiedDateTime && versionCreator &&
                <div className="sd-text__date-and-author">
                    <time>Updated {modifiedDateTime} by </time>
                    <span className="TimeAndAuthor__author sd-text__author">
                        {versionCreator.display_name}
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
};

const mapStateToProps = (state) => (
    {
        users: selectors.getUsers(state),
        ingestProviders: selectors.getIngestProviders(state),
    }
);

export const AuditInformation = connect(mapStateToProps)(AuditInformationComponent);
