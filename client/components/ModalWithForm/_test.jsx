import React from 'react';
import {mount} from 'enzyme';
import {ModalWithForm} from '../index';
import {createTestStore} from '../../utils';
import {Provider} from 'react-redux';

// TODO: To be revisited
xdescribe('<ModalWithForm />', () => {
    it('open the modal', () => {
        let initialState = {users: []};

        let store = createTestStore({initialState: initialState});

        const wrapper = mount(
            <Provider store={store}>
                <ModalWithForm
                    title="Title"
                    form={null}
                    initialValues={{field: 'value'}}
                    show={true} />
            </Provider>
        );

        expect(wrapper.find('Component').props().title).toBe('Title');
        expect(wrapper.find('Component').props().show).toBe(true);
        expect(wrapper.find('Component').props().initialValues)
            .toEqual({field: 'value'});
    });
});
