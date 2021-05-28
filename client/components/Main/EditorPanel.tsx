import * as React from 'react';
import {connect} from 'react-redux';
import {get} from 'lodash';

import {EDITOR_TYPE, IPlanningAppState} from '../../interfaces';

import * as selectors from '../../selectors';
import {editorSelectors} from '../../selectors/editors';
import * as actions from '../../actions';
import {actionUtils} from '../../utils';

import {EditorComponent} from './ItemEditor';

const mapStateToProps = (state: IPlanningAppState) => ({
    item: selectors.forms.currentItem(state),
    itemId: selectors.forms.currentItemId(state),
    itemType: selectors.forms.currentItemType(state),
    itemAction: selectors.forms.currentItemAction(state),
    initialValues: selectors.forms.initialValues(state),
    users: selectors.general.users(state),
    formProfiles: selectors.forms.profiles(state),
    occurStatuses: selectors.vocabs.eventOccurStatuses(state),
    session: selectors.general.session(state),
    privileges: selectors.general.privileges(state),
    lockedItems: selectors.locks.getLockedItems(state),
    newsCoverageStatus: selectors.general.newsCoverageStatus(state),
    contentTypes: selectors.general.contentTypes(state),
    defaultDesk: selectors.general.defaultDesk(state),
    preferredCoverageDesks: get(selectors.general.preferredCoverageDesks(state), 'desks'),
    associatedPlannings: selectors.events.getRelatedPlannings(state),
    associatedEvent: selectors.events.planningEditAssociatedEvent(state),
    currentWorkspace: selectors.general.currentWorkspace(state),
    defaultCalendar: selectors.events.defaultCalendarValue(state),
    defaultPlace: selectors.general.defaultPlaceList(state),
    currentAgenda: selectors.planning.currentAgenda(state),
    groups: editorSelectors[EDITOR_TYPE.INLINE].getEditorGroupsSorted(state),
    editorType: EDITOR_TYPE.INLINE,
});

const mapStateToPropsModal = (state) => ({
    item: selectors.forms.currentItemModal(state),
    itemId: selectors.forms.currentItemIdModal(state),
    itemType: selectors.forms.currentItemTypeModal(state),
    itemAction: selectors.forms.currentItemActionModal(state),
    initialValues: selectors.forms.initialValuesModal(state),
    users: selectors.general.users(state),
    formProfiles: selectors.forms.profiles(state),
    occurStatuses: selectors.vocabs.eventOccurStatuses(state),
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
    currentWorkspace: selectors.general.currentWorkspace(state),
    defaultCalendar: selectors.events.defaultCalendarValue(state),
    defaultPlace: selectors.general.defaultPlaceList(state),
    currentAgenda: selectors.planning.currentAgenda(state),
    groups: editorSelectors[EDITOR_TYPE.POPUP].getEditorGroupsSorted(state),
    editorType: EDITOR_TYPE.POPUP,
});

const mapDispatchToProps = (dispatch) => ({
    dispatch: dispatch,
    minimize: () => dispatch(actions.main.closeEditor()),
    openCancelModal: (modalProps) => dispatch(actions.main.openIgnoreCancelSaveModal(modalProps)),
    itemActions: actionUtils.getActionDispatches({dispatch: dispatch}),
    notifyValidationErrors: (errors) => dispatch(actions.main.notifyValidationErrors(errors)),
    saveDiffToStore: (diff) => dispatch(actions.editors.setFormDiff(EDITOR_TYPE.INLINE, diff)),
});

const mapDispatchToPropsModal = (dispatch) => ({
    dispatch: dispatch,
    minimize: () => dispatch(actions.main.closeEditor()),
    openCancelModal: (modalProps) => dispatch(actions.main.openIgnoreCancelSaveModal(modalProps)),
    itemActions: actionUtils.getActionDispatches({dispatch: dispatch}),
    notifyValidationErrors: (errors) => dispatch(actions.main.notifyValidationErrors(errors)),
    saveDiffToStore: (diff) => dispatch(actions.editors.setFormDiff(EDITOR_TYPE.POPUP, diff)),
});

export const Editor = connect(mapStateToProps, mapDispatchToProps)(EditorComponent);
export const EditorModal = connect(
    mapStateToPropsModal,
    mapDispatchToPropsModal,
    null,
    {forwardRef: true}
)(EditorComponent);
