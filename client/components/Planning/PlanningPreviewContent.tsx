import React from 'react';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {getUserInterfaceLanguage} from 'appConfig';

import {IDesk, IUser} from 'superdesk-api';
import {superdeskApi} from '../../superdeskApi';
import {
    IEventItem,
    IFile,
    IFormProfiles,
    ILockedItems,
    IPlanningItem,
    IPlanningNewsCoverageStatus,
    ISession,
    PREVIEW_PANEL,
} from '../../interfaces';

import {eventUtils, getCreator, getFileDownloadURL} from '../../utils';
import * as selectors from '../../selectors';
import * as actions from '../../actions';

import {
    AuditInformation,
    StateLabel,
    Label,
} from '../index';
import {ToggleBox} from '../UI';
import {FileInput} from '../UI/Form';
import {CoveragePreview} from '../Coverages';
import {ContentBlock} from '../UI/SidePanel';
import {EventMetadata} from '../Events';
import {FeatureLabel} from './FeaturedPlanning';
import {previewGroupToProfile, renderGroupedFieldsForPanel} from '../fields';

interface IProps {
    item: IPlanningItem;
    users: Array<IUser>;
    desks: Array<IDesk>;
    session: ISession;
    lockedItems: ILockedItems;
    formProfile: IFormProfiles;
    event?: IEventItem;
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;
    onEditEvent(): void; // TODO - match code
    inner: boolean;
    noPadding: boolean;
    fetchEventFiles(event: IEventItem): void; // TODO - match code
    fetchPlanningFiles(item: IPlanningItem): void; // TODO - match code
    hideRelatedItems?: boolean;
    files: Array<IFile>;
    hideEditIcon?: boolean;
    planningAllowScheduledUpdates: boolean;
}

const mapStateToProps = (state, ownProps) => ({
    item: selectors.planning.currentPlanning(state) || ownProps.item,
    event: selectors.events.planningWithEventDetails(state),
    session: selectors.general.session(state),
    privileges: selectors.general.privileges(state),
    users: selectors.general.users(state),
    desks: selectors.general.desks(state),
    lockedItems: selectors.locks.getLockedItems(state),
    formProfile: selectors.forms.profiles(state),
    newsCoverageStatus: selectors.general.newsCoverageStatus(state) || ownProps.item.coverages.news_coverage_status,
    files: selectors.general.files(state),
    planningAllowScheduledUpdates: selectors.forms.getPlanningAllowScheduledUpdates(state),
});

const mapDispatchToProps = (dispatch) => ({
    onEditEvent: (event) => dispatch(actions.main.openForEdit(event)),
    fetchEventFiles: (event) => dispatch(actions.events.api.fetchEventFiles(event)),
    fetchPlanningFiles: (planning) => dispatch(actions.planning.api.fetchPlanningFiles(planning)),
});

export class PlanningPreviewContentComponent extends React.PureComponent<IProps> {
    componentWillMount() {
        // If the planning item is associated with an event, get its files
        if (this.props.event) {
            this.props.fetchEventFiles(this.props.event);
        }

        this.props.fetchPlanningFiles(this.props.item);
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {item,
            users,
            formProfile,
            event,
            desks,
            newsCoverageStatus,
            onEditEvent,
            lockedItems,
            inner,
            noPadding,
            hideRelatedItems,
            hideEditIcon,
            files,
            planningAllowScheduledUpdates,
        } = this.props;
        const createdBy = getCreator(item, 'original_creator', users);
        const updatedBy = getCreator(item, 'version_creator', users);
        const creationDate = get(item, '_created');
        const updatedDate = get(item, '_updated');
        const versionCreator = get(updatedBy, 'display_name') ? updatedBy :
            users.find((user) => user._id === updatedBy);
        const hasCoverage = get(item, 'coverages.length', 0) > 0;

        return (
            <ContentBlock noPadding={noPadding}>
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
                        {eventUtils.isEventCompleted(event) && (
                            <Label
                                text={gettext('Event Completed')}
                                iconType="success"
                                isHollow={true}
                            />
                        )}
                        <FeatureLabel item={item} />
                    </div>
                </div>
                {renderGroupedFieldsForPanel(
                    'form-preview',
                    previewGroupToProfile(PREVIEW_PANEL.PLANNING, formProfile?.planning),
                    {
                        item: item,
                        language: getUserInterfaceLanguage(),
                        renderEmpty: true,
                    },
                    {},
                )}
                {get(formProfile, 'planning.editor.files.enabled') && (
                    <ToggleBox
                        title={gettext('Attached Files')}
                        isOpen={false}
                        badgeValue={get(item, 'files.length', 0) > 0 ? item.files.length : null}
                    >
                        {get(item, 'files.length') > 0 ? (
                            <ul>
                                {get(item, 'files', []).map((file, index) => (
                                    <li key={index}>
                                        <FileInput
                                            value={file}
                                            createLink={getFileDownloadURL}
                                            readOnly={true}
                                            files={files}
                                        />
                                    </li>
                                ))}
                            </ul>
                        ) :
                            <span className="sd-text__info">{gettext('No attached files added.')}</span>}
                    </ToggleBox>
                )}
                {!hideRelatedItems && event && (
                    <h3 className="side-panel__heading--big">
                        {gettext('Associated Event')}
                    </h3>
                )}
                {!hideRelatedItems && event && (
                    <EventMetadata
                        event={event}
                        dateOnly={true}
                        onEditEvent={onEditEvent.bind(null, event)}
                        lockedItems={lockedItems}
                        createUploadLink={getFileDownloadURL}
                        files={files}
                        hideEditIcon={hideEditIcon}
                    />
                )}
                {hasCoverage &&
                    (<h3 className="side-panel__heading--big">{gettext('Coverages')}</h3>)}
                {hasCoverage &&
                    (item.coverages.map((c, index) => (
                        <CoveragePreview
                            item={item}
                            key={c.coverage_id}
                            index={index}
                            coverage={c}
                            users= {users}
                            desks= {desks}
                            newsCoverageStatus={newsCoverageStatus}
                            formProfile={formProfile.coverage}
                            inner={inner}
                            files={files}
                            createLink={getFileDownloadURL}
                            planningAllowScheduledUpdates={planningAllowScheduledUpdates}
                        />
                    )))
                }
            </ContentBlock>
        );
    }
}

export const PlanningPreviewContent = connect(mapStateToProps, mapDispatchToProps)(PlanningPreviewContentComponent);
