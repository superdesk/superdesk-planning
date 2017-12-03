import React from 'react';
import {mount} from 'enzyme';
import {StateLabel} from './index';

describe('<StateLabel />', () => {
    it('pubstatus badge is also displayed for items with pubstatus ', () => {
        const item = {
            state: 'scheduled',
            pubstatus: 'usable',
        };

        const wrapper = mount(<StateLabel item={item} verbose={true} />);

        const badges = wrapper.find('.label--success');

        expect(badges.length).toBe(2);
        expect(badges.first().text()).toBe('Scheduled');
        expect(badges.last().text()).toBe('Published');
    });
});
