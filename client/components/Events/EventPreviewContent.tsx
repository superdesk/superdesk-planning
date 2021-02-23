import React from 'react';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {getUserInterfaceLanguage} from 'appConfig';
import {IDesk, IUser} from 'superdesk-api';
import {superdeskApi} from '../../superdeskApi';
import {IEventFormProfile, IEventItem, IFile, PREVIEW_PANEL} from '../../interfaces';

import {getCreator, getFileDownloadURL} from '../../utils';
import * as selectors from '../../selectors';

import {
    AuditInformation,
    RelatedPlannings,
    StateLabel,
} from '../index';
import {ToggleBox, FileReadOnlyList} from '../UI';
import {ContentBlock} from '../UI/SidePanel';
import {LinkInput} from '../UI/Form';
import * as actions from '../../actions';

import {renderGroupedFieldsForPanel, previewGroupToProfile} from '../fields';

interface IProps {
    item: IEventItem;
    users: Array<IUser>;
    desks: Array<IDesk>;
    formProfile: IEventFormProfile;
    fetchEventFiles(event: IEventItem): Promise<void>;
    hideRelatedItems?: boolean;
    files: {[key: string]: IFile};
}

const mapStateToProps = (state) => ({
    item: selectors.events.getEventPreviewRelatedDetails(state),
    privileges: selectors.general.privileges(state),
    users: selectors.general.users(state),
    desks: selectors.general.desks(state),
    formProfile: selectors.forms.eventProfile(state),
    files: selectors.general.files(state),
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
            files,
        } = this.props;
        const createdBy = getCreator(item, 'original_creator', users);
        const updatedBy = getCreator(item, 'version_creator', users);
        const creationDate = get(item, '_created');
        const updatedDate = get(item, '_updated');
        const versionCreator = get(updatedBy, 'display_name') ? updatedBy :
            users.find((user) => user._id === updatedBy);

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

                {renderGroupedFieldsForPanel(
                    'form-preview',
                    previewGroupToProfile(PREVIEW_PANEL.EVENT, formProfile),
                    {
                        item: item,
                        language: getUserInterfaceLanguage(),
                        renderEmpty: true,
                    },
                    {},
                )}

                <FileReadOnlyList
                    formProfile={formProfile}
                    files={files}
                    item={item}
                    createLink={getFileDownloadURL}
                />

                {get(formProfile, 'editor.links.enabled') && (
                    <ToggleBox
                        title={gettext('External Links')}
                        isOpen={false}
                        badgeValue={get(item, 'links.length', 0) > 0 ? item.links.length : null}
                    >
                        {get(item, 'links.length') > 0 ? (
                            <ul>
                                {get(item, 'links', []).map((link, index) => (
                                    <li key={index}>
                                        <LinkInput value={link} readOnly={true} />
                                    </li>
                                ))}
                            </ul>
                        ) :
                            <span className="sd-text__info">{gettext('No external links added.')}</span>}
                    </ToggleBox>
                )}
                {!hideRelatedItems && item._plannings && (
                    <h3 className="side-panel__heading side-panel__heading--big">
                        {gettext('Related Planning Items')}
                    </h3>
                )}
                {!hideRelatedItems && get(item, '_plannings.length') > 0 ? (
                    <RelatedPlannings
                        className="related-plannings"
                        plannings={item._plannings}
                        openPlanningItem={true}
                        expandable={true}
                        users={users}
                        desks={desks}
                        allowEditPlanning={true}
                    />
                ) :
                    !hideRelatedItems &&
                    <span className="sd-text__info">{gettext('No related planning items.')}</span>
                }

            </ContentBlock>
        );
    }
}

export const EventPreviewContent = connect(mapStateToProps, mapDispatchToProps)(EventPreviewContentComponent);
