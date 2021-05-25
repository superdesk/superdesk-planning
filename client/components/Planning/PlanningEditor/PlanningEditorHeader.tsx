import React from 'react';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {IEventItem, IPlanningItem} from '../../../interfaces';
import {IUser} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';

import {getCreator, eventUtils} from '../../../utils';
import {users as getUsers} from '../../../selectors/general';

import {ContentBlock, ContentBlockInner} from '../../UI/SidePanel';
import {AuditInformation, StateLabel, Label} from '../..';
import {FeatureLabel} from '../FeaturedPlanning';

interface IProps {
    item: IPlanningItem;
    event?: IEventItem;
    users: Array<IUser>;
}

const mapStateToProps = (state) => ({
    users: getUsers(state),
});

class PlanningEditorHeaderComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const {item, users, event} = this.props;

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
    }
}

export const PlanningEditorHeader = connect(mapStateToProps)(PlanningEditorHeaderComponent);
