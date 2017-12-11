import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {gettext, getCreator, eventUtils, getLockedUser} from '../../utils';
import {PRIVILEGES, EVENTS, GENERIC_ITEM_ACTIONS, TOOLTIPS, MODALS, FORM_NAMES} from '../../constants';
import * as selectors from '../../selectors'
import * as actions from '../../actions'
import {get} from 'lodash'
import {Row} from '../UI/Preview';
import {
    AuditInformation,
    ItemActionsMenu,
    EventScheduleSummary,
    ToggleBox,
    EventCalendarField,
    RelatedPlannings,
    LockContainer
} from '../index'
import {GeoLookupInput, FileField, LinkField} from '../fields'

export class EventPreviewContentComponent extends React.Component {
    getEventActions() {
        const {
            session,
            privileges,
            item,
            duplicateEvent,
            lockedItems,
        } = this.props;

        if (!get(item, '_id')) {
            return [];
        }

        const actions = [
            {
                ...GENERIC_ITEM_ACTIONS.DUPLICATE,
                callback: duplicateEvent.bind(null, item),
            },
        ];

        return eventUtils.getEventItemActions(
            item,
            session,
            privileges,
            actions,
            lockedItems
        );
    }

    render () {
        const {item, users, session, lockedItems, formProfile} = this.props;
        const createdBy = getCreator(item, 'original_creator', users);
        const updatedBy = getCreator(item, 'version_creator', users);
        const creationDate = get(item, '_created');
        const updatedDate = get(item, '_updated');
        const versionCreator = get(updatedBy, 'display_name') ? updatedBy :
            users.find((user) => user._id === updatedBy);
        const lockedUser = getLockedUser(item, lockedItems, users);
        const lockRestricted = eventUtils.isEventLockRestricted(item, session, lockedItems);

        const itemActions = this.getEventActions(lockRestricted);
        const calendarsText = get(item, 'calendars.length', 0) === 0 ? '' :
            item.calendars.map(c => c.name).join(', ')
        const categoryText = get(item, 'anpa_category.length', 0) === 0 ? '' :
            item.anpa_category.map(c => c.name).join(', ')
        const subjectText = get(item, 'subject.length', 0) === 0 ? '' :
            item.subject.map(s => s.name).join(', ')

        return (
            <div>
                <AuditInformation
                    createdBy={createdBy}
                    updatedBy={versionCreator}
                    createdAt={creationDate}
                    updatedAt={updatedDate}
                />
                {get(formProfile, 'editor.slugline.enabled') && <Row
                    label={gettext('Slugline')}
                    value={item.slugline || ''}
                    className="slugline"
                />}
                {get(formProfile, 'editor.name.enabled') && <Row
                    label={gettext('Name')}
                    value={item.name || ''}
                    className="strong"
                />}
                {get(formProfile, 'editor.definition_short.enabled') && <Row
                    label={gettext('Description')}
                    value={item.definition_short || ''}
                />}
                {get(formProfile, 'editor.occur_status.enabled') && <Row
                    label={gettext('Occurance Status')}
                    value={get(item, 'occur_status.name', '')}
                />}
                <EventScheduleSummary schedule={item.dates}/>
                {get(formProfile, 'editor.location.enabled') &&
                    get(item, 'location.length') > 0 &&
                    <Row label={gettext('Location')}>
                        <div>{item.location[0].name}</div>
                        <div>{item.location[0].formatted_address}</div>
                    </Row>}
                <ToggleBox title="Details" isOpen={false}>
                    {get(formProfile, 'editor.calendars.enabled') && <Row
                            label={gettext('Calenders')}
                            value={calendarsText}
                        />
                    }
                    {get(formProfile, 'editor.anpa_category.enabled') && <Row
                            label={gettext('Category')}
                            value={categoryText}
                        />
                    }
                    {get(formProfile, 'editor.subject.enabled') && <Row
                            label={gettext('Subject')}
                            value={subjectText}
                        />
                    }
                    {get(formProfile, 'editor.definition_long.enabled') && <Row
                            label={gettext('Long Description')}
                            value={item.definition_long || ''}
                        />
                    }
                    {get(formProfile, 'editor.internal_note.enabled') && <Row
                            label={gettext('Internal Note')}
                            value={item.internal_note || ''}
                        />
                    }
                </ToggleBox>
                {get(formProfile, 'editor.files.enabled') &&
                    <ToggleBox title="Attached Files" isOpen={false}>
                        <ul>
                            {get(item, 'files', []).map((file, index) => (
                                <FileField
                                    key={index}
                                    file={file}
                                    readOnly={true} />
                            ))}
                        </ul>
                    </ToggleBox>
                }
                {get(formProfile, 'editor.links.enabled') &&
                    <ToggleBox title="External Links" isOpen={false}>
                        <ul>
                            {get(item, 'links', []).map((link, index) => (
                                <LinkField
                                    link={link}
                                    key={index}
                                    readOnly={true} />
                            ))}
                        </ul>
                    </ToggleBox>
                }
                <ToggleBox title="Related Planning Items" isOpen={false}>
                    <RelatedPlannings plannings={item._plannings}
                        openPlanningItem={true}/>
                </ToggleBox>
            </div>
        );
    }    
}

EventPreviewContentComponent.propTypes = {
    item: PropTypes.object,
};

const mapStateToProps = (state, ownProps) => ({
    item: selectors.events.eventWithRelatedDetails(state),
    session: selectors.getSessionDetails(state),
    privileges: selectors.getPrivileges(state),
    users: selectors.getUsers(state),
    lockedItems: selectors.getLockedItems(state),
    formProfile: selectors.getEventsFormsProfile(state),
});

const mapDispatchToProps = (dispatch) => ({
    duplicateEvent: (event) => dispatch(actions.duplicateEvent(event)),
    onUnlock: (event) => dispatch(actions.events.ui.unlockAndOpenEventDetails(event)),
});

export const EventPreviewContent = connect(mapStateToProps, mapDispatchToProps)(EventPreviewContentComponent);
