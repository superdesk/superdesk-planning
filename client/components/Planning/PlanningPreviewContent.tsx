import React from 'react';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {IDesk, IUser} from 'superdesk-api';
import {superdeskApi} from '../../superdeskApi';
import {
    IEventItem,
    IFile,
    IFormProfiles,
    ILockedItems, IPlanningCoverageItem,
    IPlanningItem,
    IPlanningNewsCoverageStatus,
    ISession,
    PREVIEW_PANEL,
} from '../../interfaces';

import {eventUtils, getCreator, getFileDownloadURL} from '../../utils';
import {getUserInterfaceLanguageFromCV} from '../../utils/users';
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
import {getRelatedEventIdsForPlanning} from '../../utils/planning';

interface IOwnProps {
    inner?: boolean;
    noPadding?: boolean;
    hideRelatedItems?: boolean;
    hideEditIcon?: boolean;
    currentCoverageId?: IPlanningCoverageItem['coverage_id'];
}

interface IReduxProps {
    item: IPlanningItem;
    relatedEvents: Array<IEventItem> | null;
    session: ISession;
    privileges: any;
    users: Array<IUser>;
    desks: Array<IDesk>;
    lockedItems: ILockedItems;
    formProfile: IFormProfiles;
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;
    files: Array<IFile>;
    planningAllowScheduledUpdates: boolean;
}

interface IDispatchProps {
    onEditEvent(event): void; // TODO - match code

    // TODO: Multiple related events - If BE supports bulk fetch for an array of events use it
    fetchEventFiles(event: IEventItem): void; // TODO - match code
    fetchPlanningFiles(item: IPlanningItem): void; // TODO - match code
}

type IProps = IOwnProps & IReduxProps & IDispatchProps;

const mapStateToProps = (state, ownProps): IReduxProps => ({
    item: selectors.planning.currentPlanning(state) || ownProps.item,
    relatedEvents: selectors.events.getRelatedEventsForPlanning(state),
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

const mapDispatchToProps = (dispatch): IDispatchProps => ({
    onEditEvent: (event) => dispatch(actions.main.openForEdit(event)),
    fetchEventFiles: (event) => dispatch(actions.events.api.fetchEventFiles(event)),
    fetchPlanningFiles: (planning) => dispatch(actions.planning.api.fetchPlanningFiles(planning)),
});

export class PlanningPreviewContentComponent extends React.PureComponent<IProps> {
    componentWillMount() {
        // If the planning item is associated with an event, get its files
        if ((this.props.relatedEvents?.length ?? 0) > 0) {
            this.props.relatedEvents.forEach((relatedEvent) => (
                this.props.fetchEventFiles(relatedEvent)
            ));
        }

        this.props.fetchPlanningFiles(this.props.item);
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {item,
            users,
            formProfile,
            relatedEvents,
            desks,
            newsCoverageStatus,
            onEditEvent,
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
        const currentCoverage: IPlanningCoverageItem | null = this.props.currentCoverageId == null ?
            null :
            (item.coverages ?? []).find((coverage) => coverage.coverage_id === this.props.currentCoverageId);
        const otherCoverages: Array<IPlanningCoverageItem> = this.props.currentCoverageId == null ?
            item.coverages ?? [] :
            (item.coverages ?? []).filter((coverage) => coverage.coverage_id !== this.props.currentCoverageId);

        const renderCoverage = (coverage, index) => (
            <CoveragePreview
                item={item}
                key={coverage.coverage_id}
                index={index}
                coverage={coverage}
                users= {users}
                desks= {desks}
                newsCoverageStatus={newsCoverageStatus}
                formProfile={formProfile.coverage}
                inner={inner}
                files={files}
                createLink={getFileDownloadURL}
                planningAllowScheduledUpdates={planningAllowScheduledUpdates}
                scrollInView={true}
            />
        );

        const primaryEventId = getRelatedEventIdsForPlanning(this.props.item, 'primary')[0];
        const primaryRelatedEvent = (relatedEvents ?? []).find((relatedEvent) => relatedEvent._id === primaryEventId);

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
                        {/* TODO: How do we display event status when there's multiple? Primary only? */}
                        {eventUtils.isEventCompleted(primaryRelatedEvent) && (
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
                        language: item.language ?? getUserInterfaceLanguageFromCV(),
                        renderEmpty: true,
                        schema: formProfile?.planning.schema,
                        profile: formProfile?.planning,
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
                        {gettext('Associated Events')}
                    </h3>
                )}
                {!hideRelatedItems && (relatedEvents?.length ?? 0) > 0 && (
                    relatedEvents.map((relatedEvent) => (
                        <EventMetadata
                            key={`related_event--${relatedEvent._id}`}
                            event={relatedEvent}
                            dateOnly={true}
                            onEditEvent={onEditEvent.bind(null, relatedEvent)}
                            createUploadLink={getFileDownloadURL}
                            files={files}
                            hideEditIcon={hideEditIcon}
                        />
                    ))
                )}
                {!hasCoverage ? null : (
                    <React.Fragment>
                        {currentCoverage == null ? (
                            <React.Fragment>
                                <h3 className="side-panel__heading--big">{gettext('Coverages')}</h3>
                                {otherCoverages.map(renderCoverage)}
                            </React.Fragment>
                        ) : (
                            <React.Fragment>
                                <h3 className="side-panel__heading--big">{gettext('This Coverage')}</h3>
                                {renderCoverage(currentCoverage, 0)}

                                {!otherCoverages.length ? null : (
                                    <React.Fragment>
                                        <h3 className="side-panel__heading--big">{gettext('Other Coverages')}</h3>
                                        {otherCoverages.map(renderCoverage)}
                                    </React.Fragment>
                                )}
                            </React.Fragment>
                        )}
                    </React.Fragment>
                )}
            </ContentBlock>
        );
    }
}

export const PlanningPreviewContent = connect(mapStateToProps, mapDispatchToProps)(PlanningPreviewContentComponent);
