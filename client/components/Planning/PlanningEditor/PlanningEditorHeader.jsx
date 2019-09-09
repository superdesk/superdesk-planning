import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {getCreator, isExistingItem, eventUtils} from '../../../utils';

import {ContentBlock, ContentBlockInner} from '../../UI/SidePanel';
import {AuditInformation, StateLabel, Label} from '../..';
import {FeatureLabel} from '../FeaturedPlanning';

export const PlanningEditorHeader = ({item, users, event}) => {
    if (!isExistingItem(item)) {
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
            padSmall={true}
            flex={true}
        >
            <ContentBlockInner grow={true}>
                <AuditInformation
                    createdBy={createdBy}
                    updatedBy={versionCreator}
                    createdAt={creationDate}
                    updatedAt={updatedDate}
                    showStateInformation
                    item={item}
                />
            </ContentBlockInner>
            <ContentBlockInner right={true}>
                <StateLabel
                    item={item}
                    verbose={true}
                    withExpiredStatus={true}
                />
                {eventUtils.isEventCompleted(event) && (
                    <Label
                        text={gettext('Event Completed')}
                        iconType="success"
                        isHollow={true}
                    />
                )}
                <FeatureLabel item={item} />
            </ContentBlockInner>
        </ContentBlock>
    );
};

PlanningEditorHeader.propTypes = {
    item: PropTypes.object.isRequired,
    users: PropTypes.array.isRequired,
    event: PropTypes.object,
};
