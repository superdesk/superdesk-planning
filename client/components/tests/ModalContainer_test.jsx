import React from 'react';
import {mount, ReactWrapper} from 'enzyme';
import {ModalsContainer} from '../ModalsContainer';
import {Provider} from 'react-redux';
import * as actions from '../../actions';
import {createTestStore} from '../../utils';
import sinon from 'sinon';

// TODO: To be revisited
xdescribe('<ModalsContainer />', () => {
    it('open a confirmation modal', () => {
        const store = createTestStore({ });
        const wrapper = mount(
            <Provider store={store}>
                <ModalsContainer />
            </Provider>
        );
        const action = sinon.spy();

        expect(wrapper.find('ConfirmationModal').length).toBe(0);
        store.dispatch(actions.showModal({
            modalType: 'CONFIRMATION',
            modalProps: {
                body: 'Are you sure you want to spike event?',
                action: action,
            },
        }));

        const confirmationModal = wrapper.find('ConfirmationModal');
        const dialog = wrapper.find('Portal');
        const modal = new ReactWrapper(<Provider store={store}>{dialog.getElement()}</Provider>);

        expect(confirmationModal.length).toBe(1);
        expect(modal.text()).toContain('Are you sure you want to spike event');
        modal.find('.btn--primary').simulate('click');
        expect(action.calledOnce).toBe(true);
    });
});
