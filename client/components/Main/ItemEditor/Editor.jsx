import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import {get, isEqual, cloneDeep, throttle, isNil} from 'lodash';

import {
    gettext,
    lockUtils,
    eventUtils,
    planningUtils,
    updateFormValues,
    isExistingItem,
    isItemKilled,
    isTemporaryId,
    getItemId,
    removeAutosaveFields,
    itemsEqual,
    isSameItemId,
} from '../../../utils';
import {EventUpdateMethods} from '../../Events';

import {ITEM_TYPE, POST_STATE, WORKFLOW_STATE, AUTOSAVE, UI} from '../../../constants';

import {Tabs as NavTabs} from '../../UI/Nav';
import {SidePanel, Content} from '../../UI/SidePanel';

import {EditorHeader, EditorContentTab} from './index';
import {HistoryTab} from '../index';

export class EditorComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tab: UI.EDITOR.CONTENT_TAB_INDEX,
            diff: {},
            errors: {},
            errorMessages: [],
            dirty: false,
            submitting: false,
            submitFailed: false,
            partialSave: false,
            itemReady: false,
        };

        this.tearDownRequired = false;
        this.editorHeaderComponent = null;
        this.onChangeHandler = this.onChangeHandler.bind(this);
        this.setActiveTab = this.setActiveTab.bind(this);
        this.onSave = this.onSave.bind(this);
        this.onPost = this.onPost.bind(this);
        this.onSaveAndPost = this.onSaveAndPost.bind(this);
        this.onUnpost = this.onUnpost.bind(this);
        this.onSaveUnpost = this.onSaveUnpost.bind(this);
        this.onCancel = this.onCancel.bind(this);
        this.resetForm = this.resetForm.bind(this);
        this.createNew = this.createNew.bind(this);
        this.onAddCoverage = this.onAddCoverage.bind(this);
        this.startPartialSave = this.startPartialSave.bind(this);
        this.onMinimized = this.onMinimized.bind(this);
        this.flushAutosave = this.flushAutosave.bind(this);
        this.cancelFromHeader = this.cancelFromHeader.bind(this);

        this.throttledSave = null;

        this.tabs = [
            {label: gettext('Content'), render: EditorContentTab, enabled: true},
            {
                label: gettext('History'),
                render: HistoryTab,
                enabled: true,
                tabProps: {
                    forEditor: !this.props.inModalView,
                    forEditorModal: this.props.inModalView,
                }},
        ];

        if (this.props.addNewsItemToPlanning) {
            this.tearDownRequired = true;
        }

        this.dom = {autosave: null};
    }

    componentDidMount() {
        // If the editor is in main page and the item is located in the URL, on first mount copy the diff from the item.
        // Otherwise all item changes will occur during the componentWillReceiveProps
        if (!this.props.inModalView && this.props.itemId && this.props.itemType) {
            this.loadItem(this.props);
        }

        if (this.props.inModalView) {
            // Moved from editor on main document to modal mode
            this.resetForm(this.props.item, false, () => {
                this.loadAutosave(this.props);
            });
        }
    }

    componentWillUnmount() {
        if (!this.tearDownRequired) {
            // problem of modal within modal, so setting this before unmount
            this.tearDownEditorState();
        }
    }

    loadItem(props) {
        const {itemId, itemType} = props;

        this.setState({itemReady: false}, () => {
            this.props.loadItem(itemId, itemType)
                .then((item) => {
                    if (!item) {
                        return this.loadAutosave(props);
                    }

                    return Promise.resolve();
                })
                .then(() => this.setState({itemReady: true}));
        });
    }

    resetForm(item = null, dirty = false, callback) {
        this.setState({
            diff: item === null ? {} : cloneDeep(item),
            dirty: dirty,
            submitting: false,
            errors: {},
            errorMessages: [],
            itemReady: true,
        }, () => {
            if (callback)
                callback();
        });

        this.tabs[UI.EDITOR.CONTENT_TAB_INDEX].label = get(item, 'type') === ITEM_TYPE.EVENT ?
            gettext('Event Details') :
            gettext('Planning Details');
    }

    createNew(props) {
        if (props.itemType === ITEM_TYPE.EVENT || props.itemType === ITEM_TYPE.PLANNING) {
            this.resetForm(props.initialValues, !!get(props, 'initialValues.duplicate_from'), () => {
                this.loadAutosave(props, props.initialValues);
            });
        } else {
            this.resetForm();
        }
    }

    onItemIDChanged(nextProps) {
        this.setState({
            itemReady: false,
            tab: UI.EDITOR.CONTENT_TAB_INDEX,
        }, () => {
            if (isTemporaryId(nextProps.itemId)) {
                // This happens when the editor is opened on an existing item and
                // the user attempts to create a new item
                this.createNew(nextProps);
            } else if (nextProps.item === null) {
                // This happens when the items have changed
                this.loadItem(nextProps);
            } else {
                this.resetForm(nextProps.item, () => {
                    this.loadAutosave(nextProps, nextProps.item);
                });
            }
        });
    }

    // This happens when the Editor has finished loading an existing item or creating a duplicate
    onFinishLoading(nextProps) {
        this.resetForm(
            nextProps.item,
            !isExistingItem(nextProps.item) && nextProps.item.duplicate_from,
            () => {
                this.loadAutosave(nextProps, nextProps.item);
            }
        );
    }

    onItemChanged(nextProps) {
        this.setState({itemReady: false}, () => {
            // This happens when the item attributes have changed
            if (this.state.partialSave) {
                this.finalisePartialSave(nextProps);
            } else {
                this.resetForm(get(nextProps, 'item') || {}, false, () => {
                    if (this.props.inModalView && this.props.onChange) {
                        this.props.onChange(nextProps.item);
                    }
                });
            }
        });
    }

    componentWillReceiveProps(nextProps) {
        if (!nextProps.itemType || !nextProps.itemId) {
            // If the editor has been closed, then set the itemReady state to false
            this.flushAutosave();
            this.setState({
                itemReady: false,
                tab: UI.EDITOR.CONTENT_TAB_INDEX,
            });
        } else if (nextProps.item !== null && this.props.item === null) {
            // This happens when the Editor has finished loading an existing item or creating a duplicate
            this.onFinishLoading(nextProps);
        } else if (nextProps.itemId !== this.props.itemId) {
            // If the item ID has changed
            this.onItemIDChanged(nextProps);
        } else if (!itemsEqual(get(nextProps, 'item'), get(this.props, 'item'))) {
            // This happens when the item attributes have changed
            this.onItemChanged(nextProps);
        } else if (isSameItemId(nextProps.item, this.props.item) &&
            this.isReadOnly(nextProps) && !this.isReadOnly(this.props)) {
            this.resetForm(get(nextProps, 'item') || {});
        }

        this.tabs[UI.EDITOR.HISTORY_TAB_INDEX].enabled = !!nextProps.itemId;
    }

    onChangeHandler(field, value, updateDirtyFlag = true, saveAutosave = true) {
        // If field (name) is passed, it will replace that field
        // Else, entire object will be replaced
        const diff = field ? Object.assign({}, this.state.diff) : cloneDeep(value);
        const errors = cloneDeep(this.state.errors);
        const errorMessages = [];

        if (field) {
            updateFormValues(diff, field, value);
        }

        this.props.onValidate(
            this.props.itemType,
            this.props.initialValues,
            diff,
            this.props.formProfiles,
            errors,
            errorMessages
        );

        const newState = {diff, errors, errorMessages};

        if (updateDirtyFlag) {
            newState.dirty = !itemsEqual(diff, this.props.item || this.props.initialValues);
        }

        this.setState(newState);

        if (this.props.onChange) {
            this.props.onChange(diff);
        }

        if (saveAutosave) {
            this.saveAutosave(this.props, diff);
        }
    }

    _save({post, unpost, withConfirmation, updateMethod, noSubsequentEditing}) {
        if (!isEqual(this.state.errorMessages, [])) {
            this.setState({
                submitFailed: true,
            });
            this.props.notifyValidationErrors(this.state.errorMessages);
        } else {
            this.setState({
                submitting: true,
                submitFailed: false,
            });

            // If we are posting or unposting, we are setting 'pubstatus' to 'usable' from client side
            let itemToUpdate = cloneDeep(this.state.diff);

            if (post) {
                itemToUpdate.state = WORKFLOW_STATE.SCHEDULED;
                itemToUpdate.pubstatus = POST_STATE.USABLE;
            } else if (unpost) {
                itemToUpdate.state = WORKFLOW_STATE.KILLED;
                itemToUpdate.pubstatus = POST_STATE.CANCELLED;
            }

            if (this.props.itemType === ITEM_TYPE.EVENT) {
                itemToUpdate.update_method = updateMethod;
            }

            if (!isExistingItem(this.props.item)) {
                this.cancelAutosave();
            }

            return this.props.onSave(itemToUpdate, withConfirmation, noSubsequentEditing)
                .then(
                    () => this.setState({
                        submitting: false,
                        dirty: false,
                    }),
                    () => this.setState({submitting: false}));
        }
    }

    /**
     * Initiate a partial save sequence
     * This will perform validation on the data provided, then set the submit flags
     * @param {object} updates - The updated item, with partial updates applied to the initialValues
     * @return {boolean} Returns true if there are no validation errors, false otherwise
     */
    startPartialSave(updates) {
        const errors = {};
        const errorMessages = [];

        this.props.onValidate(
            this.props.itemType,
            updates,
            this.props.formProfiles,
            errors,
            errorMessages
        );

        if (isEqual(errorMessages, [])) {
            this.setState({
                partialSave: true,
                submitting: true,
                submitFailed: false,
            });

            return true;
        }

        this.setState({submitFailed: true});
        this.props.notifyValidationErrors(errorMessages);

        return false;
    }

    /**
     * Restore the states after a partial save is completed (once the original item has been updated)
     * The dirty flag will be recalculated if there are other fields there are still not saved
     * @param {object} nextProps - The nextProps as passed in to componentWillReceiveProps
     */
    finalisePartialSave(nextProps) {
        this.setState({
            partialSave: false,
            submitting: false,
            itemReady: true,
        });
    }

    onSave(withConfirmation = true, updateMethod = EventUpdateMethods[0], noSubsequentEditing = false) {
        return this._save({
            post: false,
            unpost: false,
            withConfirmation: withConfirmation,
            updateMethod: updateMethod,
            noSubsequentEditing: noSubsequentEditing,
        });
    }

    onPost() {
        this.setState({
            submitting: true,
            submitFailed: false,
        });

        return this.props.onPost(this.state.diff)
            .then(
                () => this.setState({
                    submitting: false,
                    dirty: false,
                }),
                () => this.setState({submitting: false})
            );
    }

    onSaveAndPost(withConfirmation = true, updateMethod = EventUpdateMethods[0]) {
        return this._save({
            post: true,
            unpost: false,
            withConfirmation: withConfirmation,
            updateMethod: updateMethod,
        });
    }

    onUnpost() {
        this.setState({
            submitting: true,
            submitFailed: false,
        });

        return this.props.onUnpost(this.state.diff)
            .then(
                () => this.setState({
                    submitting: false,
                    dirty: false,
                }),
                () => this.setState({submitting: false})
            );
    }

    onSaveUnpost() {
        return this._save({post: false, unpost: true});
    }

    onAddCoverage(g2ContentType) {
        const {newsCoverageStatus, item} = this.props;
        const newCoverage = planningUtils.defaultCoverageValues(newsCoverageStatus, item, g2ContentType);

        this.onChangeHandler('coverages', [...get(this.state, 'diff.coverages', []), newCoverage]);
    }

    tearDownEditorState() {
        this.setState({
            errors: {},
            errorMessages: [],
            submitFailed: false,
            diff: {},
        });
    }

    saveAutosave(props, diff) {
        const {addNewsItemToPlanning, saveAutosave} = props;

        // Don't use Autosave if we're in the 'Add To Planning' modal
        if (addNewsItemToPlanning || this.isReadOnly(props)) {
            return;
        }

        if (!this.throttledSave) {
            this.throttledSave = throttle(
                saveAutosave,
                AUTOSAVE.INTERVAL,
                {leading: false, trailing: true}
            );
        }

        this.throttledSave(diff);
    }

    loadAutosave(props, diff = null) {
        const {itemType, itemId, loadAutosave, addNewsItemToPlanning} = props;

        // Don't use Autosave if we're in the 'Add To Planning' modal
        if (addNewsItemToPlanning || this.isReadOnly(props)) {
            return Promise.resolve();
        }

        return loadAutosave(itemType, itemId)
            .then((autosaveData) => {
                if (isNil(autosaveData) && diff !== null) {
                    return props.saveAutosave(diff);
                }

                this.onChangeHandler(
                    removeAutosaveFields(autosaveData, true),
                    null,
                    true,
                    false
                );
            });
    }

    flushAutosave() {
        if (get(this, 'throttledSave.flush')) {
            this.throttledSave.flush();
        }
    }

    cancelAutosave() {
        if (get(this, 'throttledSave.cancel')) {
            this.throttledSave.cancel();
        }
    }

    cancelFromHeader() {
        const {openCancelModal, item, initialValues, itemType} = this.props;
        const {dirty, errorMessages} = this.state;

        if (dirty) {
            this.flushAutosave();
            const hasErrors = !isEqual(errorMessages, []);
            const isKilled = isItemKilled(item);

            openCancelModal({
                itemId: getItemId(initialValues),
                itemType: itemType,
                onIgnore: this.onCancel,
                onSave: (isKilled || hasErrors) ?
                    null :
                    (withConfirmation, updateMethod) => this.onSave(withConfirmation, updateMethod, true)
                        .finally(this.onCancel),
                onSaveAndPost: (isKilled && !hasErrors) ?
                    (withConfirmation, updateMethod) => this.onSaveAndPost(withConfirmation, updateMethod,
                        true)
                        .finally(this.onCancel) :
                    null,
            });
        } else {
            this.onCancel();
        }
    }

    onCancel() {
        if (!this.props.inModalView && (this.tearDownRequired || !isExistingItem(this.props.item))) {
            this.tearDownEditorState();
        }

        if (this.editorHeaderComponent) {
            this.editorHeaderComponent.unregisterKeyBoardShortcuts();
        }

        this.props.cancel(this.props.item || this.props.initialValues);

        if (this.props.onCancel) {
            this.props.onCancel();
        }
    }

    setActiveTab(tab) {
        if (this.state.tab !== tab) {
            this.setState({tab});

            if (get(this.props, 'navigation.onTabChange')) {
                this.props.navigation.onTabChange(tab);
            }
        }
    }

    onMinimized() {
        this.props.minimize();

        if (this.props.onCancel) {
            this.props.onCancel();
        }
    }

    canEdit(props) {
        if (props.itemType === ITEM_TYPE.EVENT) {
            return eventUtils.canEditEvent(
                props.item,
                props.session,
                props.privileges,
                props.lockedItems
            );
        } else if (props.itemType === ITEM_TYPE.PLANNING) {
            return planningUtils.canEditPlanning(
                props.item,
                null,
                props.session,
                props.privileges,
                props.lockedItems
            );
        }

        return false;
    }

    isReadOnly(props) {
        const existingItem = isExistingItem(props.item);
        const itemLock = lockUtils.getLock(props.item, props.lockedItems);
        const isLockRestricted = lockUtils.isLockRestricted(
            props.item,
            props.session,
            props.lockedItems
        );
        const canEdit = this.canEdit(props);

        return existingItem && (
            !canEdit ||
            !itemLock ||
            isLockRestricted ||
            get(itemLock, 'action') !== 'edit'
        );
    }

    renderContent() {
        const existingItem = isExistingItem(this.props.item);
        const isReadOnly = this.isReadOnly(this.props);

        const currentTab = this.tabs[this.state.tab].enabled ? this.tabs[this.state.tab] :
            this.tabs[UI.EDITOR.CONTENT_TAB_INDEX];

        return (
            <Content flex={true} className={this.props.contentClassName}>
                {existingItem && (
                    <NavTabs
                        tabs={this.tabs}
                        active={this.state.tab}
                        setActive={this.setActiveTab}
                        className="side-panel__content-tab-nav"
                    />
                )}

                <div className={classNames(
                    'side-panel__content-tab-content',
                    {'editorModal__editor--padding-bottom': !!get(this.props, 'navigation.padContentForNavigation')}
                )}
                onScroll={this.onScroll} >
                    {(!this.props.isLoadingItem && this.props.itemType) && (
                        <currentTab.render
                            item={this.props.item || {}}
                            itemType={this.props.itemType}
                            itemExists={isExistingItem(this.state.diff)}
                            diff={this.state.diff}
                            onChangeHandler={this.onChangeHandler}
                            readOnly={isReadOnly}
                            addNewsItemToPlanning={this.props.addNewsItemToPlanning}
                            submitFailed={this.state.submitFailed}
                            errors={this.state.errors}
                            dirty={this.state.dirty}
                            startPartialSave={this.startPartialSave}
                            navigation={this.props.navigation}
                            {...currentTab.tabProps}
                        />
                    )}
                </div>
            </Content>
        );
    }

    render() {
        if (!this.props.itemType || !this.props.itemId) {
            return null;
        }

        return (
            <SidePanel shadowRight={true} className={this.props.className}>
                <EditorHeader
                    item={this.props.item}
                    diff={this.state.diff}
                    initialValues={this.props.item ?
                        cloneDeep(this.props.item) :
                        cloneDeep(this.props.initialValues)
                    }
                    onSave={this.onSave}
                    onPost={this.onPost}
                    onSaveAndPost={this.onSaveAndPost}
                    onUnpost={this.onUnpost}
                    onSaveUnpost={this.onSaveUnpost}
                    onAddCoverage={this.onAddCoverage}
                    cancel={this.cancelFromHeader}
                    minimize={this.onMinimized}
                    submitting={this.state.submitting}
                    dirty={this.state.dirty}
                    errors={this.state.errors}
                    session={this.props.session}
                    privileges={this.props.privileges}
                    contentTypes={this.props.contentTypes}
                    lockedItems={this.props.lockedItems}
                    openCancelModal={this.props.openCancelModal}
                    closeEditorAndOpenModal={this.props.closeEditorAndOpenModal}
                    users={this.props.users}
                    onUnlock={this.props.onUnlock}
                    onLock={this.props.onLock}
                    itemActions={this.props.itemActions}
                    ref={(ref) => this.editorHeaderComponent = ref}
                    itemType={this.props.itemType}
                    addNewsItemToPlanning={this.props.addNewsItemToPlanning}
                    showUnlock={this.props.showUnlock}
                    createAndPost={this.props.createAndPost}
                    hideItemActions={this.props.hideItemActions}
                    hideMinimize={this.props.hideMinimize}
                    hideExternalEdit={this.props.hideExternalEdit}
                    flushAutosave={this.flushAutosave}
                />
                {this.renderContent()}
            </SidePanel>
        );
    }
}

