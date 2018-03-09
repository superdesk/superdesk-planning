import React from 'react';
import {shallow} from 'enzyme';
import {EventHistoryList} from '../index';
import sinon from 'sinon';

describe('<EventHistoryList />', () => {
    let eventHistoryItems = [
        {
            _id: 'e1',
            _created: '2017-06-27T01:40:36+0000',
            event_id: 'e1',
            operation: 'create',
            update: {
                name: 'Test Event Wollongong',
                slugline: 'June last week event',
                dates: {
                    end: '2017-07-03T10:00:00+0000',
                    start: '2017-06-26T14:00:00+0000',
                    tz: 'Australia/Sydney',
                },
            },
            user_id: 'admin1',
        },
        {
            _id: 'e1',
            _created: '2017-06-27T01:49:12+0000',
            event_id: 'e1',
            operation: 'update',
            update: {
                name: 'Test Event Wollongong 2017',
                slugline: 'June last week event 2017',
            },
            user_id: 'admin1',
        },
        {
            _id: 'e1',
            _created: '2017-06-27T02:47:32+0000',
            event_id: 'e1',
            operation: 'planning created',
            update: {planning_id: 'planningItem1'},
            user_id: 'admin2',
        },
    ];

    let users = [{
        user_id: 'admin1',
        display_name: 'fname1 lname1',
    },
    {
        user_id: 'admin2',
        display_name: 'fname2 lname2',
    }];

    users.find = sinon.spy(() => (Promise.resolve()));

    const openPlanningClick = sinon.spy();

    const getShallowWrapper = () => (
        shallow(<EventHistoryList
            eventHistoryItems={eventHistoryItems}
            users={users}
            openPlanningClick={openPlanningClick} />)
    );

    // TODO: to be revisited
    xit('renders event history', () => {
        let wrapper = getShallowWrapper();

        expect(wrapper).toBeDefined();

        // Can display all available eventHistoryItems
        expect(wrapper.find('.item').length).toEqual(3);

        // Can display corresponding all 3 history actions in order
        expect(wrapper.find('strong').map((e) => e.text()))
            .toEqual([
                'Created by ',
                'Updated by ',
                'Planning item created by ',
            ]);

        expect(users.find.calledThrice).toBe(true);

        // Can display updated fields when eventHistoryItems.operation was 'update'
        expect(wrapper.find('.more-description').first()
            .map((e) => e.text()))
            .toEqual(['Updated Fields: name, slugline']);

        // Can display planning item link when eventHistoryItems.operation was 'planning created'
        const planningItemLink = (wrapper.find('.item').last())
            .find('a');

        expect(planningItemLink.text()).toBe('View planning item');

        // Can execute openPlanningClick callback
        planningItemLink.simulate('click');
        expect(openPlanningClick.calledOnce).toBe(true);
        expect(openPlanningClick.args[0][0]).toEqual(eventHistoryItems[2].update.planning_id);
    });
});
