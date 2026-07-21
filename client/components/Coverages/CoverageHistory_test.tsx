import React from 'react';
import {mount} from 'enzyme';

import '../../utils/testUtils';
import {users, desks} from '../../utils/testData';
import {CoverageHistory} from './CoverageHistory';

describe('<CoverageHistory />', () => {
    const getHistoryData = (items) => ({
        items: items,
        planning: {
            g2_content_type: 'text',
        },
    });

    const getWrapper = (props) => mount(
        <CoverageHistory
            users={users}
            contentTypes={[]}
            {...props}
        />
    );

    const openCollapseBox = (wrapper) => {
        wrapper.find('.sd-collapse-box').simulate('click');
        wrapper.update();
    };

    it('renders coverage_created history when desk is not found', () => {
        const wrapper = getWrapper({
            desks: [],
            historyData: getHistoryData([{
                _id: 'ch1',
                operation: 'coverage_created',
                _created: '2026-07-16T09:39:57+0000',
                user_id: 'ident1',
                update: {
                    assigned_to: {desk: 'nonexistent_desk', user: 'ident1'},
                    planning: {g2_content_type: 'text'},
                },
            }]),
        });

        openCollapseBox(wrapper);

        expect(wrapper.find('.history-list .item').length).toBe(1);
        expect(wrapper.find('.history-list .item').text()).toContain('-');
    });

    it('renders reassigned history when desk is not found', () => {
        const wrapper = getWrapper({
            desks: [],
            historyData: getHistoryData([
                {
                    _id: 'ch1',
                    operation: 'coverage_created',
                    _created: '2026-07-16T09:39:57+0000',
                    user_id: 'ident1',
                    update: {
                        assigned_to: {desk: 'nonexistent_desk', user: 'ident1'},
                        planning: {g2_content_type: 'text'},
                    },
                },
                {
                    _id: 'ch2',
                    operation: 'reassigned',
                    _created: '2026-07-16T09:40:00+0000',
                    user_id: 'ident1',
                    update: {
                        assigned_to: {desk: 'nonexistent_desk', user: 'ident1'},
                    },
                },
            ]),
        });

        openCollapseBox(wrapper);

        expect(wrapper.find('.history-list .item').length).toBe(2);
        expect(wrapper.find('.history-list .item')
            .at(1)
            .text()).toContain('-');
    });

    it('renders coverage_created history when desk is found', () => {
        const wrapper = getWrapper({
            desks: desks,
            historyData: getHistoryData([{
                _id: 'ch1',
                operation: 'coverage_created',
                _created: '2026-07-16T09:39:57+0000',
                user_id: 'ident1',
                update: {
                    assigned_to: {desk: 123, user: 'ident1'},
                    planning: {g2_content_type: 'text'},
                },
            }]),
        });

        openCollapseBox(wrapper);

        expect(wrapper.find('.history-list .item').length).toBe(1);
        expect(wrapper.find('.history-list .item').text()).toContain('Politic Desk');
    });
});
