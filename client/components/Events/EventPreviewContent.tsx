import React from 'react';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {IDesk, IUser} from 'superdesk-api';
import {superdeskApi} from '../../superdeskApi';
import {IEventFormProfile, IEventItem} from '../../interfaces';

import {getCreator} from '../../utils';
import {getUserInterfaceLanguageFromCV} from '../../utils/users';
import * as selectors from '../../selectors';

import {
    AuditInformation,
    RelatedPlannings,
    StateLabel,
} from '../index';
import {ContentBlock} from '../UI/SidePanel';
import * as actions from '../../actions';

import {renderProfileGroupedFields} from '../fields';

interface IProps {
    item: IEventItem;
    users: Array<IUser>;
    desks: Array<IDesk>;
    formProfile: IEventFormProfile;
    fetchEventFiles(event: IEventItem): Promise<void>;
    hideRelatedItems?: boolean;
}

const mapStateToProps = (state, ownProps) => ({
    item: selectors.events.getEventPreviewRelatedDetails(state) || ownProps.item,
    privileges: selectors.general.privileges(state),
    users: selectors.general.users(state),
    desks: selectors.general.desks(state),
    formProfile: selectors.forms.eventProfile(state),
    contacts: selectors.general.contacts(state),
});

const mapDispatchToProps = (dispatch) => ({
    fetchEventFiles: (event) => dispatch(actions.events.api.fetchEventFiles(event)),
});

export class EventPreviewContentComponent extends React.PureComponent<IProps> {
    componentWillMount() {
        this.props.fetchEventFiles(this.props.item);
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {
            item,
            users,
            desks,
            formProfile,
            hideRelatedItems,
        } = this.props;
        const createdBy = getCreator(item, 'original_creator', users);
        const updatedBy = getCreator(item, 'version_creator', users);
        const creationDate = get(item, '_created');
        const updatedDate = get(item, '_updated');
        const versionCreator = get(updatedBy, 'display_name') ? updatedBy :
            users.find((user) => user._id === updatedBy);

        // Rendered at the profile position of the `related_plannings` group
        const relatedPlanningsNode = hideRelatedItems ? null : (
            <>
                {item._plannings && (
                    <h3 className="side-panel__heading side-panel__heading--big">
                        {gettext('Related Plannings')}
                    </h3>
                )}
                {get(item, '_plannings.length') > 0 ? (
                    <RelatedPlannings
                        className="related-plannings"
                        plannings={item._plannings}
                        openPlanningItem={true}
                        expandable={true}
                        users={users}
                        desks={desks}
                        allowEditPlanning={true}
                        cardView={true}
                    />
                ) :
                    <span className="sd-text__info">{gettext('No related planning items.')}</span>
                }
            </>
        );

        return (
            <ContentBlock>
                <div className="side-panel__content-block--flex">
                    <div className="side-panel__content-block-inner side-panel__content-block-inner--grow">
                        <AuditInformation
                            createdBy={createdBy}
                            updatedBy={versionCreator}
                            createdAt={creationDate}
                            updatedAt={updatedDate}
                            showStateInformation
                            item={item}
                            withPadding
                        />
                    </div>
                    <div className="side-panel__content-block-inner side-panel__content-block-inner--right">
                        <StateLabel
                            item={item}
                            verbose={true}
                            withExpiredStatus={true}
                        />
                    </div>
                </div>

                {renderProfileGroupedFields(
                    'form-preview',
                    formProfile,
                    {
                        item: item,
                        language: item.language ?? getUserInterfaceLanguageFromCV(),
                        renderEmpty: true,
                        schema: formProfile.schema,
                        profile: formProfile,
                    },
                    {},
                    ['recurring_rules', 'related_plannings'],
                    {related_plannings: relatedPlanningsNode},
                )}
            </ContentBlock>
        );
    }
}

export const EventPreviewContent = connect(mapStateToProps, mapDispatchToProps)(EventPreviewContentComponent);
