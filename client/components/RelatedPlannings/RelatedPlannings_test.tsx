import React from 'react';
import {mount} from 'enzyme';
import '../../utils/testUtils';
import {RelatedPlannings} from '../RelatedPlannings';
import * as selectors from '../../selectors';
import {createTestStore} from '../../utils';
import {Provider} from 'react-redux';
import {appConfig} from 'appConfig';
import {ItemIcon} from '../ItemIcon';
import {LineItems} from '../UI/List/LineItems';
import {RelatedPlanningListItem} from './PlanningMetaData/RelatedPlanningListItem';

describe('<RelatedPlannings />', () => {
    it('fetches agenda for the planning item from store', () => {
        const initialState = {
            planning: {
                plannings: {
                    3: {
                        _id: '3',
                        slugline: 'planning 3',
                        original_creator: {display_name: 'ABC'},
                        agendas: ['1', '2'],
                        related_events: [{
                            _id: 'event1',
                            link_type: 'primary',
                        }],
                    },
                },
            },
            agenda: {
                agendas: [
                    {
                        _id: '1',
                        name: 'agenda1',
                        is_enabled: true,
                    },
                    {
                        _id: '2',
                        name: 'agenda2',
                        is_enabled: true,
                    },
                ],
                currentAgendaId: '1',
            },
            events: {
                events: {
                    event1: {
                        _id: 'event1',
                        dates: {
                            start: '2016-10-15T14:30+0000',
                            end: '2016-10-20T15:00+0000',
                        },
                        definition_short: 'definition_short 1',
                        location: [{name: 'location1'}],
                        name: 'name1',
                        planning_ids: ['3'],
                    },
                },
            },
            forms: {
                editors: {
                    panel: {
                        itemId: 'event1',
                        itemType: 'event',
                    },
                },
            },
        };

        const store = createTestStore({initialState: initialState});

        const wrapper = mount(
            <Provider store={store}>
                <RelatedPlannings
                    plannings={selectors.events.getRelatedPlannings(store.getState())}
                    openPlanning={true}
                />
            </Provider>
        );

        const relPlanningNode = wrapper.find('.simple-list').childAt(0);

        expect(relPlanningNode.text()).toBe(' planning 3 created by ABC in agenda agenda1, agenda2');
    });
});

describe('<RelatedPlannings /> card view', () => {
    const plan = {
        _id: '3',
        type: 'planning',
        slugline: 'planning 3',
        description_text: 'planning description',
    };

    const renderPlannings = (props = {}) => mount(
        <Provider store={createTestStore()}>
            <RelatedPlannings
                plannings={[plan]}
                openPlanningItem={true}
                expandable={true}
                allowEditPlanning={false}
                {...props}
            />
        </Provider>
    );

    afterEach(() => {
        delete appConfig.planning.planning_list_item;
    });

    it('renders the configured card_view fields and drops the ones card_view omits', () => {
        appConfig.planning.planning_list_item = {
            firstLine: [{fieldId: 'slugline'}, {fieldId: 'description'}],
            card_view: {
                firstLine: [{fieldId: 'description'}],
                secondLine: [{fieldId: 'state'}],
            },
        };

        const listItem = renderPlannings({cardView: true}).find(RelatedPlanningListItem);

        expect(listItem.find('span.sd-list-item__description').text()).toBe('planning description');
        expect(listItem.find('span.sd-list-item__slugline').length).toBe(0);
    });

    it('falls back to the configured list config when card_view is not configured', () => {
        appConfig.planning.planning_list_item = {
            firstLine: [{fieldId: 'slugline'}],
        };

        const listItem = renderPlannings({cardView: true}).find(RelatedPlanningListItem);

        expect(listItem.find('span.sd-list-item__slugline').text()).toBe('planning 3');
        expect(listItem.find('span.sd-list-item__description').length).toBe(0);
    });

    it('renders the same lines as the list view when nothing is configured', () => {
        const cardLines = renderPlannings({cardView: true}).find(LineItems)
            .html();
        const listLines = renderPlannings().find(LineItems)
            .html();

        expect(cardLines).toBe(listLines);
    });

    it('does not render the item icon in card view even when showIcon is true', () => {
        const cardItem = renderPlannings({cardView: true}).find(RelatedPlanningListItem);
        const listItem = renderPlannings().find(RelatedPlanningListItem);

        expect(cardItem.find(ItemIcon).length).toBe(0);
        expect(listItem.find(ItemIcon).length).toBe(1);
    });

    it('renders no second line when card_view omits it', () => {
        appConfig.planning.planning_list_item = {
            firstLine: [{fieldId: 'slugline'}],
            secondLine: [{fieldId: 'state'}],
            card_view: {
                firstLine: [{fieldId: 'description'}],
            },
        };

        const listItem = renderPlannings({cardView: true}).find(RelatedPlanningListItem);

        expect(listItem.find(LineItems).prop('secondLine')).toEqual([]);
    });

    it('renders no first line when card_view omits it', () => {
        appConfig.planning.planning_list_item = {
            firstLine: [{fieldId: 'slugline'}],
            card_view: {
                secondLine: [{fieldId: 'state'}],
            },
        } as any;

        const listItem = renderPlannings({cardView: true}).find(RelatedPlanningListItem);

        expect(listItem.find(LineItems).prop('firstLine')).toEqual([]);
    });

    it('never nests planning cards, even when card_view configures related_events', () => {
        appConfig.planning.planning_list_item = {
            firstLine: [{fieldId: 'slugline'}],
            card_view: {
                firstLine: [{fieldId: 'slugline'}, {fieldId: 'related_events'}],
            },
        };

        const listItem = renderPlannings({cardView: true}).find(RelatedPlanningListItem);

        expect(listItem.find(LineItems).prop('firstLine'))
            .toEqual([{fieldId: 'slugline'}]);
    });
});
