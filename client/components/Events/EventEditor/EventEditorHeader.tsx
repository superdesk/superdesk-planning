import React from 'react';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {getCreator} from '../../../utils';
import {ContentBlock, ContentBlockInner} from '../../UI/SidePanel';
import {AuditInformation, StateLabel} from '../..';
import {IEventItem} from '../../../interfaces';
import {IUser} from 'superdesk-api';

import {users as getUsers} from '../../../selectors/general';

interface IProps {
    item: IEventItem;
    users: Array<IUser>;
}

const mapStateToProps = (state) => ({
    users: getUsers(state),
});

class EventEditorHeaderComponent extends React.PureComponent<IProps> {
    render() {
        const {item, users} = this.props;

        const createdBy = getCreator(item, 'original_creator', users);
        const updatedBy = getCreator(item, 'version_creator', users);
        const creationDate = item._created;
        const updatedDate = item._updated;
        const versionCreator = get(updatedBy, 'display_name') ?
            updatedBy :
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
                </ContentBlockInner>
            </ContentBlock>
        );
    }
}

export const EventEditorHeader = connect(mapStateToProps)(EventEditorHeaderComponent);
