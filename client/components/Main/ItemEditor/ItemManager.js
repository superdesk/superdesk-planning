import {ITEM_TYPE, POST_STATE, UI, WORKFLOW_STATE, WORKSPACE} from '../../../constants';
import {
    isTemporaryId,
    removeAutosaveFields,
    eventUtils,
    planningUtils,
    itemsEqual,
    shouldUnLockItem,
} from '../../../utils';
import {validateItem} from '../../../validators';
import {cloneDeep, get, set, isEqual} from 'lodash';
import * as actions from '../../../actions';
import {EventUpdateMethods} from '../../Events';


export class ItemManager {
    constructor(editor) {
        this.editor = editor;
        this.dispatch = this.editor.props.dispatch;
        this.autoSave = this.editor.autoSave;
        this.mounted = false;

        this.post = this.post.bind(this);
        this.unpost = this.unpost.bind(this);
        this.save = this.save.bind(this);
        this.saveAndPost = this.saveAndPost.bind(this);
        this.saveAndUnpost = this.saveAndUnpost.bind(this);
        this.lock = this.lock.bind(this);
        this.unlockThenLock = this.unlockThenLock.bind(this);
        this.changeAction = this.changeAction.bind(this);
        this.addCoverage = this.addCoverage.bind(this);
        this.startPartialSave = this.startPartialSave.bind(this);
        this.openInModal = this.openInModal.bind(this);
        this.addCoverageToWorkflow = this.addCoverageToWorkflow.bind(this);
        this.addScheduledUpdateToWorkflow = this.addScheduledUpdateToWorkflow.bind(this);
        this.removeAssignment = this.removeAssignment.bind(this);
        this.cancelCoverage = this.cancelCoverage.bind(this);
        this.finaliseCancelCoverage = this.finaliseCancelCoverage.bind(this);
        this.setStateForPartialSave = this.setStateForPartialSave.bind(this);

        this.editor.state = {
            tab: UI.EDITOR.CONTENT_TAB_INDEX,
            diff: {},
            errors: {},
            errorMessages: [],
            dirty: false,
            submitting: false,
            submitFailed: false,
            partialSave: false,
            itemReady: false,
            loading: false,
            initialValues: {},
        };
    }

    get props() {
        return this.editor.props;
    }

    get state() {
        return this.editor.state;
    }

    setState(state, cb = null, saveAutosave = false) {
        let promise = Promise.resolve();

        if (this.editor && this.editor.setState && this.mounted) {
            promise = new Promise((resolve) => {
                this.editor.setState(state, resolve);
            });
        }

        if (this.props.onChange && state.diff) {
            promise.then(() => this.props.onChange(state.diff));
        }

        if (saveAutosave) {
            promise.then(() => {
                this.autoSave.saveAutosave(this.props, this.state.diff);

                return this.autoSave.flushAutosave();
            });
        }

        if (cb) {
            promise.then(cb);
        }

        return promise;
    }

