export const showModal = ({modalType, modalProps = {}}) => ({
    type: 'SHOW_MODAL',
    modalType: modalType,
    modalProps: modalProps,
});
export const hideModal = (clearPreviousState = false) => ({
    type: 'HIDE_MODAL',
    payload: {clearPreviousState},
});
export const actionInProgress = (value) => ({
    type: 'ACTION_IN_PROGRESS',
    payload: value,
});

export const clearPrevious = () => ({type: 'MODAL_CLEAR_PREVIOUS'});
