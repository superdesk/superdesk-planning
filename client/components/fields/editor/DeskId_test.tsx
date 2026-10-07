import React from 'react';
import {mount} from 'enzyme';

// Configures the enzyme adapter as an import side effect
import '../../../utils/testUtils';

import {EditorFieldDeskIdComponent} from './DeskId';

describe('<EditorFieldDeskIdComponent />', () => {
    const desks: Array<any> = [
        {_id: 'desk1', name: 'Politics'},
        {_id: 'desk2', name: 'Sports'},
    ];
    const getWrapper = (props = {}) => mount(
        <EditorFieldDeskIdComponent
            item={{}}
            field="desk"
            onChange={() => undefined}
            desks={desks}
            userDesks={[]}
            {...props}
        />
    );

    it('renders without options when there are no desks', () => {
        const wrapper = getWrapper({desks: []});

        expect(wrapper.find('option').length).toBe(0);
    });

    it('defaults to the first desk', () => {
        const wrapper = getWrapper();

        expect(wrapper.find('option').length).toBe(2);
        expect(wrapper.find('select').props().value).toBe('desk1');
    });

    it('defaults to the first user desk when restricted to the user', () => {
        const wrapper = getWrapper({restrictToUser: true, userDesks: [desks[1]]});

        expect(wrapper.find('option').length).toBe(1);
        expect(wrapper.find('select').props().value).toBe('desk2');
    });
});