EditorComponent.propTypes = {
    item: PropTypes.object,
    itemId: PropTypes.string,
    itemType: PropTypes.string,
    cancel: PropTypes.func.isRequired,
    minimize: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    onPost: PropTypes.func.isRequired,
    onUnpost: PropTypes.func.isRequired,
    session: PropTypes.object,
    privileges: PropTypes.object,
    lockedItems: PropTypes.object,
    openCancelModal: PropTypes.func.isRequired,
    users: PropTypes.array,
    closeEditorAndOpenModal: PropTypes.func,
    onUnlock: PropTypes.func,
    onLock: PropTypes.func,
    addNewsItemToPlanning: PropTypes.object,
    onValidate: PropTypes.func,
    formProfiles: PropTypes.object,
    occurStatuses: PropTypes.array,
    itemActions: PropTypes.object,
    loadItem: PropTypes.func,
    isLoadingItem: PropTypes.bool,
    initialValues: PropTypes.object,
    showUnlock: PropTypes.bool,
    hideItemActions: PropTypes.bool,
    hideMinimize: PropTypes.bool,
    createAndPost: PropTypes.bool,
    newsCoverageStatus: PropTypes.array,
    contentTypes: PropTypes.array,
    onChange: PropTypes.func,
    onCancel: PropTypes.func,
    className: PropTypes.string,
    contentClassName: PropTypes.string,
    navigation: PropTypes.object,
    inModalView: PropTypes.bool,
    hideExternalEdit: PropTypes.bool,
    notifyValidationErrors: PropTypes.func,
    saveAutosave: PropTypes.func,
    loadAutosave: PropTypes.func,
};
