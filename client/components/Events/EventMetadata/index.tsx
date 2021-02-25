import React from 'react';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {getUserInterfaceLanguage} from 'appConfig';
import {
    IEventItem,
    IEventFormProfile,
    PREVIEW_PANEL,
    IFormNavigation,
    ILockedItems,
    IFile,
} from '../../../interfaces';

import {ICON_COLORS} from '../../../constants';
import {StateLabel} from '../..';
import {ItemIcon} from '../../index';
import {ToggleBox} from '../../UI';
import {ActionMenu, Border, Column, Item, Row} from '../../UI/List';
import {Row as PreviewRow} from '../../UI/Preview';
import {FileInput, LinkInput} from '../../UI/Form';
import {CollapseBox} from '../../UI/CollapseBox';
import {editorMenuUtils, eventUtils, gettext, onEventCapture} from '../../../utils';
import {Location} from '../../Location';
import {eventProfile} from '../../../selectors/forms';
import {previewGroupToProfile, renderGroupedFieldsForPanel} from '../../fields';

interface IProps {
    event: IEventItem;
    lockedItems: ILockedItems,
    files?: Array<IFile> | IFile;
    navigation?: IFormNavigation,
    formProfile: IEventFormProfile;

    onEditEvent?(): void;
    onOpen?(): void;
    onClick?(): void;
    createUploadLink(file: IFile): string;

    dateOnly?: boolean;
    scrollInView?: boolean; // defaults to true
    tabEnabled?: boolean;
    noOpen?: boolean;
    active?: boolean;
    showIcon?: boolean; // defaults to true
    showBorder?: boolean; // defaults to true
    hideEditIcon?: boolean;
}

const mapStateToProps = (state) => ({
    formProfile: eventProfile(state),
});

class EventMetadataComponent extends React.PureComponent<IProps> {
    render() {
        const {
            event,
            dateOnly,
            tabEnabled,
            lockedItems,
            onEditEvent,
            noOpen,
            onClick,
            navigation,
            active,
            createUploadLink,
            files,
            hideEditIcon,
        } = this.props;
        const scrollInView = this.props.scrollInView ?? true;
        const showIcon = this.props.showIcon ?? true;
        const showBorder = this.props.showBorder ?? true;

        const dateStr = eventUtils.getDateStringForEvent(
            event,
            dateOnly,
            true,
            false
        );
        const isItemLocked = eventUtils.isEventLocked(event, lockedItems);
        const editEventComponent = onEditEvent && !hideEditIcon ?
            (
                <button
                    data-sd-tooltip="Edit Event"
                    data-flow="left"
                    onClick={(event) => {
                        onEventCapture(event);
                        onEditEvent();
                    }}
                >
                    <i className="icon-pencil" />
                </button>
            ) : null;

        const eventListView = (
            <Item noBg={!active} activated={active}>
                {showBorder && isItemLocked && <Border state="locked" />}
                <div className="sd-list-item__border" />
                {showIcon && (
                    <Column>
                        <ItemIcon
                            item={event}
                            color={ICON_COLORS.DARK_BLUE_GREY}
                        />
                    </Column>
                )}
                <Column grow={true} border={false}>
                    <Row>
                        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                            <span className="sd-list-item__text-strong">{event.name}</span>
                        </span>
                    </Row>
                    <Row>
                        <time className="no-padding">
                            <i className="icon-time" />
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

        const eventInDetail = (
            <div>
                <PreviewRow>
                    <StateLabel item={event} verbose={true} />
                </PreviewRow>
                {renderGroupedFieldsForPanel(
                    'form-preview',
                    previewGroupToProfile(PREVIEW_PANEL.ASSOCIATED_EVENT, this.props.formProfile),
                    {
                        item: event,
                        language: getUserInterfaceLanguage(),
                        renderEmpty: true,
                    },
                    {}
                )}

                <ToggleBox
                    title={gettext('Attached Files')}
                    badgeValue={get(event, 'files.length', 0) > 0 ? event.files.length : null}
                    scrollInView={scrollInView}
                    isOpen={false}
                >
                    {get(event, 'files.length') > 0 ?
                        (
                            <ul>
                                {get(event, 'files', []).map((file, index) => (
                                    <li key={index}>
                                        <FileInput
                                            value={file}
                                            createLink={createUploadLink}
                                            readOnly={true}
                                            noMargin={false}
                                            files={files}
                                        />
                                    </li>
                                ))}
                            </ul>
                        ) :
                        <span className="sd-text__info">{gettext('No attached files added.')}</span>
                    }
                </ToggleBox>
                <ToggleBox
                    title={gettext('External Links')}
                    badgeValue={get(event, 'links.length', 0) > 0 ? event.links.length : null}
                    scrollInView={scrollInView}
                    isOpen={false}
                >
                    {get(event, 'links.length') > 0 ? (
                        <ul>
                            {get(event, 'links', []).map((link, index) => (
                                <li key={index}>
                                    <LinkInput value={link} readOnly={true} noMargin={false} />
                                </li>
                            ))}
                        </ul>
                    ) :
                        <span className="sd-text__info">{gettext('No external links added.')}</span>}
                </ToggleBox>
            </div>
        );

        const isOpen = editorMenuUtils.isOpen(navigation, 'event');
        const onClose = editorMenuUtils.onItemClose(navigation, 'event');
        const onOpen = editorMenuUtils.onItemOpen(navigation, 'event');
        const forceScroll = editorMenuUtils.forceScroll(navigation, 'event');

        return (
            <CollapseBox
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
            />
        );
    }
}

export const EventMetadata = connect(mapStateToProps)(EventMetadataComponent);
