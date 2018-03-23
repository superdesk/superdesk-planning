import React from 'react';
import {shallow} from 'enzyme';
import {PlanningHistoryList} from '../index';
import sinon from 'sinon';

describe('<PlanningHistoryList />', () => {
    let planningHistoryItems = [
        {
            _id: 'p1',
            _created: '2017-06-27T01:40:36+0000',
            planning_id: 'p1',
            operation: 'create',
            update: {
                headline: 'Test Planning item',
                slugline: 'July planning item',
            },
            user_id: 'admin1',
        },
        {
            _id: 'p1',
            _created: '2017-06-27T01:49:12+0000',
            planning_id: 'p1',
            operation: 'update',
            update: {
                headline: 'Test Planning item for July',
                slugline: 'July planning item 2017',
            },
            user_id: 'admin1',
        },
        {
            _id: 'p1',
            _created: '2017-06-27T02:47:32+0000',
            planning_id: 'p1',
            operation: 'spiked',
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

    const getShallowWrapper = () => (
        shallow(<PlanningHistoryList planningHistoryItems={planningHistoryItems} users={users} />)
    );

    it('renders planning history', () => {
        let wrapper = getShallowWrapper();

        expect(wrapper).toBeDefined();

        // Can display all available planningHistoryItems
        expect(wrapper.find('.item').length).toEqual(3);

        // Can display corresponding all 3 history actions in order
        expect(wrapper.find('strong').map((e) => e.text()))
            .toEqual([
                'Created by ',
                'Updated by ',
                'Spiked by ',
            ]);

        expect(users.find.calledThrice).toBe(true);

        // Can display updated fields when planningHistoryItems.operation was 'update'
        expect(wrapper.find('.more-description').first()
            .map((e) => e.text()))
            .toEqual(['Updated Fields: headline, slugline']);
    });
});
