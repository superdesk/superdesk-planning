import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get, isEqual, cloneDeep} from 'lodash';

import * as actions from '../../../actions';
import {EventEditor} from '../../Events';
import {PlanningEditor} from '../../Planning';

import {
    gettext,
    updateFormValues,
    isExistingItem,
    isItemKilled,
    itemsEqual,
    isItemReadOnly,
} from '../../../utils';

import {ITEM_TYPE, UI} from '../../../constants';

import {Tabs as NavTabs} from '../../UI/Nav';
import {SidePanel, Content} from '../../UI/SidePanel';

import {EditorHeader} from './index';
import {HistoryTab} from '../index';

import {ItemManager} from './ItemManager';
import {AutoSave} from './AutoSave';


export class EditorComponent extends React.Component {
    constructor(props) {
        super(props);

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

        this.dom = {
            autosave: null,
            popupContainer: null,
            editorHeaderComponent: null,
            scrollContainer: null,
        };
    }

    componentWillMount() {
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

    componentWillReceiveProps(nextProps) {
        this.itemManager.componentWillReceiveProps(nextProps);

        if (nextProps.itemType !== this.props.itemType) {
            this.updateTabLabels(nextProps);
        }
    }

    onChangeHandler(field, value, updateDirtyFlag = true, saveAutosave = true) {
        // If field (name) is passed, it will replace that field
        // Else, entire object will be replaced
        const diff = field ? Object.assign({}, this.state.diff) : cloneDeep(value);
        const newState = {diff};

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

        this.setState(newState);

        if (this.props.onChange) {
            this.props.onChange(diff);
        }

        if (saveAutosave) {
            this.autoSave.saveAutosave(this.props, diff);
        }
    }

    isDirty(initialValues, diff) {
        return !itemsEqual(diff, initialValues);
    }

    updateTabLabels(nextProps) {
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
        this.props.dispatch(
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

        if (this.dom.editorHeaderComponent) {
            this.dom.editorHeaderComponent.unregisterKeyBoardShortcuts();
        }

        if (this.props.onCancel) {
            this.props.onCancel();
        }

        return this.itemManager.unlockAndCancel();
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

    isReadOnly(props) {
        return this.props.itemAction === 'read' || isItemReadOnly(
            this.state.initialValues,
            props.session,
            props.privileges,
            props.lockedItems,
            props.associatedEvent
        );
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
        const isReadOnly = this.isReadOnly(this.props);
        const currentTab = this.getCurrentTab();

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
                onScroll={this.onScroll}
                ref={(ref) => {
                    this.dom.scrollContainer = ref;
                    if (ref && ref.style.overflow !== 'hidden') {
                        this.containerScrollStyle = ref.style.overflow;
                    }
                }} >
                    {(!this.state.loading && this.props.itemType) ? (
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
                                () => this.dom.popupContainer : undefined
                            }
                            onPopupOpen={this.onPopupOpen}
                            onPopupClose={this.onPopupClose}
                            {...currentTab.tabProps}
                            inModalView={this.props.inModalView}
                            plannings={this.props.associatedPlannings}
                            event={this.props.associatedEvent}
                            itemManager={this.itemManager}
                        />
                    ) : (
                        <div className="sd-loader" />
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
            <SidePanel shadowRight={true} bg00={true} className={this.props.className}>
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
                    ref={(ref) => this.dom.editorHeaderComponent = ref}
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

                {(this.props.inModalView || this.props.addNewsItemToPlanning) && (
                    <div ref={(node) => this.dom.popupContainer = node} />
                )}
            </SidePanel>
        );
    }
}

EditorComponent.propTypes = {
    item: PropTypes.object,
    itemId: PropTypes.string,
    itemType: PropTypes.string,
    itemAction: PropTypes.string,
    minimize: PropTypes.func.isRequired,
    session: PropTypes.object,
    privileges: PropTypes.object,
    lockedItems: PropTypes.object,
    openCancelModal: PropTypes.func.isRequired,
    users: PropTypes.array,
    addNewsItemToPlanning: PropTypes.object,
    formProfiles: PropTypes.object,
    occurStatuses: PropTypes.array,
    itemActions: PropTypes.object,
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
    defaultDesk: PropTypes.object,
    preferredCoverageDesks: PropTypes.object,
    associatedPlannings: PropTypes.arrayOf(PropTypes.object),
    associatedEvent: PropTypes.object,
    dispatch: PropTypes.func,
    currentWorkspace: PropTypes.string,
};
