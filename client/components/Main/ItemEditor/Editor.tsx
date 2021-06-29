import React from 'react';
import {cloneDeep, isEqual} from 'lodash';

import {EDITOR_TYPE, IEditorAPI, IEditorProps, IEditorState} from '../../../interfaces';
import {planningApi, superdeskApi} from '../../../superdeskApi';
import {ITEM_TYPE, UI} from '../../../constants';

import * as actions from '../../../actions';
import {isExistingItem, isItemKilled, itemsEqual, updateFormValues} from '../../../utils';

import {EventEditor} from '../../Events';
import {PlanningEditor} from '../../Planning';
import {Tabs as NavTabs} from '../../UI/Nav';
import {Content, SidePanel} from '../../UI/SidePanel';
import {EditorHeader} from './index';
import {HistoryTab} from '../index';
import {EditorPopupForm} from '../../Editor/EditorPopupForm';

import {ItemManager} from './ItemManager';
import {AutoSave} from './AutoSave';

export class EditorComponent extends React.Component<IEditorProps, IEditorState> {
    autoSave: AutoSave;
    itemManager: ItemManager;
    tearDownRequired: boolean;
    throttledSave: any;
    dom: {scrollContainer: any};
    tabs: Array<any>;
    containerScrollStyle?: string;
    editorApi: IEditorAPI;

