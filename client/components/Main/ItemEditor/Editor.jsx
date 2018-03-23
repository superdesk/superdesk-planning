import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get, isEqual, cloneDeep} from 'lodash';

import {gettext, lockUtils, eventUtils, planningUtils, updateFormValues} from '../../../utils';
import actionUtils from '../../../utils/actions';

import {ITEM_TYPE, EVENTS, PLANNING, WORKSPACE, PUBLISHED_STATE, WORKFLOW_STATE} from '../../../constants';
import * as selectors from '../../../selectors';
import * as actions from '../../../actions';

import {Button} from '../../UI';
import {Toolbar as SlideInToolbar} from '../../UI/SlideInPanel';
import {Tabs as NavTabs} from '../../UI/Nav';
import {SidePanel, Content} from '../../UI/SidePanel';

import {EditorHeader, EditorContentTab} from './index';
import {HistoryTab} from '../index';
import {Autosave} from '../../index';

import {validateItem} from '../../../validators';

export class EditorComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tab: 0,
            diff: {},
            errors: {},
            dirty: false,
            submitting: false,
            submitFailed: false,
            showSubmitFailed: false,
        };

        this.inPlanning = false;
        this.editorHeaderComponent = null;
        this.onChangeHandler = this.onChangeHandler.bind(this);
        this.setActiveTab = this.setActiveTab.bind(this);
        this.onSave = this.onSave.bind(this);
        this.onPublish = this.onPublish.bind(this);
        this.onSaveAndPublish = this.onSaveAndPublish.bind(this);
        this.onUnpublish = this.onUnpublish.bind(this);
        this.onSaveUnpublish = this.onSaveUnpublish.bind(this);
        this.onCancel = this.onCancel.bind(this);
        this.hideSubmitFailed = this.hideSubmitFailed.bind(this);
        this.resetForm = this.resetForm.bind(this);
        this.createNew = this.createNew.bind(this);

        this.tabs = [
            {label: gettext('Content'), render: EditorContentTab, enabled: true},
            {label: gettext('History'), render: HistoryTab, enabled: true},
        ];

        if (this.props.currentWorkspace === WORKSPACE.PLANNING) {
            this.inPlanning = true;
        }
    }

    componentDidMount() {
        // If the item is located in the URL, on first mount copy the diff from the item.
        // Otherwise all item changes will occur during the componentWillReceiveProps
        if (this.props.itemId && this.props.itemType) {
            this.props.loadItem(this.props.itemId, this.props.itemType);
        }
    }

    componentWillUnmount() {
        if (!this.inPlanning) {
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
        });
    }

    createNew(props) {
        if (props.itemType === ITEM_TYPE.EVENT) {
            if (isEqual(props.initialValues, {type: ITEM_TYPE.EVENT})) {
                this.resetForm(EVENTS.DEFAULT_VALUE(props.occurStatuses));
            } else {
                this.resetForm(props.initialValues, true);
            }
        } else if (props.itemType === ITEM_TYPE.PLANNING) {
            if (isEqual(props.initialValues, {type: ITEM_TYPE.PLANNING})) {
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
                // Using setTimeout allows the Editor to clear before displaying the new item
                setTimeout(() => {
                    this.props.loadItem(nextProps.itemId, nextProps.itemType);
                }, 0);
            } else {
                // This happens when the Editor has finished loading an existing item
                this.resetForm(nextProps.item);
            }
        } else if (nextProps.item !== null && this.props.item === null) {
            // This happens when the Editor has finished loading an existing item
            this.resetForm(nextProps.item);
        } else if (isEqual(this.state.diff, {}) && nextProps.itemType !== null) {
            // This happens when creating a new item (when the editor is not currently open)
            this.createNew(nextProps);
        } else if (!isEqual(get(nextProps, 'item'), get(this.props, 'item'))) {
            // This happens when the item attributes have changed
            this.resetForm(get(nextProps, 'item') || {});
        }

        this.tabs[1].enabled = !!nextProps.itemId;
    }

    onChangeHandler(field, value) {
        // If field (name) is passed, it will replace that field
        // Else, entire object will be replaced
        const diff = field ? Object.assign({}, this.state.diff) : cloneDeep(value);
        const errors = cloneDeep(this.state.errors);

        if (field) {
            updateFormValues(diff, field, value);
        }

        this.props.onValidate(
            this.props.itemType,
            diff,
            this.props.formProfiles,
            errors
        );

        this.setState({
            diff: diff,
            dirty: !isEqual(this.props.item, diff),
            errors: errors
        });
    }

    _save({publish, unpublish}) {
        if (!isEqual(this.state.errors, {})) {
            this.setState({
                submitFailed: true,
                showSubmitFailed: true,
            });
        } else {
            this.setState({
                submitting: true,
                submitFailed: false,
                showSubmitFailed: false,
            });

            // If we are publishing or unpublishing, we are setting 'pubstatus' to 'usable' from client side
            let itemToUpdate = cloneDeep(this.state.diff);

            if (publish) {
                itemToUpdate.state = WORKFLOW_STATE.SCHEDULED;
                itemToUpdate.pubstatus = PUBLISHED_STATE.USABLE;
            } else if (unpublish) {
                itemToUpdate.state = WORKFLOW_STATE.KILLED;
                itemToUpdate.pubstatus = PUBLISHED_STATE.CANCELLED;
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

    onSave() {
        return this._save({publish: false, unpublish: false});
    }

    onPublish() {
        this.setState({
            submitting: true,
            submitFailed: false,
            showSubmitFailed: false,
        });

        return this.props.onPublish(this.state.diff)
            .then(
                () => this.setState({
                    submitting: false,
                    dirty: false,
                }),
                () => this.setState({submitting: false})
            );
    }

    onSaveAndPublish() {
        return this._save({publish: true, unpublish: false});
    }

    onUnpublish() {
        this.setState({
            submitting: true,
            submitFailed: false,
            showSubmitFailed: false,
        });

        return this.props.onUnpublish(this.state.diff)
            .then(
                () => this.setState({
                    submitting: false,
                    dirty: false,
                }),
                () => this.setState({submitting: false})
            );
    }

    onSaveUnpublish() {
        return this._save({publish: false, unpublish: true});
    }

    tearDownEditorState() {
        this.setState({
            errors: {},
            submitFailed: false,
            showSubmitFailed: false,
        });
    }

    onCancel() {
        if (this.inPlanning) {
            this.tearDownEditorState();
        }

        if (this.editorHeaderComponent) {
            this.editorHeaderComponent.unregisterKeyBoardShortcuts();
        }

        this.props.cancel(this.props.item || this.props.initialValues);
    }

    setActiveTab(tab) {
        this.setState({tab});
    }

    hideSubmitFailed() {
        this.setState({showSubmitFailed: false});
    }

    render() {
        if (!this.props.itemType) {
            return null;
        }

        const RenderTab = this.tabs[this.state.tab].render;

        // Do not show the tabs if we're creating a new item
        const existingItem = !!this.props.item;
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
            <SidePanel shadowRight={true}>
                {(!this.props.isLoadingItem && this.props.itemType) && (
                    <Autosave
                        formName={this.props.itemType}
                        initialValues={cloneDeep(this.props.item)}
                        currentValues={cloneDeep(this.state.diff)}
                        change={this.onChangeHandler}
                    />
                )}
                <EditorHeader
                    item={this.props.item}
                    onSave={this.onSave}
                    onPublish={this.onPublish}
                    onSaveAndPublish={this.onSaveAndPublish}
                    onUnpublish={this.onUnpublish}
                    onSaveUnpublish={this.onSaveUnpublish}
                    cancel={this.onCancel}
                    minimize={this.props.minimize}
                    submitting={this.state.submitting}
                    dirty={this.state.dirty}
                    errors={this.state.errors}
                    session={this.props.session}
                    privileges={this.props.privileges}
                    lockedItems={this.props.lockedItems}
                    openCancelModal={this.props.openCancelModal}
                    users={this.props.users}
                    onUnlock={this.props.onUnlock}
                    onLock={this.props.onLock}
                    itemActions={this.props.itemActions}
                    currentWorkspace={this.props.currentWorkspace}
                    ref={(ref) => this.editorHeaderComponent = ref}
                    itemType={this.props.itemType}
                />
                <Content flex={true}>
                    {this.state.showSubmitFailed && (
                        <div>
                            <SlideInToolbar invalid={true}>
                                <h3>{existingItem ?
                                    gettext('Failed to save!') :
                                    gettext('Failed to create!')}
                                </h3>
                                <Button
                                    text={gettext('OK')}
                                    hollow={true}
                                    color="alert"
                                    onClick={this.hideSubmitFailed}
                                />
                            </SlideInToolbar>
                        </div>
                    )}
                    {!this.state.showSubmitFailed && existingItem && (
                        <NavTabs
                            tabs={this.tabs}
                            active={this.state.tab}
                            setActive={this.setActiveTab}
                            className="side-panel__content-tab-nav"
                        />
                    )}

                    <div className="side-panel__content-tab-content">
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
    onPublish: PropTypes.func.isRequired,
    onUnpublish: PropTypes.func.isRequired,
    onSaveUnpublish: PropTypes.func.isRequired,
    session: PropTypes.object,
    privileges: PropTypes.object,
    lockedItems: PropTypes.object,
    openCancelModal: PropTypes.func.isRequired,
    users: PropTypes.array,
    onUnlock: PropTypes.func,
    onLock: PropTypes.func,
    addNewsItemToPlanning: PropTypes.object,
    onValidate: PropTypes.func,
    formProfiles: PropTypes.object,
    occurStatuses: PropTypes.array,
    itemActions: PropTypes.object,
    currentWorkspace: PropTypes.string,
    loadItem: PropTypes.func,
    isLoadingItem: PropTypes.bool,
    initialValues: PropTypes.object,
};

const mapStateToProps = (state) => ({
    item: selectors.forms.currentItem(state),
    itemId: selectors.forms.currentItemId(state),
    itemType: selectors.forms.currentItemType(state),
    initialValues: selectors.forms.initialValues(state),
    users: selectors.getUsers(state),
    formProfiles: selectors.forms.profiles(state),
    occurStatuses: selectors.vocabs.eventOccurStatuses(state),
    isLoadingItem: selectors.forms.isLoadingItem(state),
    session: selectors.getSessionDetails(state),
    privileges: selectors.getPrivileges(state),
    lockedItems: selectors.locks.getLockedItems(state),
    currentWorkspace: selectors.getCurrentWorkspace(state),
});

const mapDispatchToProps = (dispatch) => ({
    onUnlock: (item) => dispatch(actions.locks.unlockThenLock(item)),
    onLock: (item) => dispatch(actions.locks.lock(item)),
    minimize: () => dispatch(actions.main.closeEditor()),
    cancel: (item) => dispatch(actions.main.unlockAndCancel(item)),
    onSave: (item) => dispatch(actions.main.save(item)),
    onUnpublish: (item) => dispatch(actions.main.unpublish(item)),
    onPublish: (item) => dispatch(actions.main.publish(item)),
    onSaveUnpublish: (item) => dispatch(actions.main.onSaveUnpublish(item)),
    openCancelModal: (props) => dispatch(actions.main.openConfirmationModal(props)),
    onValidate: (type, item, profile, errors) => dispatch(validateItem(type, item, profile, errors)),
    loadItem: (itemId, itemType) => dispatch(actions.main.loadItem(itemId, itemType, 'edit')),
    itemActions: actionUtils.getActionDispatches(dispatch),
});

export const Editor = connect(mapStateToProps, mapDispatchToProps)(EditorComponent);

