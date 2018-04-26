import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {getCreator} from '../../../utils';
import {ContentBlock, ContentBlockInner} from '../../UI/SidePanel';
import {AuditInformation, StateLabel} from '../..';

import './style.scss';

export const EventEditorHeader = ({item, users}) => {
    if (!get(item, '_id')) {
        return null;
    }

    const createdBy = getCreator(item, 'original_creator', users);
    const updatedBy = getCreator(item, 'version_creator', users);
    const creationDate = get(item, '_created');
    const updatedDate = get(item, '_updated');
    const versionCreator = get(updatedBy, 'display_name') ? updatedBy :
        users.find((user) => user._id === updatedBy);

    return (
        <ContentBlock
            className="event-editor__header"
            padSmall={true}
            flex={true}
        >
            <ContentBlockInner grow={true}>
                <AuditInformation
                    createdBy={createdBy}
                    updatedBy={versionCreator}
                    createdAt={creationDate}
                    updatedAt={updatedDate}
                />
            </ContentBlockInner>
            <ContentBlockInner right={true}>
                <StateLabel
                    item={item}
                    verbose={true}
                />
            </ContentBlockInner>
        </ContentBlock>
    );
};

EventEditorHeader.propTypes = {
    item: PropTypes.object.isRequired,
    users: PropTypes.array.isRequired,
};
