import {actionInProgress, hideModal, showModal} from '../../actions/modal';
import modal from '../modal';

describe('modal reducer', () => {
    it('resets actionInProgress on an underlying modal after a nested confirmation', () => {
        let state = modal(undefined, {type: 'INIT'});

        state = modal(state, showModal({modalType: 'ADD_TO_PLANNING'}));
        state = modal(state, actionInProgress(true));
        state = modal(state, showModal({modalType: 'CONFIRMATION'}));
        state = modal(state, actionInProgress(false));

        expect(state.actionInProgress).toBe(false);
        expect(state.previousState.actionInProgress).toBe(false);

        state = modal(state, hideModal());

        expect(state.modalType).toBe('ADD_TO_PLANNING');
        expect(state.actionInProgress).toBe(false);
    });
});