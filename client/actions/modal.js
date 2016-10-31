export const showModal = ({ modalType, modalProps }) => ({
    type: 'SHOW_MODAL', modalType, modalProps
})
export const hideModal = () => ({
    type: 'HIDE_MODAL'
})
