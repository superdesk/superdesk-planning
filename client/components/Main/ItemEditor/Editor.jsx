import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import {get, isEqual, cloneDeep, omit, pickBy} from 'lodash';

import {gettext, lockUtils, eventUtils, planningUtils, updateFormValues, isExistingItem} from '../../../utils';

import {ITEM_TYPE, EVENTS, PLANNING, POST_STATE, WORKFLOW_STATE, COVERAGES} from '../../../constants';

import {Tabs as NavTabs} from '../../UI/Nav';
import {SidePanel, Content} from '../../UI/SidePanel';

import {EditorHeader, EditorContentTab} from './index';
import {HistoryTab} from '../index';
import {Autosave} from '../../index';

export class EditorComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tab: 0,
            diff: {},
            errors: {},
            errorMessages: [],
            dirty: false,
            submitting: false,
            submitFailed: false,
            partialSave: false,
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

        this.tabs = [
            {label: gettext('Content'), render: EditorContentTab, enabled: true},
            {label: gettext('History'), render: HistoryTab, enabled: true},
        ];

        if (this.props.addNewsItemToPlanning) {
            this.tearDownRequired = true;
        }
    }

    componentDidMount() {
        // If the editor is in main page and the item is located in the URL, on first mount copy the diff from the item.
        // Otherwise all item changes will occur during the componentWillReceiveProps
        if (!this.props.inModalView && this.props.itemId && this.props.itemType) {
            this.props.loadItem(this.props.itemId, this.props.itemType);
        }

        if (this.props.inModalView && this.props.item) {
            // Moved from editor on main document to modal mode
            this.resetForm(this.props.item);
        }
    }

    componentWillUnmount() {
        if (!this.tearDownRequired) {
            // problem of modal within modal, so setting this before unmount
            this.tearDownEditorState();
        }
    }

    resetForm(item = null, dirty = false) {
        this.setState({
            diff: item === null ? {} : cloneDeep(item),
            dirty: dirty,
            submitting: false,
            errors: {},
            errorMessages: [],
        });

        this.tabs[0].label = get(item, 'type') === ITEM_TYPE.EVENT ?
            gettext('Event Details') :
            gettext('Planning Details');
    }

    createNew(props) {
        if (props.itemType === ITEM_TYPE.EVENT) {
            if (isEqual(omit(props.initialValues, '_tempId'), {type: ITEM_TYPE.EVENT})) {
                this.resetForm(EVENTS.DEFAULT_VALUE(props.occurStatuses));
            } else {
                this.resetForm(props.initialValues, true);
            }
        } else if (props.itemType === ITEM_TYPE.PLANNING) {
            if (isEqual(omit(props.initialValues, '_tempId'), {type: ITEM_TYPE.PLANNING})) {
                this.resetForm(PLANNING.DEFAULT_VALUE);
            } else {
                this.resetForm(props.initialValues, true);
            }
        } else {
            this.resetForm();
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.itemId !== this.props.itemId) {
            if (nextProps.itemId === null) {
                // This happens when the editor is opened on an existing item and
                // the user attempts to create a new item
                setTimeout(() => {
                    this.createNew(nextProps);
                }, 0);
            } else if (nextProps.item === null) {
                // This happens when the items have changed
                // If we were editing a non-exising item, remove from store's autosave
                if (get(this.props, 'initialValues._tempId')) {
                    this.props.removeNewAutosaveItems();
                }

                // Using setTimeout allows the Editor to clear before displaying the new item
                setTimeout(() => {
                    this.props.loadItem(nextProps.itemId, nextProps.itemType);
                }, 0);
            } else {
                // This happens when the Editor has finished loading an existing item
                this.resetForm(nextProps.item);
            }
        } else if (nextProps.item !== null && this.props.item === null) {
            // This happens when the Editor has finished loading an existing item or creating a duplicate
            this.resetForm(nextProps.item, !isExistingItem(nextProps.item) && nextProps.item.duplicate_from);
        } else if (isEqual(omit(this.state.diff, 'calendars'), {}) && get(nextProps, 'initialValues._tempId')) {
            // This happens when creating a new item (when the editor is not currently open)
            this.createNew(nextProps);
        } else if (!this.itemsEqual(get(nextProps, 'item'), get(this.props, 'item'))) {
            // This happens when the item attributes have changed
            if (this.state.partialSave) {
                this.finalisePartialSave(nextProps);
            } else {
                this.resetForm(get(nextProps, 'item') || {});
            }
        } else if (get(this.props, 'initialValues._tempId') && get(nextProps, 'initialValues._tempId') &&
            get(this.props, 'initialValues._tempId') !== get(nextProps, 'initialValues._tempId')) {
            // This happens when creating a new item when the editor currently open with a new item
            this.props.removeNewAutosaveItems();
            this.createNew(nextProps);
        }

        this.tabs[1].enabled = !!nextProps.itemId;
    }

    itemsEqual(nextItem, currentItem) {
        return isEqual(
            pickBy(nextItem, (value, key) => !key.startsWith('_')),
            pickBy(currentItem, (value, key) => !key.startsWith('_'))
        );
    }

    onChangeHandler(field, value, updateDirtyFlag = true) {
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
            diff,
            this.props.formProfiles,
            errors,
            errorMessages
        );

        const newState = {diff, errors, errorMessages};

        if (updateDirtyFlag) {
            newState.dirty = !isEqual(this.props.item, diff);
        }

        this.setState(newState);

        if (this.props.onChange) {
            this.props.onChange(diff);
        }
    }

    _save({post, unpost}) {
        if (!isEqual(this.state.errors, {})) {
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

            return this.props.onSave(itemToUpdate)
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

        if (isEqual(errors, {})) {
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
            dirty: !this.itemsEqual(nextProps.item, this.state.diff),
        });
    }

    onSave() {
        return this._save({post: false, unpost: false});
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

    onSaveAndPost() {
        return this._save({post: true, unpost: false});
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
        const newCoverage = COVERAGES.DEFAULT_VALUE(newsCoverageStatus, item, g2ContentType);

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

    onCancel() {
        if (this.tearDownRequired || !isExistingItem(this.props.item)) {
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
        this.setState({tab});
    }

    onMinimized() {
        this.props.minimize();

        if (this.props.onCancel) {
            this.props.onCancel();
        }
    }

    render() {
        if (!this.props.itemType) {
            return null;
        }

        const RenderTab = this.tabs[this.state.tab].enabled ? this.tabs[this.state.tab].render :
            this.tabs[0].render;

        // Do not show the tabs if we're creating a new item
        const existingItem = isExistingItem(this.props.item);
        const isLockRestricted = lockUtils.isLockRestricted(
            this.props.item,
            this.props.session,
            this.props.lockedItems
        );
        const isLocked = lockUtils.getLock(this.props.item, this.props.lockedItems);

        let canEdit = false;

        if (this.props.itemType === ITEM_TYPE.EVENT) {
            canEdit = eventUtils.canEditEvent(
                this.props.item,
                this.props.session,
                this.props.privileges,
                this.props.lockedItems
            );
        } else if (this.props.itemType === ITEM_TYPE.PLANNING) {
            canEdit = planningUtils.canEditPlanning(
                this.props.item,
                null,
                this.props.session,
                this.props.privileges,
                this.props.lockedItems
            );
        }

        return (
            <SidePanel shadowRight={true} className={this.props.className}>
                {(!this.props.isLoadingItem && this.props.itemType) && (
                    <Autosave
                        formName={this.props.itemType}
                        initialValues={this.props.item ? cloneDeep(this.props.item) :
                            cloneDeep(this.props.initialValues)}
                        currentValues={cloneDeep(this.state.diff)}
                        change={this.onChangeHandler}
                    />
                )}
                <EditorHeader
                    item={this.props.item}
                    diff={this.state.diff}
                    onSave={this.onSave}
                    onPost={this.onPost}
                    onSaveAndPost={this.onSaveAndPost}
                    onUnpost={this.onUnpost}
                    onSaveUnpost={this.onSaveUnpost}
                    onAddCoverage={this.onAddCoverage}
                    cancel={this.onCancel}
                    minimize={this.onMinimized}
                    submitting={this.state.submitting}
                    dirty={this.state.dirty}
                    errors={this.state.errors}
                    session={this.props.session}
                    privileges={this.props.privileges}
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
                />
                <Content flex={true} className={this.props.contentClassName}>
                    {existingItem && (
                        <NavTabs
                            tabs={this.tabs}
                            active={this.state.tab}
                            setActive={this.setActiveTab}
                            className="side-panel__content-tab-nav"
                        />
                    )}

                    <div className={
                        classNames('side-panel__content-tab-content',
                            {'editorModal__editor--padding-bottom':
                                !!get(this.props, 'navigation.padContentForNavigation')})} >
                        {(!this.props.isLoadingItem && this.props.itemType) && (
                            <RenderTab
                                item={this.props.item}
                                itemType={this.props.itemType}
                                diff={this.state.diff}
                                onChangeHandler={this.onChangeHandler}
                                readOnly={existingItem && (!canEdit || !isLocked || isLockRestricted)}
                                addNewsItemToPlanning={this.props.addNewsItemToPlanning}
                                submitFailed={this.state.submitFailed}
                                errors={this.state.errors}
                                dirty={this.state.dirty}
                                startPartialSave={this.startPartialSave}
                                navigation={this.props.navigation}
                            />
                        )}
                    </div>
                </Content>
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
    onSaveUnpost: PropTypes.func.isRequired,
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
    removeNewAutosaveItems: PropTypes.func,
    isLoadingItem: PropTypes.bool,
    initialValues: PropTypes.object,
    showUnlock: PropTypes.bool,
    hideItemActions: PropTypes.bool,
    hideMinimize: PropTypes.bool,
    createAndPost: PropTypes.bool,
    newsCoverageStatus: PropTypes.array,
    onChange: PropTypes.func,
    onCancel: PropTypes.func,
    className: PropTypes.string,
    contentClassName: PropTypes.string,
    navigation: PropTypes.object,
    inModalView: PropTypes.bool,
    hideExternalEdit: PropTypes.bool,
    notifyValidationErrors: PropTypes.func,
};