    constructor(props) {
        super(props);

        this.editorApi = planningApi.editor(this.props.inModalView ? EDITOR_TYPE.POPUP : EDITOR_TYPE.INLINE);
        this.autoSave = new AutoSave(this);
        this.itemManager = new ItemManager(this);

        this.tearDownRequired = false;
        this.onChangeHandler = this.onChangeHandler.bind(this);
        this.setActiveTab = this.setActiveTab.bind(this);
        this.onCancel = this.onCancel.bind(this);
        this.onMinimized = this.onMinimized.bind(this);
        this.cancelFromHeader = this.cancelFromHeader.bind(this);
        this.onPopupOpen = this.onPopupOpen.bind(this);
        this.onPopupClose = this.onPopupClose.bind(this);

        this.throttledSave = null;
        const {gettext} = superdeskApi.localization;

        this.tabs = [
            {label: gettext('Content'), render: null, enabled: true},
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

        this.dom = {scrollContainer: null};

        this.containerScrollStyle = '';
    }

    componentDidMount() {
        this.itemManager.componentWillMount();
        this.autoSave.componentWillMount();
    }

    componentWillUnmount() {
        this.itemManager.componentWillUnmount();
        this.autoSave.componentWillUnmount();

        if (!this.tearDownRequired) {
            // problem of modal within modal, so setting this before unmount
            this.tearDownEditorState();
        }
    }

    onPopupOpen() {
        if (this.dom.scrollContainer) {
            this.dom.scrollContainer.style.overflow = 'hidden';
        }
    }

    onPopupClose() {
        if (this.dom.scrollContainer) {
            this.dom.scrollContainer.style.overflow = this.containerScrollStyle || '';
        }
    }

    componentDidUpdate(prevProps: Readonly<IEditorProps>, prevState: Readonly<IEditorState>, snapshot?: any) {
        this.itemManager.componentDidUpdate(prevProps);

        if (prevProps.itemType !== this.props.itemType) {
            this.updateTabLabels(this.props);
        }
    }

    onChangeHandler(field, value, updateDirtyFlag = true, saveAutosave = true) {
        // Use a callback to `this.setState` so we get the state value at the exact point when updating.
        // This allows consecutive updates to the state, while allowing React to batch these updates.
        // Otherwise only the last call to onChangeHandler will be applied to state per React batch update
        return new Promise((resolve) => {
            this.setState<'diff'>((prevState: Readonly<IEditorState>) => {
                // If field (name) is passed, it will replace that field
                // Else, entire object will be replaced
                const diff = field ? Object.assign({}, prevState.diff) : cloneDeep(value);
                const newState: Pick<IEditorState, 'diff' | 'dirty'> = {
                    diff: diff,
                    dirty: prevState.dirty
                };

                if (field) {
                    updateFormValues(diff, field, value);
                }

                this.itemManager.validate(this.props, newState, this.state);

                if (updateDirtyFlag) {
                    newState.dirty = this.isDirty(
                        this.state.initialValues,
                        diff
                    );
                }

                if (this.props.onChange) {
                    this.props.onChange(diff);
                }

                return newState;
            }, resolve);
        })
            .then(() => {
                if (saveAutosave) {
                    this.autoSave.saveAutosave(this.props, this.state.diff);
                }

                this.props.saveDiffToStore(this.state.diff);
            });
    }

    isDirty(initialValues, diff) {
        return !itemsEqual(diff, initialValues);
    }

    updateTabLabels(nextProps) {
        const {gettext} = superdeskApi.localization;

        this.tabs[UI.EDITOR.CONTENT_TAB_INDEX].label = nextProps.itemType === ITEM_TYPE.EVENT ?
            gettext('Event Details') :
            gettext('Planning Details');

        this.tabs[UI.EDITOR.HISTORY_TAB_INDEX].enabled = !!nextProps.itemId;
    }

    tearDownEditorState() {
        this.setState({
            errors: {},
            errorMessages: [],
            submitFailed: false,
            diff: {},
        });
    }

    closeEditor() {
        this.props.dispatch<any>(
            actions.main.closeEditor(
                this.props.inModalView
            )
        );
    }

    cancelFromHeader() {
        // If the Editor is open in read-only mode
        // Then simply close the editor
        if (this.props.itemAction === 'read') {
            this.closeEditor();
            return;
        }

        this.autoSave.flushAutosave()
            .then(() => {
                const {
                    openCancelModal,
                    itemId,
                    itemType,
                    addNewsItemToPlanning,
                } = this.props;
                const {dirty, errorMessages, initialValues} = this.state;

                this.setState({submitting: true});

                const updateStates = !addNewsItemToPlanning;

                if (!dirty) {
                    this.onCancel();
                } else {
                    const hasErrors = !isEqual(errorMessages, []);
                    const isKilled = isItemKilled(initialValues);

                    const onCancel = () => {
                        if (updateStates) {
                            this.setState({submitting: false});
                        }
                    };

                    const onIgnore = () => {
                        this.itemManager.unlockAndCancel();
                    };

                    const onSave = (isKilled || hasErrors) ? null :
                        (withConfirmation, updateMethod) => (
                            this.itemManager.save(
                                withConfirmation,
                                updateMethod,
                                true,
                                updateStates
                            )
                        );

                    const onSaveAndPost = (!isKilled || hasErrors) ? null :
                        (withConfirmation, updateMethod) => (
                            this.itemManager.saveAndPost(
                                withConfirmation,
                                updateMethod,
                                true,
                                updateStates
                            )
                        );

                    openCancelModal({
                        itemId: itemId,
                        itemType: itemType,
                        onCancel: onCancel,
                        onIgnore: onIgnore,
                        onSave: onSave,
                        onSaveAndPost: onSaveAndPost,
                    });
                }
            });
    }

    onCancel(updateStates = true) {
        if (updateStates) {
            this.setState({submitting: false});

            if (this.tearDownRequired || !isExistingItem(this.state.initialValues)) {
                this.tearDownEditorState();
            }
        }

        if (this.editorApi.dom.headerInstance?.current != null) {
            this.editorApi.dom.headerInstance.current.unregisterKeyBoardShortcuts();
        }

        if (this.props.onCancel) {
            this.props.onCancel();
        }

        return this.itemManager.unlockAndCancel();
    }

    setActiveTab(tab) {
        if (this.state.tab !== tab) {
            this.setState({tab});

            if (this.props.navigation?.onTabChange != null) {
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

    isReadOnly() {
        return this.editorApi.form.isReadOnly();
    }

    getCurrentTab() {
        const currentTab = this.tabs[this.state.tab].enabled ? this.tabs[this.state.tab] :
            this.tabs[UI.EDITOR.CONTENT_TAB_INDEX];

        if (this.state.tab === UI.EDITOR.CONTENT_TAB_INDEX) {
            switch (this.props.itemType) {
            case ITEM_TYPE.EVENT:
                currentTab.render = EventEditor;
                break;
            case ITEM_TYPE.PLANNING:
                currentTab.render = PlanningEditor;
                break;
            }
        }

        return currentTab;
    }

    renderContent() {
        const existingItem = isExistingItem(this.state.initialValues);
        const isReadOnly = this.isReadOnly();
        const currentTab = this.getCurrentTab();
        const formContainerRefNode = !this.props.inModalView ?
            null :
            this.editorApi.dom.formContainer;

        return (
            <Content
                withSidebar={currentTab.render !== HistoryTab && !this.props.inModalView}
                withTabs={existingItem}
                refNode={formContainerRefNode}
            >
                {!existingItem ? null : (
                    <NavTabs
                        tabs={this.tabs}
                        active={this.state.tab}
                        setActive={this.setActiveTab}
                        className="side-panel__content-tab-nav"
                    />
                )}
                {(this.state.loading || !this.props.groups?.length) ? (
                    <div className="sd-loader" />
                ) : (
                    <currentTab.render
                        original={this.props.item || {}}
                        item={this.state.initialValues || {}}
                        itemExists={isExistingItem(this.state.initialValues)}
                        diff={this.state.diff}
                        onChangeHandler={this.onChangeHandler}
                        readOnly={isReadOnly}
                        addNewsItemToPlanning={this.props.addNewsItemToPlanning}
                        submitting={this.state.submitting}
                        submitFailed={this.state.submitFailed}
                        errors={this.state.errors}
                        dirty={this.state.dirty}
                        navigation={this.props.navigation}
                        notifyValidationErrors={this.props.notifyValidationErrors}
                        popupContainer={(this.props.inModalView || this.props.addNewsItemToPlanning) ?
                            () => this.editorApi.dom.popupContainer?.current :
                            undefined
                        }
                        onPopupOpen={this.onPopupOpen}
                        onPopupClose={this.onPopupClose}
                        {...currentTab.tabProps}
                        inModalView={this.props.inModalView}
                        plannings={this.props.associatedPlannings}
                        event={this.props.associatedEvent}
                        itemManager={this.itemManager}
                        activeNav={this.state.activeNav}
                        groups={this.props.groups ?? []}
                        editorType={this.props.editorType}
                    />
                )}
            </Content>
        );
    }

    render() {
        if (!this.props.itemType || !this.props.itemId) {
            return null;
        }

        const testId = (() => {
            if (this.props.itemType === 'planning') {
                return 'planning-editor';
            } else if (this.props.itemType === 'event') {
                return 'event-editor';
            } else {
                return undefined;
            }
        })();

        return (
            <SidePanel shadowRight={true} bg00={true} className={this.props.className} testId={testId}>
                <EditorHeader
                    diff={this.state.diff}
                    initialValues={this.state.initialValues}
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
                    closeEditorAndOpenModal={this.itemManager.openInModal}
                    users={this.props.users}
                    itemActions={this.props.itemActions}
                    ref={this.editorApi.dom.headerInstance}
                    itemType={this.props.itemType}
                    addNewsItemToPlanning={this.props.addNewsItemToPlanning}
                    showUnlock={this.props.showUnlock}
                    createAndPost={this.props.createAndPost}
                    hideItemActions={this.props.hideItemActions}
                    hideMinimize={this.props.hideMinimize}
                    hideExternalEdit={this.props.hideExternalEdit}
                    associatedEvent={this.props.associatedEvent}
                    associatedPlannings={this.props.associatedPlannings}
                    loading={this.state.loading}
                    itemManager={this.itemManager}
                    autoSave={this.autoSave}
                    itemAction={this.props.itemAction}
                />
                {this.renderContent()}

                <EditorPopupForm editorType={this.props.editorType} />

                {(this.props.inModalView || this.props.addNewsItemToPlanning) && (
                    <div ref={this.editorApi.dom.popupContainer} />
                )}
            </SidePanel>
        );
    }
}
