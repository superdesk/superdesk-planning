import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {gettext, getCreator, stringUtils, getFileDownloadURL} from '../../utils';
import {TO_BE_CONFIRMED_FIELD} from '../../constants';
import * as selectors from '../../selectors';

import {Row, ExpandableText} from '../UI/Preview';
import {
    AuditInformation,
    RelatedPlannings,
    StateLabel,
} from '../index';
import {EventScheduleSummary} from './';
import {ToggleBox, FileReadOnlyList} from '../UI';
import {ContentBlock} from '../UI/SidePanel';
import {LinkInput} from '../UI/Form';
import {Location} from '../Location';
import * as actions from '../../actions';
import {ContactsPreviewList} from '../Contacts/index';
import CustomVocabulariesPreview from '../CustomVocabulariesPreview';

export class EventPreviewContentComponent extends React.Component {
    componentWillMount() {
        this.props.fetchEventFiles(this.props.item);
    }

    render() {
        const {
            item,
            users,
            desks,
            formProfile,
            customVocabularies,
            hideRelatedItems,
            files,
        } = this.props;
        const createdBy = getCreator(item, 'original_creator', users);
        const updatedBy = getCreator(item, 'version_creator', users);
        const creationDate = get(item, '_created');
        const updatedDate = get(item, '_updated');
        const versionCreator = get(updatedBy, 'display_name') ? updatedBy :
            users.find((user) => user._id === updatedBy);

        const calendarsText = get(item, 'calendars.length', 0) === 0 ? gettext('No calendars assigned.') :
            item.calendars.map((c) => c.name).join(', ');
        const placeText = get(item, 'place.length', 0) === 0 ? '' :
            item.place.map((c) => c.name).join(', ');
        const categoryText = get(item, 'anpa_category.length', 0) === 0 ? '' :
            item.anpa_category.map((c) => c.name).join(', ');
        const subjectText = get(item, 'subject.length', 0) === 0 ? '' :
            item.subject.map((s) => s.name).join(', ');
        const contacts = get(item, 'event_contact_info') || [];

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

                <Row
                    enabled={get(formProfile, 'editor.slugline.enabled')}
                    label={gettext('Slugline')}
                    value={item.slugline || ''}
                    className="slugline"
                />
                <Row
                    enabled={get(formProfile, 'editor.name.enabled')}
                    label={gettext('Event name')}
                    value={item.name || ''}
                    className="strong"
                />
                <Row
                    enabled={get(formProfile, 'editor.definition_short.enabled')}
                    label={gettext('Description')}
                    value={stringUtils.convertNewlineToBreak(item.definition_short || '-')}
                />
                <Row
                    enabled={get(formProfile, 'editor.occur_status.enabled')}
                    label={gettext('Occurrence Status')}
                    value={get(item, 'occur_status.name', '')}
                />
                <EventScheduleSummary
                    schedule={{
                        dates: item.dates,
                        [TO_BE_CONFIRMED_FIELD]: get(item, TO_BE_CONFIRMED_FIELD),
                    }}
                />
                <Row
                    enabled={get(formProfile, 'editor.calendars.enabled')}
                    label={gettext('Calendars')}
                    value={calendarsText}
                />

                <Row
                    enabled={get(formProfile, 'editor.place.enabled')}
                    label={gettext('Place')}
                    value={placeText}
                />

                <Row
                    enabled={get(formProfile, 'editor.location.enabled')}
                    label={gettext('Location')}
                >
                    <div>
                        <Location
                            name={get(item, 'location.name')}
                            address={get(item, 'location.formatted_address')}
                            multiLine={true}
                            details={get(item, 'location.details[0]')}
                        />
                    </div>
                </Row>

                <Row
                    enabled={get(formProfile, 'editor.event_contact_info.enabled')}
                    label={gettext('Contacts')}
                >
                    {contacts.length > 0 ? (
                        <ContactsPreviewList
                            contactIds={contacts}
                            scrollInView={true}
                            scrollIntoViewOptions={{block: 'center'}}
                            tabEnabled={true}
                        />
                    ) : (
                        <div>-</div>
                    )}
                </Row>

                <ToggleBox title={gettext('Details')} isOpen={false}>
                    <Row
                        enabled={get(formProfile, 'editor.anpa_category.enabled')}
                        label={gettext('ANPA Category')}
                        value={categoryText}
                    />
                    {!!get(formProfile, 'editor.subject.enabled') && (
                        <Row
                            enabled={get(formProfile, 'planning.editor.subject.enabled')}
                            label={gettext('Subject')}
                            value={subjectText || ''}
                        />
                    )}
                    <CustomVocabulariesPreview customVocabularies={customVocabularies} item={item} />
                    <Row
                        enabled={get(formProfile, 'editor.definition_long.enabled')}
                        label={gettext('Long Description')}
                        value={stringUtils.convertNewlineToBreak(item.definition_long || '-')}
                    />
                    <Row
                        enabled={get(formProfile, 'editor.internal_note.enabled')}
                        label={gettext('Internal Note')}
                    >
                        <ExpandableText value={item.internal_note || '-'} />
                    </Row>
                    <Row
                        enabled={get(formProfile, 'editor.ednote.enabled')}
                        label={gettext('Ed Note')}
                        value={stringUtils.convertNewlineToBreak(item.ednote || '-')}
                    />
                </ToggleBox>

                <FileReadOnlyList
                    formProfile={formProfile}
                    files={files}
                    item={item}
                    createLink={getFileDownloadURL} />

                {get(formProfile, 'editor.links.enabled') &&
                    <ToggleBox
                        title={gettext('External Links')}
                        isOpen={false}
                        badgeValue={get(item, 'links.length', 0) > 0 ? item.links.length : null}>
                        {get(item, 'links.length') > 0 ?
                            <ul>
                                {get(item, 'links', []).map((link, index) => (
                                    <li key={index}>
                                        <LinkInput value={link} readOnly={true} />
                                    </li>
                                ))}
                            </ul> :
                            <span className="sd-text__info">{gettext('No external links added.')}</span>}
                    </ToggleBox>
                }
                {!hideRelatedItems && item._plannings &&
                    <h3 className="side-panel__heading side-panel__heading--big">
                        {gettext('Related Planning Items')}
                    </h3>
                }
                {!hideRelatedItems && get(item, '_plannings.length') > 0 ?
                    <RelatedPlannings
                        className="related-plannings"
                        plannings={item._plannings}
                        openPlanningItem={true}
                        expandable={true}
                        users={users}
                        desks={desks}
                        allowEditPlanning={true} /> :
                    !hideRelatedItems &&
                    <span className="sd-text__info">{gettext('No related planning items.')}</span>
                }

            </ContentBlock>
        );
    }
}

EventPreviewContentComponent.propTypes = {
    item: PropTypes.object,
    users: PropTypes.array,
    desks: PropTypes.array,
    session: PropTypes.object,
    lockedItems: PropTypes.object,
    formProfile: PropTypes.object,
    fetchEventFiles: PropTypes.func,
    customVocabularies: PropTypes.array,
    hideRelatedItems: PropTypes.bool,
    files: PropTypes.object,
};

const mapStateToProps = (state, ownProps) => ({
    item: selectors.events.getEventPreviewRelatedDetails(state),
    session: selectors.general.session(state),
    privileges: selectors.general.privileges(state),
    users: selectors.general.users(state),
    desks: selectors.general.desks(state),
    lockedItems: selectors.locks.getLockedItems(state),
    formProfile: selectors.forms.eventProfile(state),
    customVocabularies: state.customVocabularies,
    files: selectors.general.files(state),
    contacts: selectors.general.contacts(state),
});

const mapDispatchToProps = (dispatch) => ({
    fetchEventFiles: (event) => dispatch(actions.events.api.fetchEventFiles(event)),
});

export const EventPreviewContent = connect(mapStateToProps, mapDispatchToProps)(EventPreviewContentComponent);
