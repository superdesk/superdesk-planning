import React from 'react';
import {mount} from 'enzyme';

// Configures the enzyme adapter as an import side effect
import '../../../utils/testUtils';

import {PreviewFieldLocation} from './Location';

describe('<PreviewFieldLocation />', () => {
    it('renders a dash when empty and renderEmpty is set', () => {
        const wrapper = mount(<PreviewFieldLocation item={{location: []}} renderEmpty={true} />);

        expect(wrapper.text()).toContain('Location');
        expect(wrapper.text()).toContain('-');
    });

    it('renders nothing when empty without renderEmpty', () => {
        const wrapper = mount(<PreviewFieldLocation item={{location: []}} />);

        expect(wrapper.find('.form__row').length).toBe(0);
    });

    it('renders the location when set', () => {
        const wrapper = mount(
            <PreviewFieldLocation
                item={{location: [{qcode: 'loc1', name: 'City Hall', formatted_address: 'Main St 1'}]}}
            />
        );

        expect(wrapper.text()).toContain('City Hall');
    });
});
