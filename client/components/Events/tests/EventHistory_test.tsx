import React from 'react';
import {mount} from 'enzyme';
import {noop} from 'lodash';

import '../../../utils/testUtils';
import {users, desks} from '../../../utils/testData';
import {EventHistory} from '../EventHistory';
import {CoverageHistory} from '../../Coverages';

describe('<EventHistory />', () => {
    const historyItems = [
        {
            _id: 'h1',
            item_id: 'e1',
            item_type: 'event',
            operation: 'create',
            _created: '2026-07-16T09:39:57+0000',
            user_id: 'ident1',
            update: {name: 'Event 1'},
        },
        {
            _id: 'h2',
            item_id: 'e1',
            item_type: 'event',
            operation: 'coverage_created',
            _created: '2026-07-16T09:40:00+0000',
            user_id: 'ident1',
            update: {
                coverage_id: 'c1',
                assigned_to: {desk: 123, user: 'ident1'},
                planning: {g2_content_type: 'text', scheduled: '2026-07-17T09:00:00+0000'},
            },
        },
        {
            _id: 'h3',
            item_id: 'e1',
            item_type: 'event',
            operation: 'reassigned',
            _created: '2026-07-16T09:41:00+0000',
            user_id: 'ident1',
            update: {
                coverage_id: 'c1',
                assigned_to: {desk: 123, user: 'ident1'},
            },
        },
    ];

    const getWrapper = () => mount(
        <EventHistory
            historyItems={historyItems}
            users={users}
            desks={desks}
            contentTypes={[]}
            openItemPreview={noop}
        />
    );

    it('renders event operations in the list and coverage operations grouped per coverage', () => {
        const wrapper = getWrapper();

        expect(wrapper.find('ul.history-list--no-padding > li.item').length).toBe(1);
        expect(wrapper.find('ul.history-list--no-padding > li.item').text()).toContain('Created');

        expect(wrapper.find(CoverageHistory).length).toBe(1);

        wrapper.find('.sd-collapse-box').simulate('click');
        wrapper.update();

        const coverageRows = wrapper.find(CoverageHistory).find('.history-list .item');

        expect(coverageRows.length).toBe(2);
        expect(coverageRows.at(0).text()).toContain('Politic Desk');
    });
});
