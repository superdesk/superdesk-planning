import {connect} from 'react-redux';
import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {actionUtils} from '../../utils';
import {validateItem} from '../../validators';

import {EditorComponent} from './ItemEditor';

const mapStateToProps = (state) => ({
    item: selectors.forms.currentItem(state),
    itemId: selectors.forms.currentItemId(state),
    itemType: selectors.forms.currentItemType(state),
    initialValues: selectors.forms.initialValues(state),
    users: selectors.general.users(state),
    formProfiles: selectors.forms.profiles(state),
    occurStatuses: selectors.vocabs.eventOccurStatuses(state),
    isLoadingItem: selectors.forms.isLoadingItem(state),
    session: selectors.general.session(state),
    privileges: selectors.general.privileges(state),
    lockedItems: selectors.locks.getLockedItems(state),
    newsCoverageStatus: selectors.general.newsCoverageStatus(state),
});

const mapStateToPropsModal = (state) => ({
    item: selectors.forms.currentItemModal(state),
    itemId: selectors.forms.currentItemIdModal(state),
    itemType: selectors.forms.currentItemTypeModal(state),
    initialValues: selectors.forms.initialValuesModal(state),
    users: selectors.general.users(state),
    formProfiles: selectors.forms.profiles(state),
    occurStatuses: selectors.vocabs.eventOccurStatuses(state),
    isLoadingItem: selectors.forms.isLoadingItemModal(state),
    session: selectors.general.session(state),
    privileges: selectors.general.privileges(state),
    lockedItems: selectors.locks.getLockedItems(state),
    newsCoverageStatus: selectors.general.newsCoverageStatus(state),
    inModalView: !!selectors.forms.currentItemIdModal(state),
});


const mapDispatchToProps = (dispatch) => ({
    onUnlock: (item) => dispatch(actions.locks.unlockThenLock(item)),
    onLock: (item) => dispatch(actions.locks.lock(item)),
    minimize: () => dispatch(actions.main.closeEditor()),
    cancel: (item) => dispatch(actions.main.unlockAndCancel(item)),
    onSave: (item, withConfirmation) => dispatch(actions.main.save(item, withConfirmation)),
    onUnpost: (item) => dispatch(actions.main.unpost(item)),
    onPost: (item) => dispatch(actions.main.post(item)),
    openCancelModal: (modalProps) => dispatch(actions.main.openIgnoreCancelSaveModal(modalProps)),

    onValidate: (type, item, profile, errors, messages) =>
        dispatch(validateItem(type, item, profile, errors, messages)),
    loadItem: (itemId, itemType) => dispatch(actions.main.loadItem(itemId, itemType, 'edit')),
    itemActions: actionUtils.getActionDispatches({dispatch: dispatch}),
    removeNewAutosaveItems: () => dispatch(actions.autosave.removeNewItems()),
    closeEditorAndOpenModal: (item) => dispatch(actions.main.closeEditorAndOpenModal(item)),
    notifyValidationErrors: (errors) => dispatch(actions.main.notifyValidationErrors(errors)),

    saveAutosave: (formName, diff) => dispatch(actions.autosave.save(formName, diff)),
    loadAutosave: (formName, itemId) => dispatch(actions.autosave.load(formName, itemId)),
});

const mapDispatchToPropsModal = (dispatch) => ({
    onUnlock: (item) => dispatch(actions.locks.unlockThenLock(item)),
    onLock: (item) => dispatch(actions.locks.lock(item)),
    minimize: () => dispatch(actions.main.closeEditor()),
    cancel: (item) => dispatch(actions.main.unlockAndCancel(item, true)),
    onSave: (item, withConfirmation) => dispatch(actions.main.save(item, withConfirmation)),
    onUnpost: (item) => dispatch(actions.main.unpost(item)),
    onPost: (item) => dispatch(actions.main.post(item)),
    openCancelModal: (modalProps) => dispatch(actions.main.openIgnoreCancelSaveModal(modalProps)),
    onValidate: (type, item, profile, errors, messages) =>
        dispatch(validateItem(type, item, profile, errors, messages)),
    loadItem: (itemId, itemType) => dispatch(actions.main.loadItem(itemId, itemType, 'edit')),
    itemActions: actionUtils.getActionDispatches({dispatch: dispatch}),
    removeNewAutosaveItems: () => dispatch(actions.autosave.removeNewItems()),
    notifyValidationErrors: (errors) => dispatch(actions.main.notifyValidationErrors(errors)),

    saveAutosave: (formName, diff) => dispatch(actions.autosave.save(formName, diff)),
    loadAutosave: (formName, itemId) => dispatch(actions.autosave.load(formName, itemId)),
});

export const Editor = connect(mapStateToProps, mapDispatchToProps)(EditorComponent);
export const EditorModal = connect(mapStateToPropsModal, mapDispatchToPropsModal)(EditorComponent);
