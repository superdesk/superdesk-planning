import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {ICON_COLORS} from '../../../constants';
import {StateLabel} from '../..';
import {EventScheduleSummary} from '../';
import {ItemIcon} from '../../index';
import {ToggleBox} from '../../UI';
import {Item, Column, Row, ActionMenu, Border} from '../../UI/List';
import {Row as PreviewRow} from '../../UI/Preview';
import {FileInput, LinkInput} from '../../UI/Form';
import {CollapseBox} from '../../UI/CollapseBox';
import {eventUtils, gettext, onEventCapture, editorMenuUtils, stringUtils} from '../../../utils';
import {Location} from '../../Location';
import {ContactsPreviewList} from '../../Contacts';

export const EventMetadata = (
    {
        event,
        dateOnly,
        scrollInView,
        tabEnabled,
        lockedItems,
        onEditEvent,
        noOpen,
        onClick,
        navigation,
        active,
        showIcon,
        showBorder,
        createUploadLink,
        files,
        hideEditIcon,
    }
) => {
    const dateStr = eventUtils.getDateStringForEvent(
        event,
        dateOnly,
        true,
        false
    );
    const isItemLocked = eventUtils.isEventLocked(event, lockedItems);
    const editEventComponent = onEditEvent && !hideEditIcon ?
        (<button data-sd-tooltip="Edit Event"
            data-flow="left"
            onClick={(event) => {
                onEventCapture(event);
                onEditEvent();
            }}>
            <i className="icon-pencil" />
        </button>) : null;

    const eventListView = (
        <Item noBg={!active} activated={active}>
            {showBorder && isItemLocked && <Border state="locked" />}
            <div className="sd-list-item__border" />
            {showIcon && <Column>
                <ItemIcon
                    item={event}
                    color={ICON_COLORS.DARK_BLUE_GREY}
                />
            </Column>}
            <Column grow={true} border={false}>
                <Row>
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                        <span className="sd-list-item__text-strong">{event.name}</span>
                    </span>
                </Row>
                <Row>
                    <time className="no-padding">
                        <i className="icon-time"/>
                        {dateStr}
                    </time>
                </Row>
            </Column>
            <Column>
                <StateLabel
                    item={event}
                    verbose={true}
                    className="pull-right"
                    withExpiredStatus={true}
                />
            </Column>
            {editEventComponent && <ActionMenu>{editEventComponent}</ActionMenu>}
        </Item>
    );

    const eventInDetailTopBar = (
        <Item noBg={true} noHover={true}>
            <Column border={false}>
                <ItemIcon
                    item={event}
                    doubleSize={true}
                    color={ICON_COLORS.DARK_BLUE_GREY}
                />
            </Column>
            <Column border={false} grow={true}>
                {get(event, 'location.name') ? (
                    <div>
                        <Row>
                            <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                                <span className="sd-list-item__text-strong">{event.name}</span>
                            </span>
                        </Row>
                        <Row>
                            <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                                <Location
                                    name={get(event, 'location.name')}
                                    address={get(event, 'location.formatted_address')}
                                    details={get(event, 'location.details[0]')}
                                />
                            </span>
                            <time>{dateStr}</time>
                        </Row>
                    </div>
                ) : (
                    <Row>
                        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                            <span className="sd-list-item__text-strong">{event.name}</span>
                        </span>
                        <time>{dateStr}</time>
                    </Row>
                )}
            </Column>
        </Item>
    );

    const contacts = get(event, 'event_contact_info') || [];
    const eventInDetail = (
        <div>
            <PreviewRow>
                <StateLabel item={event} verbose={true}/>
            </PreviewRow>
            <PreviewRow label={gettext('Name')} value={event.name} />
            <EventScheduleSummary schedule={event}/>
            <PreviewRow label={gettext('Location')}>
                <div>
                    <Location
                        name={get(event, 'location.name')}
                        address={get(event, 'location.formatted_address')}
                        multiLine={true}
                        details={get(event, 'location.details[0]')}
                    />
                </div>
            </PreviewRow>
            <PreviewRow label={gettext('Occurrence Status')}
                value={get(event, 'occur_status.name', '')} />

            <PreviewRow
                label={gettext('Description')}
                value={stringUtils.convertNewlineToBreak(event.definition_short || '-')}
            />

            <PreviewRow label={gettext('Contacts')}>
                {contacts.length > 0 ? (
                    <ContactsPreviewList
                        contactIds={contacts}
                        scrollInView={true}
                        scrollIntoViewOptions={{block: 'center'}}
                        tabEnabled={true}
                        readOnly={true}
                        inner={true}
                    />
                ) : (
                    <div>-</div>
                )}
            </PreviewRow>

            <ToggleBox
                title={gettext('Attached Files')}
                badgeValue={get(event, 'files.length', 0) > 0 ? event.files.length : null}
                scrollInView={scrollInView}
                isOpen={false}>
                {get(event, 'files.length') > 0 ?
                    (<ul>
                        {get(event, 'files', []).map((file, index) => (
                            <li key={index}>
                                <FileInput
                                    value={file}
                                    createLink={createUploadLink}
                                    readOnly={true}
                                    noMargin={false}
                                    files={files} />
                            </li>
                        ))}
                    </ul>) :
                    <span className="sd-text__info">{gettext('No attached files added.')}</span>
                }
            </ToggleBox>
            <ToggleBox
                title={gettext('External Links')}
                badgeValue={get(event, 'links.length', 0) > 0 ? event.links.length : null}
                scrollInView={scrollInView}
                isOpen={false}>
                {get(event, 'links.length') > 0 ?
                    <ul>
                        {get(event, 'links', []).map((link, index) => (
                            <li key={index}>
                                <LinkInput value={link} readOnly={true} noMargin={false} />
                            </li>
                        ))}
                    </ul> :
                    <span className="sd-text__info">{gettext('No external links added.')}</span>}
            </ToggleBox>
        </div>
    );

    const isOpen = editorMenuUtils.isOpen(navigation, 'event');
    const onClose = editorMenuUtils.onItemClose(navigation, 'event');
    const onOpen = editorMenuUtils.onItemOpen(navigation, 'event');
    const forceScroll = editorMenuUtils.forceScroll(navigation, 'event');

    return (<CollapseBox
        collapsedItem={eventListView}
        openItemTopBar={eventInDetailTopBar}
        openItem={eventInDetail}
        scrollInView={scrollInView}
        tabEnabled={tabEnabled}
        tools={editEventComponent}
        noOpen={noOpen}
        isOpen={isOpen}
        onClose={onClose}
        onOpen={onOpen}
        onClick={onClick}
        forceScroll={forceScroll}
    />);
};

EventMetadata.propTypes = {
    event: PropTypes.object,
    dateOnly: PropTypes.bool,
    scrollInView: PropTypes.bool,
    tabEnabled: PropTypes.bool,
    onEditEvent: PropTypes.func,
    onOpen: PropTypes.func,
    onClick: PropTypes.func,
    noOpen: PropTypes.bool,
    navigation: PropTypes.object,
    active: PropTypes.bool,
    lockedItems: PropTypes.object,
    showIcon: PropTypes.bool,
    showBorder: PropTypes.bool,
    createUploadLink: PropTypes.func,
    files: PropTypes.object,
    hideEditIcon: PropTypes.bool,
};


EventMetadata.defaultProps = {
    scrollInView: true,
    showIcon: true,
    showBorder: true,
};
