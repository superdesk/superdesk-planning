import React from 'react';

import {IArticle} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';

import {getCreator} from '../../../utils';
import {AuditInformation} from '../../AuditInformation';


interface IProps {
    item: IArticle;
}

export function ArchivePreviewAuditInformationComponent({item}: IProps) {
    const {UserAvatar, Spacer} = superdeskApi.components;
    const users = Object.values(superdeskApi.entities.users.getAllUsers());

    const createdBy = getCreator(item, 'original_creator', users);
    const updatedBy = getCreator(item, 'version_creator', users);
    const creationDate = item._created;
    const updatedDate = item._updated;
    const versionCreator = updatedBy?.display_name ?
        updatedBy :
        users.find((user) => user._id === updatedBy);

    return (
        <Spacer gap="8" noGrow>
            <UserAvatar userId={item.version_creator} />
            <AuditInformation
                createdBy={createdBy}
                updatedBy={versionCreator}
                createdAt={creationDate}
                updatedAt={updatedDate}
                showStateInformation
                item={item}
            />
        </Spacer>
    );
}