    componentWillMount() {
        this.mounted = true;

        if (this.props.itemId && this.props.itemType && this.props.itemAction) {
            this.onItemIDChanged(this.props);
        }
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    openInModal() {
        return this.autoSave.flushAutosave()
            .then(() => (
                this.dispatch(actions.main.openEditorAction(
                    this.props.initialValues,
                    'edit',
                    false,
                    true
                ))
            ));
    }

    componentWillReceiveProps(nextProps) {
        if (!nextProps.itemType || !nextProps.itemId || !nextProps.itemAction) {
            this.autoSave.flushAutosave();

            if (!this.props.inModalView) {
                this.clearForm();
            }
        } else if (this.props.itemAction !== nextProps.itemAction) {
            this.onItemActionChanged(nextProps);
        } else if (nextProps.itemId !== this.props.itemId) {
            this.onItemIDChanged(nextProps);
        } else if (!this.state.loading &&
            !isTemporaryId(nextProps.itemId) &&
            !itemsEqual(this.props.item, nextProps.item) &&
            !this.state.submitting
        ) {
            this.onItemChanged(nextProps);
        }
    }

    onItemActionChanged(nextProps) {
        let promise = Promise.resolve();

        if (this.props.itemAction && nextProps.itemAction === 'read') {
            promise = this.autoSave.remove();
        }

        return promise.then(() => this.onItemIDChanged(nextProps));
    }

    onItemIDChanged(nextProps) {
        return this.setState({
            itemReady: false,
            tab: UI.EDITOR.CONTENT_TAB_INDEX,
            loading: true,
            initialValues: {},
            diff: {},
        })
            .then(() => {
                switch (nextProps.itemAction) {
                case 'create':
                    return this.createNew(nextProps);
                case 'edit':
                    return this.loadItem(nextProps);
                case 'read':
                default:
                    return this.loadReadOnlyItem(nextProps);
                }
            });
    }

    onItemChanged(nextProps) {
        // Only update the item if the editor is in read-only mode
        // Otherwise handle specific item updates in Event/Planning editors
        // i.e. Assignment updates are handled in Planning editor
        if (nextProps.itemAction === 'read') {
            this.resetForm(nextProps.item);
        }
    }

    validate(nextProps, newState, currentState = {}) {
        const errors = cloneDeep(newState.errors || currentState.errors || {});
        const errorMessages = [];

        this.dispatch(validateItem({
            profileName: nextProps.itemType,
            diff: newState.diff || currentState.diff,
            item: newState.initialValues || currentState.initialValues,
            formProfiles: nextProps.formProfiles,
            errors: errors,
            messages: errorMessages,
            ignoreDateValidation: !isTemporaryId(nextProps.itemId),
        }));

        newState.errors = errors;
        newState.errorMessages = errorMessages;
    }

    createNew(nextProps) {
        if (nextProps.itemType === ITEM_TYPE.EVENT || nextProps.itemType === ITEM_TYPE.PLANNING) {
            const defaultValues = nextProps.itemType === ITEM_TYPE.EVENT ?
                this.getEventDefaults(nextProps) :
                this.getPlanningDefaults(nextProps);

            return this.autoSave.createOrLoadAutosave(nextProps, {
                ...defaultValues,
                ...nextProps.initialValues,
            })
                .then((autosaveItem) => {
                    const newState = {
                        initialValues: cloneDeep(defaultValues),
                        diff: removeAutosaveFields(
                            autosaveItem,
                            true,
                            true
                        ),
                        submitting: false,
                        itemReady: true,
                        loading: false,
                    };

                    // Otherwise calculate if the items are different
                    newState.dirty = this.editor.isDirty(
                        newState.initialValues,
                        newState.diff
                    );

                    this.validate(nextProps, newState);
                    return this.setState(newState);
                });
        }

        this.resetForm();
        return Promise.resolve();
    }

    getEventDefaults(nextProps) {
        const defaultValues = eventUtils.defaultEventValues(
            nextProps.occurStatuses,
            nextProps.defaultCalendar,
            nextProps.defaultPlace
        );

        defaultValues._id = nextProps.initialValues._id;
        return defaultValues;
    }

    getPlanningDefaults(nextProps) {
        const defaultValues = planningUtils.defaultPlanningValues(
            nextProps.currentAgenda,
            nextProps.defaultPlace
        );

        defaultValues._id = nextProps.initialValues._id;
        return defaultValues;
    }

    loadReadOnlyItem(nextProps) {
        return this.dispatch(
            actions.main.fetchById(nextProps.itemId, nextProps.itemType, true)
        )
            .then((original) => (
                this.setState({
                    initialValues: original,
                    diff: original,
                    dirty: false,
                    submitting: false,
                    itemReady: true,
                    loading: false,
                })
            ));
    }

    loadItem(nextProps) {
        let initialValues;
        let promise;

        if (isTemporaryId(nextProps.itemId)) {
            initialValues = nextProps.initialValues;
            promise = Promise.resolve(nextProps.initialValues);
        } else if (nextProps.itemAction === 'edit') {
            // Fetch the latest item from the API and lock it
            // Makes sure we're working on the very latest item
            // In case our store does not have the latest item
            // (network issues/missed notification)
            promise = this.dispatch(
                actions.main.fetchById(nextProps.itemId, nextProps.itemType, true)
            )
                .then((original) => {
                    initialValues = cloneDeep(original);
                    return this.dispatch(actions.locks.lock(original));
                });
        } else {
            // Fetch the latest item from the API to view in read-only mode
            initialValues = nextProps.initialValues;
            promise = this.dispatch(
                actions.main.fetchById(nextProps.itemId, nextProps.itemType, true)
            );
        }

        return promise
            .then((lockedItem) => {
                if (lockedItem.lock_action) {
                    Object.assign(initialValues, {
                        _etag: lockedItem._etag,
                        lock_action: lockedItem.lock_action,
                        lock_user: lockedItem.lock_user,
                        lock_session: lockedItem.lock_session,
                        lock_time: lockedItem.lock_time,
                    });
                }

                if (nextProps.itemAction === 'read') {
                    return Promise.resolve(lockedItem);
                }

                return this.autoSave.createOrLoadAutosave(nextProps, lockedItem);
            })
            .then((autosaveItem) => {
                if (autosaveItem.state !== initialValues.state) {
                    autosaveItem.state = initialValues.state;
                }

                if (autosaveItem.pubstatus !== initialValues.pubstatus) {
                    autosaveItem.pubstatus = initialValues.pubstatus;
                }

                const original = cloneDeep(initialValues);
                const diff = {
                    ...original,
                    ...removeAutosaveFields(
                        autosaveItem,
                        true,
                        true
                    ),
                };

                if (get(nextProps, 'initialValues._addCoverage')) {
                    setTimeout(
                        () => this.addCoverage(nextProps.initialValues._addCoverage),
                        0
                    );
                }

                const newState = {
                    initialValues: original,
                    diff: diff,
                    dirty: this.editor.isDirty(initialValues, autosaveItem),
                    submitting: false,
                    itemReady: true,
                    loading: false,
                };

                this.validate(nextProps, newState);
                return this.setState(newState);
            })
            .catch(() => {
                this.changeAction('read');
            });
    }

    clearForm() {
        return this.setState({
            initialValues: {},
            diff: {},
            dirty: false,
            submitting: false,
            submitFailed: false,
            partialSave: false,
            errors: {},
            errorMessages: [],
            itemReady: true,
            loading: false,
        });
    }

    resetForm(initialValues = null, diff = null, dirty = false, callback) {
        let initial = initialValues === null ? {} : cloneDeep(initialValues);

        return this.setState({
            initialValues: initial,
            diff: diff === null ? cloneDeep(initial) : cloneDeep(diff),
            dirty: dirty,
            submitting: false,
            submitFailed: false,
            partialSave: false,
            errors: {},
            errorMessages: [],
            itemReady: true,
            loading: false,
        }, callback);
    }

    shouldClose() {
        // Determines if the Editor should close
        //  * Creating a new item from the Modal Editor
        //  * Creating/Editing an item from Authoring
        return (isTemporaryId(this.props.itemId) && this.props.inModalView) ||
            this.props.currentWorkspace === WORKSPACE.AUTHORING;
    }

    post() {
        const newState = {};

        this.validate(this.props, newState, this.state);
        if (!isEqual(this.state.errorMessages, [])) {
            return this.setState({
                submitting: false,
                submitFailed: true,
            })
                .then(() => {
                    this.props.notifyValidationErrors(this.state.errorMessages);
                    return Promise.reject();
                });
        }
        return this.setState({
            submitting: true,
            submitFailed: false,
        })
            .then(() => this.autoSave.flushAutosave())
            .then(() => this.dispatch(
                actions.main.post(this.state.initialValues)
            ))
            .then(
                (updatedItem) => this.setState(!updatedItem ?
                    // updatedItem === undefined if the user clicks 'Cancel'
                    // from an 'Ignore/Cancel/Save' dialog
                    {submitting: false} :
                    {
                        submitting: false,
                        dirty: false,
                        initialValues: updatedItem,
                        diff: removeAutosaveFields(
                            cloneDeep(updatedItem),
                            true,
                            true
                        ),
                    }, null, true),
                (error) => {
                    if (get(error, 'status') === 412) {
                        // If etag error, then notify user and change editor to read-only
                        this.dispatch(
                            actions.main.notifyPreconditionFailed(this.props.inModalView)
                        );
                    }

                    return this.setState({submitting: false});
                }
            );
    }

    unpost() {
        return this.setState({
            submitting: true,
            submitFailed: false,
        })
            .then(() => this.autoSave.flushAutosave())
            .then(() => this.dispatch(
                actions.main.unpost(this.state.initialValues)
            ))
            .then(
                (updatedItem) => this.setState(!updatedItem ?
                    // updatedItem === undefined if the user clicks 'Cancel'
                    // from an 'Ignore/Cancel/Save' dialog
                    {submitting: false} :
                    {
                        submitting: false,
                        dirty: false,
                        initialValues: updatedItem,
                        diff: removeAutosaveFields(
                            cloneDeep(updatedItem),
                            true,
                            true
                        ),
                    }, null, true),
                (error) => {
                    if (get(error, 'status') === 412) {
                        // If etag error, then notify user and change editor to read-only
                        this.dispatch(
                            actions.main.notifyPreconditionFailed(this.props.inModalView)
                        );
                    }

                    return this.setState({submitting: false});
                }
            );
    }

    save(
        withConfirmation = true,
        updateMethod = EventUpdateMethods[0],
        closeAfter = false,
        updateStates = true
    ) {
        return this._save({
            post: false,
            unpost: false,
            withConfirmation: withConfirmation,
            updateMethod: updateMethod,
            closeAfter: closeAfter || this.shouldClose(),
            updateStates: updateStates,
        });
    }

    saveAndPost(
        withConfirmation = true,
        updateMethod = EventUpdateMethods[0],
        closeAfter = false,
        updateStates = true
    ) {
        return this._save({
            post: true,
            unpost: false,
            withConfirmation: withConfirmation,
            updateMethod: updateMethod,
            closeAfter: closeAfter || this.shouldClose(),
            updateStates: updateStates,
        });
    }

    saveAndUnpost() {
        return this._save({
            post: false,
            unpost: true,
            closeAfter: this.shouldClose(),
        });
    }

    _saveFromAuthoring({
        post = false,
        unpost = false,
    } = {}) {
        const isTemporary = isTemporaryId(this.props.itemId);
        const updates = cloneDeep(this.state.diff);

        // If we are posting or unposting, we are setting 'pubstatus' to 'usable' from client side
        if (post) {
            updates.state = WORKFLOW_STATE.SCHEDULED;
            updates.pubstatus = POST_STATE.USABLE;
            updates._post = true;
        } else if (unpost) {
            updates.state = WORKFLOW_STATE.KILLED;
            updates.pubstatus = POST_STATE.CANCELLED;
        }

        return this.dispatch(actions.main.save(
            isTemporary ? {} : this.state.initialValues,
            updates,
            false
        ))
            .then(() => {
                this.dispatch(actions.clearPrevious());
                return this.editor.onCancel(false);
            }, (error) => {
                if (get(error, 'status') === 412) {
                    // If etag error, then notify user and change editor to read-only
                    this.dispatch(
                        actions.main.notifyPreconditionFailed(this.props.inModalView)
                    );
                }
            });
    }

    _save({
        post = false,
        unpost = false,
        withConfirmation = true,
        updateMethod = EventUpdateMethods[0],
        closeAfter = false,
        updateStates = true,
    } = {}) {
        if (!isEqual(this.state.errorMessages, [])) {
            return this.setState({
                submitting: false,
                submitFailed: true,
            })
                .then(() => {
                    this.props.notifyValidationErrors(this.state.errorMessages);

                    return Promise.reject();
                });
        }

        const promise = !updateStates ?
            Promise.resolve() :
            this.setState({
                submitting: true,
                submitFailed: false,
            });

        if (this.props.addNewsItemToPlanning) {
            return promise.then(() => this._saveFromAuthoring({post, unpost}));
        }

        // Only remove the autosave if item is temp or we're in AUTHORING
        const isTemporary = isTemporaryId(this.props.itemId);

        // If we are posting or unposting, we are setting 'pubstatus' to 'usable' from client side
        const updates = cloneDeep(this.state.diff);

        if (post) {
            if (updates.pubstatus !== POST_STATE.USABLE) {
                updates.state = WORKFLOW_STATE.SCHEDULED;
            }

            updates.pubstatus = POST_STATE.USABLE;
            updates._post = true;
        } else if (unpost) {
            updates.state = WORKFLOW_STATE.KILLED;
            updates.pubstatus = POST_STATE.CANCELLED;
        }

        if (this.props.itemType === ITEM_TYPE.EVENT) {
            updates.update_method = updateMethod;
        }

        return promise.then(() => this.autoSave.flushAutosave())
            .then(() => (
                this.dispatch(actions.main.save(
                    isTemporary ? {} : this.state.initialValues,
                    updates,
                    withConfirmation
                ))
            ))
            .then((updatedItem) => {
                if (!updatedItem) {
                    // This occurs during an 'Ignore/Cancel/Save' from ModalEditor
                    // And the user clicks on 'Cancel'
                    return this.setState({submitting: false});
                } else if (isTemporary) {
                    this.autoSave.remove();

                    // If event was created by a planning item, unlock the planning item
                    if (get(updates, '_planning_item')) {
                        this.dispatch(actions.planning.api.unlock({
                            _id: updates._planning_item,
                            type: ITEM_TYPE.PLANNING,
                        }));
                    }

                    if (closeAfter) {
                        return this.editor.onCancel(updateStates);
                    } else {
                        return this.changeAction('edit', updatedItem);
                    }
                } else if (closeAfter) {
                    return this.editor.onCancel(updateStates);
                } else {
                    return this.setState({
                        initialValues: updatedItem,
                        diff: cloneDeep(updatedItem),
                        dirty: false,
                        submitting: false,
                        submitFailed: false,
                        errors: {},
                        errorMessages: [],
                        itemReady: true,
                        loading: false,
                    }, null, true);
                }
            }, (error) => {
                if (get(error, 'status') === 412) {
                    // If etag error, then notify user and change editor to read-only
                    this.dispatch(
                        actions.main.notifyPreconditionFailed(this.props.inModalView)
                    );
                }

                if (updateStates) {
                    this.setState({submitting: false});
                }
            });
    }

    startPartialSave(updates) {
        const newState = {diff: cloneDeep(updates)};

        this.validate(this.props, newState, this.state);

        if (isEqual(newState.errorMessages, [])) {
            this.setState({
                partialSave: true,
                submitting: true,
                submitFailed: false,
            });

            return true;
        }

        this.setState({submitFailed: true});
        this.props.notifyValidationErrors(newState.errorMessages);

        return false;
    }

    finalisePartialSave(diff, updateDirtyFlag = false) {
        const clonedDiff = cloneDeep(diff);
        const initialValues = cloneDeep(this.state.initialValues);

        Object.keys(diff).forEach(
            (field) => {
                set(initialValues, field, get(clonedDiff, field));
            }
        );

        return this.setStateForPartialSave(initialValues)
            .then(() => this.editor.onChangeHandler(diff, null, updateDirtyFlag));
    }

    setStateForPartialSave(initialValues) {
        let newState = {
            partialSave: false,
            submitting: false,
            submitFailed: false,
        };

        if (initialValues) {
            newState.initialValues = initialValues;
        }

        return this.setState(newState);
    }

    forceUpdateInitialValues(diff) {
        const initialValues = cloneDeep(this.state.initialValues);

        Object.keys(diff).forEach(
            (field) => {
                set(initialValues, field, get(diff, field));
            }
        );

        return this.setState({initialValues}).then(() => this.editor.onChangeHandler(diff, null, false));
    }

    lock(item) {
        return this.dispatch(
            actions.locks.lock(item)
        );
    }

    unlock() {
        const {itemId, itemType} = this.props;
        let action = actions.locks.unlock;

        if (!itemId || isTemporaryId(itemId)) {
            return Promise.resolve();
        } else if (itemType === ITEM_TYPE.EVENT) {
            action = actions.events.api.unlock;
        } else if (itemType === ITEM_TYPE.PLANNING) {
            action = actions.planning.api.unlock;
        }

        return this.dispatch(action({
            _id: itemId,
            type: itemType,
        }));
    }

    unlockThenLock(item) {
        return this.setState({
            itemReady: false,
            loading: true,
        })
            .then(() => this.dispatch(
                actions.locks.unlockThenLock(item)
            ));
    }

    unlockAndCancel() {
        const {session, currentWorkspace} = this.props;
        const {initialValues, diff} = this.state;
        let promises = [];

        if (shouldUnLockItem(initialValues, session, currentWorkspace, this.props.lockedItems)) {
            promises.push(this.unlock());
        }

        // If event was created by a planning item, unlock the planning item
        if (get(diff, '_planning_item')) {
            this.dispatch(actions.planning.api.unlock({
                _id: diff._planning_item,
                type: ITEM_TYPE.PLANNING,
            }));
        }

        promises.push(this.autoSave.remove());

        this.editor.closeEditor();

        return Promise.all(promises);
    }

    changeAction(action, newItem = null) {
        return this.setState({
            itemReady: false,
            loading: true,
        })
            // If an item was provided, then we want to change the editor to this item
            // otherwise simply change the itemAction of this editor in redux
            .then(() => (this.dispatch(newItem !== null ?
                actions.main.openForEdit(newItem, !this.props.inModalView, this.props.inModalView) :
                actions.main.changeEditorAction(action, this.props.inModalView)
            )));
    }

    addCoverage(g2ContentType) {
        const newCoverage = planningUtils.defaultCoverageValues(
            this.props.newsCoverageStatus,
            this.state.initialValues,
            this.props.associatedEvent,
            this.props.longEventDurationThreshold,
            g2ContentType,
            this.props.defaultDesk,
            this.props.preferredCoverageDesks
        );

        this.editor.onChangeHandler(
            'coverages',
            [...get(this.state, 'diff.coverages', []), newCoverage]
        );
    }

    addCoverageToWorkflow(planning, coverage, index) {
        return this.dispatch(actions.planning.ui.addCoverageToWorkflow(planning, coverage, index))
            .then((updates) => this.finalisePartialSave(this.getCoverageAfterPartialSave(updates, index)));
    }

    addScheduledUpdateToWorkflow(planning, coverage, covergeIndex, scheduledUpdate, index) {
        return this.dispatch(actions.planning.ui.addScheduledUpdateToWorkflow(planning, coverage, covergeIndex,
            scheduledUpdate, index))
            .then((updates) => this.finalisePartialSave(this.getCoverageAfterPartialSave(updates, index)));
    }

    removeAssignment(planning, coverage, index) {
        return this.dispatch(actions.planning.ui.removeAssignment(planning, coverage, index))
            .then((updates) => this.finalisePartialSave(this.getCoverageAfterPartialSave(updates, index)));
    }

    cancelCoverage(planning, coverage, index, scheduledUpdate, scheduledUpdateIndex) {
        return this.dispatch(actions.planning.ui.openCancelCoverageModal(planning,
            coverage, index, this.finaliseCancelCoverage, this.setStateForPartialSave,
            scheduledUpdate, scheduledUpdateIndex));
    }

    finaliseCancelCoverage(planning, updatedCoverage, index, scheduledUpdate, scheduledUpdateIndex) {
        return this.dispatch(actions.planning.ui.cancelCoverage(planning, updatedCoverage, index,
            scheduledUpdate, scheduledUpdateIndex)).then((updates) =>
            this.finalisePartialSave(this.getCoverageAfterPartialSave(updates, index)));
    }

    getCoverageAfterPartialSave(updates, index) {
        return {
            _etag: updates._etag,
            _updated: updates._updated,
            version_creator: updates.version_creator,
            versioncreated: updates.versioncreated,
            [`coverages[${index}]`]: updates.coverages[index],
        };
    }
}
