import React from 'react';
import {mount} from 'enzyme';
import '../../../utils/testUtils';
import {EventMetadata} from '../index';
import moment from 'moment';
import {createTestStore, eventUtils} from '../../../utils';
import {Provider} from 'react-redux';
import {appConfig} from 'appConfig';
import {ItemIcon} from '../../ItemIcon';
import {LineItems} from '../../UI/List/LineItems';
import {RelatedEventListItem} from './RelatedEventListItem';

describe('<EventMetadata />', () => {
    it('renders metadata of an event', () => {
        const event = {
            dates: {
                start: moment('2016-10-15T13:01:11+0000'),
                end: moment('2016-10-15T13:02:11+0000'),
                tz: moment.tz.guess(),
            },
            definition_short: 'definition_short 1',
            location: [{
                name: 'location1',
                formatted_address: 'address1',
            }],
            name: 'name1',
            occur_status: {
                name: 'Planned, occurs certainly',
                qcode: 'eocstat:eos5',
            },
            type: 'event',
        };
        let store = createTestStore();
        const wrapper = mount(
            <Provider store={store}>
                <EventMetadata event={event} />
            </Provider>
        );

        wrapper.find('.sd-collapse-box').first()
            .simulate('click');
        const content = wrapper.find('.sd-collapse-box__content');
        const metaDataTexts = content.find('p');

        const eventDateText = eventUtils.getDateStringForEvent(event, false, true, false);

        expect(metaDataTexts.length).toBe(5);
        expect(content.find('[data-test-id="field-name"] > p').text()).toBe('name1');
        expect(content.find('[data-test-id="field-dates"] > p').text()).toBe(eventDateText);
        expect(content.find('[data-test-id="field-occur_status"] > p').text()).toBe('Planned, occurs certainly');
        // `definition_short` is truncatable, so its text renders inside <ExpandableText>
        expect(content.find('[data-test-id="field-definition_short"] p').text()).toBe('definition_short 1');
        expect(content.find('[data-test-id="field-event_contact_info"] > p').text()).toBe('-');
        expect(content.find('[data-test-id="field-location"] a').text()).toBe('location1address1');
    });
});

describe('<EventMetadata /> card view', () => {
    const event = {
        _id: 'event1',
        type: 'event',
        slugline: 'event slugline',
        name: 'event name',
        dates: {
            start: moment('2016-10-15T13:01:11+0000'),
            end: moment('2016-10-15T13:02:11+0000'),
            tz: moment.tz.guess(),
        },
    };

    const renderEvent = (props = {}) => mount(
        <Provider store={createTestStore()}>
            <EventMetadata event={event} {...props} />
        </Provider>
    );

    afterEach(() => {
        delete appConfig.planning.event_list_item;
    });

    it('renders the configured card_view fields and drops the ones card_view omits', () => {
        appConfig.planning.event_list_item = {
            firstLine: [{fieldId: 'slugline'}, {fieldId: 'name'}],
            card_view: {
                firstLine: [{fieldId: 'name'}],
                secondLine: [{fieldId: 'state'}],
            },
        };

        const listItem = renderEvent({cardView: true}).find(RelatedEventListItem);

        expect(listItem.find('span.sd-list-item__name').text()).toBe('event name');
        expect(listItem.find('span.sd-list-item__slugline').length).toBe(0);
    });

    it('falls back to the configured list config when card_view is not configured', () => {
        appConfig.planning.event_list_item = {
            firstLine: [{fieldId: 'slugline'}],
        };

        const listItem = renderEvent({cardView: true}).find(RelatedEventListItem);

        expect(listItem.find('span.sd-list-item__slugline').text()).toBe('event slugline');
        expect(listItem.find('span.sd-list-item__name').length).toBe(0);
    });

    it('renders the same lines as the list view when nothing is configured', () => {
        const cardLines = renderEvent({cardView: true}).find(LineItems)
            .html();
        const listLines = renderEvent().find(LineItems)
            .html();

        expect(cardLines).toBe(listLines);
    });

    it('does not render the item icon in card view even when showIcon is true', () => {
        const cardItem = renderEvent({cardView: true, showIcon: true}).find(RelatedEventListItem);
        const listItem = renderEvent({showIcon: true}).find(RelatedEventListItem);

        expect(cardItem.find(ItemIcon).length).toBe(0);
        expect(listItem.find(ItemIcon).length).toBe(1);
    });

    it('renders no second line when card_view omits it', () => {
        appConfig.planning.event_list_item = {
            firstLine: [{fieldId: 'slugline'}],
            secondLine: [{fieldId: 'state'}],
            card_view: {
                firstLine: [{fieldId: 'name'}],
            },
        };

        const listItem = renderEvent({cardView: true}).find(RelatedEventListItem);

        expect(listItem.find(LineItems).prop('secondLine')).toEqual([]);
    });

    it('renders no first line when card_view omits it', () => {
        appConfig.planning.event_list_item = {
            firstLine: [{fieldId: 'slugline'}],
            card_view: {
                secondLine: [{fieldId: 'state'}],
            },
        };

        const listItem = renderEvent({cardView: true}).find(RelatedEventListItem);

        expect(listItem.find(LineItems).prop('firstLine')).toEqual([]);
    });

    it('never nests event cards, even when card_view configures related_plannings', () => {
        appConfig.planning.event_list_item = {
            firstLine: [{fieldId: 'name'}],
            card_view: {
                firstLine: [{fieldId: 'name'}, {fieldId: 'related_plannings'}],
            },
        };

        const listItem = renderEvent({cardView: true}).find(RelatedEventListItem);

        expect(listItem.find(LineItems).prop('firstLine'))
            .toEqual([{fieldId: 'name'}]);
    });
});
