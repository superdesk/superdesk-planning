import React from 'react';
import {mount, ReactWrapper} from 'enzyme';
import {ModalsContainer} from '../ModalsContainer';
import {Provider} from 'react-redux';
import {modalActions} from '../../actions';
import {createTestStore} from '../../utils';
import {restoreSinonStub} from '../../utils/testUtils';
import sinon from 'sinon';

describe('<ModalsContainer />', () => {
    it('opens a confirmation modal and closes on action when autoClose is truthy', () => {
        const store = createTestStore({ });
        const wrapper = mount(
            <Provider store={store}>
                <ModalsContainer />
            </Provider>
        );
        const action = sinon.spy();

        sinon.stub(modalActions, 'hideModal').callsFake(() => ({type: 'HIDE_MODAL'}));

        expect(wrapper.find('ConfirmationModal').length).toBe(0);
        store.dispatch(modalActions.showModal({
            modalType: 'CONFIRMATION',
            modalProps: {
                body: 'Are you sure you want to spike event?',
                action: action,
                itemType: 'event',
                autoClose: true,
            },
        }));

        wrapper.update();

        const confirmationModal = wrapper.find('ConfirmationModal');
        const dialog = wrapper
            .find('Portal')
            .first();
        const modal = new ReactWrapper(<Provider store={store}>{dialog.getElement()}</Provider>);

        expect(confirmationModal.length).toBe(1);
        expect(modal.text()).toContain('Are you sure you want to spike event');
        modal.find('.btn--primary').simulate('click');
        expect(action.callCount).toBe(1);
        expect(modalActions.hideModal.callCount).toBe(1);

        restoreSinonStub(modalActions.hideModal);
    });
});
