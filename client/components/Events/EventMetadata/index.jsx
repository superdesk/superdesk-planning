import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {StateLabel} from '../..';
import {EventScheduleSummary} from '../';
import {Item, Column, Row} from '../../UI/List';
import {Row as PreviewRow} from '../../UI/Preview';
import {CollapseBox} from '../../UI/CollapseBox';
import {eventUtils, gettext} from '../../../utils';

export const EventMetadata = ({event, dateFormat, timeFormat, dateOnly, scrollInView}) => {
    const dateStr = eventUtils.getDateStringForEvent(event, dateFormat, timeFormat, dateOnly);

    const eventListView = (
        <Item noBg={true}>
            <div className="sd-list-item__border" />
            <Column>{eventUtils.getEventIcon(event)}</Column>
            <Column grow={true} border={false}>
                <Row>
                    <StateLabel item={event} verbose={true}/>
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                        <span className="sd-list-item__text-strong">{event.name}</span>
                    </span>
                    <time title>{dateStr}</time>
                </Row>
            </Column>
        </Item>
    );

    const eventInDetailTopBar = (
        <Item noBg={true} noHover={true}>
            <Column border={false}>
                {eventUtils.getEventIcon(event, true)}
            </Column>
            <Column border={false} grow={true}>
                {get(event, 'location[0].name') ? (
                    <div>
                        <Row>
                            <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                                <span className="sd-list-item__text-strong">{event.name}</span>
                            </span>
                        </Row>
                        <Row>
                            <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                                <span className="sd-list-item__location">{event.location[0].name}</span>
                            </span>
                            <time title>{dateStr}</time>
                        </Row>
                    </div>
                ) : (
                    <Row>
                        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                            <span className="sd-list-item__text-strong">{event.name}</span>
                        </span>
                        <time title>{dateStr}</time>
                    </Row>
                )}
            </Column>
        </Item>
    );

    const eventInDetail = (
        <div>
            <PreviewRow>
                <StateLabel item={event} verbose={true}/>
            </PreviewRow>
            <PreviewRow label={gettext('Name')} value={event.name} />
            <EventScheduleSummary schedule={event.dates}
                dateFormat={dateFormat}
                timeFormat={timeFormat} />
            <PreviewRow label={gettext('Location')}>
                <p>{get(event, 'location[0].name')}<br />{get(event, 'location[0].formatted_address')}</p>
            </PreviewRow>
            <PreviewRow label={gettext('Occurance Status')}
                value={get(event, 'occur_status.name', '')} />
            <PreviewRow label={gettext('Description')}
                value={event.definition_short || ''} />
        </div>
    );

    return (<CollapseBox
        collapsedItem={eventListView}
        openItemTopBar={eventInDetailTopBar}
        openItem={eventInDetail}
        scrollInView={scrollInView}
    />);
};

EventMetadata.propTypes = {
    event: PropTypes.object,
    dateOnly: PropTypes.bool,
    dateFormat: PropTypes.string,
    timeFormat: PropTypes.string,
    scrollInView: PropTypes.bool,
};


EventMetadata.defaultProps = {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    scrollInView: true,
};
