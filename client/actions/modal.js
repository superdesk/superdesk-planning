export const showModal = ({ modalType, modalProps=undefined }) => ({
    type: 'SHOW_MODAL',
    modalType,
    modalProps,
})
export const hideModal = () => ({ type: 'HIDE_MODAL' })
export const actionInProgress = (value) => ({
    type: 'ACTION_IN_PROGRESS',
    payload: value,
})
