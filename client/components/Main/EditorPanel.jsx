import {connect} from 'react-redux';
import {get} from 'lodash';
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
    contentTypes: selectors.general.contentTypes(state),
    defaultDesk: selectors.general.defaultDesk(state),
    preferredCoverageDesks: get(selectors.general.preferredCoverageDesks(state), 'desks'),
    associatedPlannings: selectors.events.getRelatedPlannings(state),
    associatedEvent: selectors.events.planningEditAssociatedEvent(state),
    longEventDurationThreshold: selectors.config.getLongEventDurationThreshold(state),
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
    contentTypes: selectors.general.contentTypes(state),
    defaultDesk: selectors.general.defaultDesk(state),
    preferredCoverageDesks: get(selectors.general.preferredCoverageDesks(state), 'desks'),
    associatedPlannings: selectors.events.getRelatedPlanningsForModalEvent(state),
    associatedEvent: selectors.events.planningEditAssociatedEventModal(state),
    longEventDurationThreshold: selectors.config.getLongEventDurationThreshold(state),
});


const mapDispatchToProps = (dispatch) => ({
    onUnlock: (item) => dispatch(actions.locks.unlockThenLock(item)),
    onLock: (item) => dispatch(actions.main.lockAndEdit(item)),
    minimize: () => dispatch(actions.main.closeEditor()),
    cancel: (item) => dispatch(actions.main.unlockAndCancel(item)),
    onSave: (item, withConfirmation, noSubsequentEditing) =>
        dispatch(actions.main.save(item, withConfirmation, noSubsequentEditing)),
    onUnpost: (item) => dispatch(actions.main.unpost(item)),
    onPost: (item) => dispatch(actions.main.post(item)),
    openCancelModal: (modalProps) => dispatch(actions.main.openIgnoreCancelSaveModal(modalProps)),

    onValidate: (type, item, diff, profile, errors, messages, ignoreDateValidation = false) => dispatch(validateItem({
        profileName: type,
        item: item,
        diff: diff,
        formProfiles: profile,
        errors: errors,
        messages: messages,
        ignoreDateValidation: ignoreDateValidation,
    })),
    loadItem: (itemId, itemType) => dispatch(actions.main.loadItem(itemId, itemType, 'edit')),
    itemActions: actionUtils.getActionDispatches({dispatch: dispatch}),
    closeEditorAndOpenModal: (item) => dispatch(actions.main.closeEditorAndOpenModal(item)),
    notifyValidationErrors: (errors) => dispatch(actions.main.notifyValidationErrors(errors)),

    saveAutosave: (diff) => dispatch(actions.autosave.save(diff)),
    loadAutosave: (itemType, itemId) => dispatch(actions.autosave.fetchById(itemType, itemId, false)),
});

const mapDispatchToPropsModal = (dispatch) => ({
    onUnlock: (item) => dispatch(actions.locks.unlockThenLock(item)),
    onLock: (item) => dispatch(actions.locks.lock(item)),
    minimize: () => dispatch(actions.main.closeEditor()),
    cancel: (item) => dispatch(actions.main.unlockAndCancel(item, true)),
    onSave: (item, withConfirmation, noSubsequentEditing) =>
        dispatch(actions.main.save(item, withConfirmation, noSubsequentEditing)),
    onUnpost: (item) => dispatch(actions.main.unpost(item)),
    onPost: (item) => dispatch(actions.main.post(item)),
    openCancelModal: (modalProps) => dispatch(actions.main.openIgnoreCancelSaveModal(modalProps)),
    onValidate: (type, item, diff, profile, errors, messages, ignoreDateValidation = false) => dispatch(validateItem({
        profileName: type,
        item: item,
        diff: diff,
        formProfiles: profile,
        errors: errors,
        messages: messages,
        ignoreDateValidation: ignoreDateValidation,
    })),
    loadItem: (itemId, itemType) => dispatch(actions.main.loadItem(itemId, itemType, 'edit')),
    itemActions: actionUtils.getActionDispatches({dispatch: dispatch}),
    notifyValidationErrors: (errors) => dispatch(actions.main.notifyValidationErrors(errors)),

    saveAutosave: (diff) => dispatch(actions.autosave.save(diff)),
    loadAutosave: (itemType, itemId) => dispatch(actions.autosave.fetchById(itemType, itemId, false)),
});

export const Editor = connect(mapStateToProps, mapDispatchToProps)(EditorComponent);
export const EditorModal = connect(mapStateToPropsModal, mapDispatchToPropsModal, null,
    {withRef: true})(EditorComponent);
