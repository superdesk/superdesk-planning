import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {get, set, isEqual, cloneDeep} from 'lodash';

import {gettext, lockUtils} from '../../utils';

import {ITEM_TYPE, EVENTS, PLANNING} from '../../constants';
import * as selectors from '../../selectors';
import * as actions from '../../actions';

import {
    HistoryTab,
    EditorContentTab
} from './';

import {Button} from '../UI';
import {Toolbar as SlideInToolbar} from '../UI/SlideInPanel';
import {Tabs as NavTabs} from '../UI/Nav';
import {SidePanel, Content} from '../UI/SidePanel';

import {EditorHeader} from './EditorHeader';
import {Autosave} from '../';

import {validateItem} from '../../validators';

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

        this.onChangeHandler = this.onChangeHandler.bind(this);
        this.setActiveTab = this.setActiveTab.bind(this);
        this.onSave = this.onSave.bind(this);
        this.onPublish = this.onPublish.bind(this);
        this.onSaveAndPublish = this.onSaveAndPublish.bind(this);
        this.onUnpublish = this.onUnpublish.bind(this);
        this.onCancel = this.onCancel.bind(this);
        this.hideSubmitFailed = this.hideSubmitFailed.bind(this);

        this.tabs = [
            {label: gettext('Content'), render: EditorContentTab, enabled: true},
            {label: gettext('History'), render: HistoryTab, enabled: true},
        ];
    }

    componentWillReceiveProps(nextProps) {
        if (!get(nextProps, 'item') && get(nextProps, 'itemType') && !get(this.props, 'itemType')) {
            let diff;

            if (nextProps.itemType === ITEM_TYPE.EVENT) {
                diff = cloneDeep(EVENTS.DEFAULT_VALUE(nextProps.occurStatuses));
            } else if (nextProps.itemType === ITEM_TYPE.PLANNING) {
                diff = cloneDeep(PLANNING.DEFAULT_VALUE);
            } else {
                diff = {};
            }

            this.setState({
                diff: diff,
                dirty: false,
                submitting: false,
            });
        } else if (get(nextProps, 'item._id') !== get(this.props, 'item._id')) {
            const diff = cloneDeep(get(nextProps, 'item') || {});

            this.setState({
                diff: diff,
                dirty: false,
                submitting: false
            });
        } else if (!isEqual(
            get(nextProps, 'item'),
            get(this.props, 'item')
        )) {
            const diff = cloneDeep(get(nextProps, 'item') || {});

            this.setState({
                diff: diff,
                dirty: false,
                submitting: false
            });
        }

        this.tabs[1].enabled = !!get(nextProps, 'item._id');
    }

    onChangeHandler(field, value) {
        // If field (name) is passed, it will replace that field
        // Else, entire object will be replaced
        const diff = field ? Object.assign({}, this.state.diff) : cloneDeep(value);
        const errors = cloneDeep(this.state.errors);

        if (field) {
            set(diff, field, value);
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

    onSave() {
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
            return this.props.onSave(this.state.diff, true, false);
        }
    }

    onPublish() {
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
            return this.props.onSave(this.state.diff, false, true);
        }
    }

    onSaveAndPublish() {
        if (!isEqual(this.state.errors, {})) {
            this.setState({
                submitFailed: true,
                showSubmitFailed: true,
            });
        } else {
            this.setState({
                submitting: true,
                submitFailed: false,
                showSubmitFailed: false
            });
            return this.props.onSave(this.state.diff, true, true);
        }
    }

    onUnpublish() {
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
            return this.props.onUnpublish(this.state.diff);
        }
    }

    onCancel() {
        this.setState({
            errors: {},
            submitFailed: false,
            showSubmitFailed: false,
        });

        this.props.cancel(this.props.item);
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

        return (
            <SidePanel shadowRight={true}>
                <Autosave
                    formName={this.props.itemType}
                    initialValues={cloneDeep(this.props.item)}
                    currentValues={cloneDeep(this.state.diff)}
                    change={this.onChangeHandler}
                />
                <EditorHeader
                    item={this.props.item}
                    onSave={this.onSave}
                    onPublish={this.onPublish}
                    onSaveAndPublish={this.onSaveAndPublish}
                    onUnpublish={this.onUnpublish}
                    cancel={this.onCancel}
                    minimize={this.props.minimize}
                    submitting={this.state.submitting}
                    dirty={this.state.dirty}
                    session={this.props.session}
                    privileges={this.props.privileges}
                    lockedItems={this.props.lockedItems}
                    openCancelModal={this.props.openCancelModal}
                    users={this.props.users}
                    onUnlock={this.props.onUnlock}
                    onLock={this.props.onLock}
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
                        <RenderTab
                            item={this.props.item}
                            itemType={this.props.itemType}
                            diff={this.state.diff}
                            onChangeHandler={this.onChangeHandler}
                            readOnly={existingItem && (!isLocked || isLockRestricted)}
                            addNewsItemToPlanning={this.props.addNewsItemToPlanning}
                            submitFailed={this.state.submitFailed}
                            errors={this.state.errors}
                            dirty={this.state.dirty}
                        />
                    </div>
                </Content>
            </SidePanel>
        );
    }
}

EditorComponent.propTypes = {
    item: PropTypes.object,
    itemType: PropTypes.string,
    cancel: PropTypes.func.isRequired,
    minimize: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    onUnpublish: PropTypes.func.isRequired,
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
};

const mapStateToProps = (state) => ({
    item: selectors.forms.currentItem(state),
    itemType: selectors.forms.currentItemType(state),
    users: selectors.getUsers(state),
    formProfiles: selectors.forms.profiles(state),
    occurStatuses: state.vocabularies.eventoccurstatus,
});

const mapDispatchToProps = (dispatch) => ({
    onUnlock: (item) => dispatch(actions.locks.unlockThenLock(item)),
    onLock: (item) => dispatch(actions.locks.lock(item)),
    minimize: () => dispatch(actions.main.closeEditor()),
    cancel: (item) => dispatch(actions.main.unlockAndCancel(item)),
    onSave: (item, save, publish) => dispatch(actions.main.save(item, save, publish)),
    onUnpublish: (item) => dispatch(actions.main.unpublish(item)),
    openCancelModal: (props) => dispatch(actions.main.openConfirmationModal(props)),
    onValidate: (type, item, profile, errors) => dispatch(validateItem(type, item, profile, errors))
});

export const Editor = connect(mapStateToProps, mapDispatchToProps)(EditorComponent);

