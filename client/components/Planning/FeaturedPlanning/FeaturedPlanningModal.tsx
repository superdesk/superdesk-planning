import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import moment from 'moment';
import classNames from 'classnames';
import {arrayMove} from 'react-sortable-hoc';
import {get, difference, xor, isEqual, some} from 'lodash';

import {appConfig} from 'appConfig';

import * as actions from '../../../actions';
import * as selectors from '../../../selectors';
import {MODALS, TIME_COMPARISON_GRANULARITY, KEYCODES} from '../../../constants';
import {gettext, onEventCapture, isExistingItem, isItemPublic, planningUtils} from '../../../utils';

import {Modal} from '../../index';
import {Button} from '../../UI';
import {SubNav, SlidingToolBar} from '../../UI/SubNav';
import {JumpToDropdown} from '../../Main';
import {FeaturedPlanningList} from './FeaturedPlanningList';
import {FeaturedPlanningSelectedList} from './FeaturedPlanningSelectedList';
import {FeaturedPlanningListGroup} from './FeaturedPlanningListGroup';

export class FeaturedPlanningModalComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            unselectedPlanningIds: [],
            selectedPlanningIds: [],
            planningsToRemove: [],
            notifications: [],
            highlights: [],
            dirty: false,
        };

        this.onAddToSelectedPlanning = this.onAddToSelectedPlanning.bind(this);
        this.onRemoveFromSelectedPlanning = this.onRemoveFromSelectedPlanning.bind(this);
        this.onSelectedItemsSortEnd = this.onSelectedItemsSortEnd.bind(this);
        this.onDateChange = this.onDateChange.bind(this);
        this.onCloseModal = this.onCloseModal.bind(this);
        this.onSave = this.onSave.bind(this);
        this.onPost = this.onPost.bind(this);
        this.onNotificationsAccepted = this.onNotificationsAccepted.bind(this);
        this.removeHighlightForItem = this.removeHighlightForItem.bind(this);
        this.onSortStart = this.onSortStart.bind(this);
        this.save = this.save.bind(this);
        this.handleKeydown = this.handleKeydown.bind(this);
    }

    componentDidMount() {
        document.addEventListener('keydown', this.handleKeydown);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeydown);
    }

    handleKeydown(event) {
        if (event.keyCode === KEYCODES.ESCAPE) {
            event.preventDefault();
            this.onCloseModal();
        }
    }

    componentWillMount() {
        if (!this.props.inUse) {
            return;
        }

        if (!this.props.unsavedItems) {
            this.props.loadFeaturedPlanningsData(this.props.currentSearchDate);
        } else {
            // Loading from ignore-cancel-save
            this.setState({
                unselectedPlanningIds: difference(this.props.featuredPlanningItems.map((i) => i._id),
                    this.props.unsavedItems),
                selectedPlanningIds: this.props.unsavedItems,
                dirty: true,
            });
        }
    }

    componentWillReceiveProps(nextProps) {
        if (!this.props.loading && nextProps.loading) {
            // Loading new set of data
            this.setState({
                selectedPlanningIds: [],
                unselectedPlanningIds: [],
                dirty: false,
            });
        } else if (this.props.loading && !nextProps.loading &&
            nextProps.featuredPlanningItems.length === nextProps.total) {
            // Loading complete
            this.setState(this.getNewState(nextProps));
        } else if (!this.props.loading) {
            if (!isEqual(this.props.featuredPlanningItem, nextProps.featuredPlanningItem)) {
                this.setState(this.getNewState(nextProps));
            }

            if (!isEqual(this.props.featuredPlanningItems, nextProps.featuredPlanningItems)) {
                // on update notifications
                const addedPlannings = difference(nextProps.featuredPlanIdsInList, this.props.featuredPlanIdsInList);
                const removedPlannings = difference(this.props.featuredPlanIdsInList, nextProps.featuredPlanIdsInList);
                const selectedPlanningIds = this.state.selectedPlanningIds.filter(
                    (id) => nextProps.featuredPlanIdsInList.includes(id));
                let unselectedPlanningIds = [...this.state.unselectedPlanningIds, ...addedPlannings];

                unselectedPlanningIds = unselectedPlanningIds.filter(
                    (id) => !removedPlannings.includes(id) && !selectedPlanningIds.includes(id));

                const notifications = [], highlights = [...addedPlannings];

                if (addedPlannings.length > 0) {
                    addedPlannings.forEach((id) => {
                        const item = nextProps.featuredPlanningItems.find((p) => p._id === id);

                        notifications.push(`Story with slugline '${item.slugline}' is added to the list`);
                    });
                }

                if (removedPlannings.length > 0) {
                    removedPlannings.forEach((id) => {
                        const item = this.props.featuredPlanningItems.find((p) => p._id === id);

                        if (item) {
                            notifications.push(`Story with slugline '${item.slugline}' is removed from the list`);
                        }
                    });
                }

                this.setState({
                    unselectedPlanningIds: unselectedPlanningIds,
                    selectedPlanningIds: selectedPlanningIds,
                    dirty: get(nextProps, 'removeList.length', 0) > 0 || (
                        xor(
                            get(this.props, 'featuredPlanningItem.items', []),
                            selectedPlanningIds
                        ).length > 0
                    ),
                    notifications: notifications,
                    highlights: highlights,
                });
            }

            if (get(nextProps, 'removeList.length', 0) > 0) {
                this.setState({dirty: true});
            }
        }
    }

    getNewState(props) {
        const existingItem = isExistingItem(props.featuredPlanningItem);
        const planingIds = props.featuredPlanningItems.map((i) => i._id);
        const selectedPlanningIds = (existingItem || this.isReadOnly()) ?
            get(props, 'featuredPlanningItem.items', []) :
            planingIds;

        return {
            unselectedPlanningIds: difference(planingIds, selectedPlanningIds),
            selectedPlanningIds: selectedPlanningIds,
            dirty: get(props, 'removeList.length', 0) > 0 || (
                !existingItem && selectedPlanningIds.length > 0 &&
                !this.isReadOnly()
            ),
            highlights: [],
        };
    }

    onDateChange(date) {
        this.props.loadFeaturedPlanningsData(date);
    }

    onAddToSelectedPlanning(item, event) {
        onEventCapture(event);
        let newIds = [...this.state.selectedPlanningIds];

        newIds.unshift(item._id);
        this.setState({
            selectedPlanningIds: newIds,
            unselectedPlanningIds: difference(this.state.unselectedPlanningIds, newIds),
            dirty: xor(get(this.props, 'featuredPlanningItem.items', []),
                newIds).length > 0,
            highlights: [...this.state.highlights, item._id],
        });
    }

    onRemoveFromSelectedPlanning(item, event) {
        onEventCapture(event);
        const newSelectedIds = this.state.selectedPlanningIds.filter((p) => p !== item._id);
        let newIds = [...this.state.unselectedPlanningIds];

        newIds.unshift(item._id);
        this.setState({
            selectedPlanningIds: newSelectedIds,
            unselectedPlanningIds: newIds,
            dirty: xor(get(this.props, 'featuredPlanningItem.items', []),
                newSelectedIds).length > 0,
            highlights: [...this.state.highlights, item._id],
        });
    }

    getUnSelectedPlannings() {
        return get(this.props, 'featuredPlanningItems', []).filter(
            (p) => this.state.unselectedPlanningIds.includes(p._id));
    }

    getSelectedPlannings() {
        return this.state.selectedPlanningIds
            .map((id) =>
                get(this.props, 'featuredPlanningItems', [])
                    .find((p) => p._id === id)
            )
            .filter((p) => p); // Filter out null values
    }

    getListGroupProps(selected = true) {
        return selected ? this.getSelectedPlannings() : this.getUnSelectedPlannings();
    }

    getIdsForSave() {
        // Filter out the items that do not satisfy as a selection for feature planning
        const removeIds = this.props.removeList.map((item) => item._id);

        return this.state.selectedPlanningIds.filter((itemId) => !removeIds.includes(itemId));
    }

    onSave(tearDown) {
        if (get(this.props, 'featuredPlanningItem.posted')) {
            this.props.saveDirtyData(this.state.selectedPlanningIds);
            this.props.openCancelModal({
                bodyText: gettext('Save changes without re-posting?'),
                onSave: this.save.bind(null, false),
                autoClose: true,
                showIgnore: false,
            });
            return;
        }

        this.save(tearDown);
    }

    save(tearDown) {
        let updates = {
            items: this.getIdsForSave(),
            tz: this.props.currentSearchDate.tz(),
        };

        if (!isExistingItem(this.props.featuredPlanningItem)) {
            updates.date = this.props.currentSearchDate.clone();
            updates.date.set({
                [TIME_COMPARISON_GRANULARITY.HOUR]: 0,
                [TIME_COMPARISON_GRANULARITY.MINUTE]: 0,
            });
        }

        this.props.saveFeaturedPlanningForDate(updates)
            .then(() => {
                if (tearDown) {
                    this.props.unsetFeaturePlanningInUse();
                }

                this.onDateChange(
                    moment(get(this.props, 'featuredPlanningItem.date'))
                );
            });
    }

    onPost() {
        // Validate to see if all selected planning items are posted ?
        if (some(this.getSelectedPlannings(), (item) => (!isItemPublic(item)))) {
            const errorMsg = gettext(
                'Some selected items have not yet been posted. All selections must be visible to subscribers.');

            this.props.notifyValidationErrors(errorMsg);
            return;
        }

        const updates = {
            items: this.getIdsForSave(),
            posted: true,
        };

        if (!isExistingItem(this.props.featuredPlanningItem)) {
            updates.date = this.props.currentSearchDate.clone();
            updates.date.set({
                [TIME_COMPARISON_GRANULARITY.HOUR]: 0,
                [TIME_COMPARISON_GRANULARITY.MINUTE]: 0,
            });
            updates.tz = this.props.currentSearchDate.tz();
        }

        this.props.saveFeaturedPlanningForDate(updates)
            .then(() => {
                this.onDateChange(
                    moment(get(this.props, 'featuredPlanningItem.date'))
                );
            });
    }

    // set cursor to move during whole drag
    onSortStart() {
        this.cursor = document.body.style.cursor;
        document.body.style.cursor = 'move';
    }

    onSelectedItemsSortEnd({oldIndex, newIndex}) {
        const newIds = arrayMove(this.state.selectedPlanningIds, oldIndex, newIndex);

        this.setState({
            selectedPlanningIds: newIds,
            dirty: !isEqual(get(this.props, 'featuredPlanningItem.items'), newIds),
        });
        document.body.style.cursor = this.cursor;
    }

    isReadOnly() {
        return this.props.currentSearchDate.isBefore(
            moment().tz(appConfig.defaultTimezone),
            'day'
        );
    }

    onCloseModal() {
        if (!this.state.dirty) {
            this.props.unsetFeaturePlanningInUse();
        } else {
            this.props.saveDirtyData(this.state.selectedPlanningIds);
            this.props.openCancelModal({
                bodyText: gettext(
                    'There are unsaved changes. Are you sure you want to exit Manging Featured Stories?'),
                onIgnore: this.props.unsetFeaturePlanningInUse,
                onSave: this.onSave.bind(null, true),
                autoClose: true,
            });
        }
    }

    onNotificationsAccepted() {
        this.setState({notifications: []});
    }

    removeHighlightForItem(id, event) {
        onEventCapture(event);
        this.setState({highlights: this.state.highlights.filter((h) => h !== id)});
    }

    render() {
        const {
            inUse,
            currentSearchDate,
            lockedItems,
            loading,
            desks,
            users,
            featuredPlanningItems,
            featuredPlanningItem,
            contentTypes,
            removeList,
        } = this.props;

        const emptyMsg = this.state.unselectedPlanningIds.length === 0 &&
            get(featuredPlanningItems, 'length', 0) > 0 ?
            gettext('All featured planning items are currently selected') :
            gettext('No available selections');

        let postButtonText = get(featuredPlanningItem, 'posted') ? gettext('Update') : gettext('Post');

        if (this.state.dirty) {
            postButtonText = gettext('Save & {{post}}', {post: postButtonText});
        }

        const existingItem = isExistingItem(featuredPlanningItem);
        const readOnly = this.isReadOnly();
        const itemUpdatedAfterPosting = planningUtils.isFeaturedPlanningUpdatedAfterPosting(featuredPlanningItem);
        const canPost = !readOnly && !get(featuredPlanningItem, 'posted') &&
            this.state.selectedPlanningIds.length > 0;
        const canUpdate = itemUpdatedAfterPosting || (!readOnly && existingItem && this.state.dirty && get(
            featuredPlanningItem, 'posted'));

        const listProps = {
            highlights: this.state.highlights,
            onClick: this.removeHighlightForItem,
            lockedItems: lockedItems,
            currentSearchDate: currentSearchDate,
            readOnly: readOnly,
            selectedPlanningIds: this.state.selectedPlanningIds,
            loadingIndicator: loading,
            desks: desks,
            users: users,
            onAddToSelectedFeaturedPlanning: this.onAddToSelectedPlanning,
            onRemoveFromSelectedFeaturedPlanning: this.onRemoveFromSelectedPlanning,
            contentTypes: contentTypes,
        };

        if (!inUse) {
            return null;
        }

        return (
            <Modal show={true} fill={true} onHide={this.onCloseModal}>
                <Modal.Header>
                    <h3 className="modal__heading">{gettext(
                        'Featured Stories based on timezone: {{tz}}',
                        {tz: gettext(appConfig.defaultTimezone)}
                    )}</h3>
                    {<a className="icn-btn" aria-label={gettext('Close')} onClick={this.onCloseModal}>
                        <i className="icon-close-small" />
                    </a>}
                </Modal.Header>
                <Modal.Body noPadding fullHeight noScroll>
                    <SubNav className="grid">
                        {this.state.notifications.length > 0 && (
                            <SlidingToolBar
                                onCancel={this.onNotificationsAccepted}
                                innerInfo={this.state.notifications.join(', ')}
                                cancelText={gettext('Close')}
                                rightCancelButton
                            />
                        )}
                        <div className="grid__item">
                            <JumpToDropdown
                                currentStartFilter={currentSearchDate}
                                setStartFilter={this.onDateChange}
                                defaultTimeZone={appConfig.defaultTimezone}
                                dateFormat="dddd LL"
                                noBorderNoPadding
                            />
                        </div>
                        {this.props.loading && <div className="loading-indicator">{gettext('Loading')}</div>}
                        {itemUpdatedAfterPosting && (
                            <div
                                className={classNames(
                                    'sd-alert',
                                    'sd-alert--alert',
                                    'sd-alert--hollow',
                                    'sd-alert--no-padding',
                                    'sd-alert__icon',
                                    'grid__item--col-1'
                                )}
                            >
                                {gettext('This list contains unposted changes!')}
                            </div>
                        )}
                    </SubNav>
                    <div className="grid">
                        <FeaturedPlanningListGroup>
                            <FeaturedPlanningList
                                {...listProps}
                                items={this.getListGroupProps(false)}
                                emptyMsg={emptyMsg}
                            />
                        </FeaturedPlanningListGroup>
                        <FeaturedPlanningListGroup leftBorder={true}>
                            <FeaturedPlanningSelectedList
                                {...listProps}
                                item={featuredPlanningItem}
                                items={this.getListGroupProps()}
                                onSortEnd={this.onSelectedItemsSortEnd}
                                onSortStart={this.onSortStart}
                            />

                            {get(removeList, 'length', 0) > 0 && (
                                <FeaturedPlanningList
                                    {...listProps}
                                    header={gettext('Selections automatically removed')}
                                    readOnly={true}
                                    items={removeList}
                                    emptyMsg={emptyMsg}
                                    disabled={true}
                                />
                            )}
                        </FeaturedPlanningListGroup>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        text={this.state.dirty ? gettext('Cancel') : gettext('Close')}
                        onClick={this.onCloseModal}
                    />
                    {canPost && (
                        <Button
                            color="success"
                            text={postButtonText}
                            onClick={this.onPost}
                        />
                    )}
                    {canUpdate && (
                        <Button
                            color="warning"
                            text={postButtonText}
                            onClick={this.onPost}
                        />
                    )}
                    {this.state.dirty && (
                        <Button
                            color="primary"
                            text={gettext('Save')}
                            onClick={this.onSave.bind(null, false)}
                        />
                    )}
                </Modal.Footer>
            </Modal>
        );
    }
}

FeaturedPlanningModalComponent.propTypes = {
    actionInProgress: PropTypes.bool,
    modalProps: PropTypes.object,
    inUse: PropTypes.bool,
    getFeaturedPlanningsForDate: PropTypes.func,
    currentSearchDate: PropTypes.object,
    lockedItems: PropTypes.object,
    loadingIndicator: PropTypes.bool,
    desks: PropTypes.array,
    users: PropTypes.array,
    featuredPlanningItem: PropTypes.object,
    setFeaturePlanningInUse: PropTypes.func,
    unsavedItems: PropTypes.array,
    loadFeaturedPlanningsData: PropTypes.func,
    featuredPlanningItems: PropTypes.array,
    loading: PropTypes.bool,
    total: PropTypes.number,
    featuredPlanIdsInList: PropTypes.array,
    saveFeaturedPlanningForDate: PropTypes.func,
    unsetFeaturePlanningInUse: PropTypes.func,
    saveDirtyData: PropTypes.func,
    openCancelModal: PropTypes.func,
    notifyValidationErrors: PropTypes.func,
    contentTypes: PropTypes.array,
    removeList: PropTypes.array,
};

FeaturedPlanningModalComponent.defaultProps = {featuredPlanningItem: {}};

const mapStateToProps = (state) => ({
    unsavedItems: selectors.featuredPlanning.unsavedItems(state),
    inUse: selectors.featuredPlanning.inUse(state),
    total: selectors.featuredPlanning.total(state),
    loading: selectors.featuredPlanning.loading(state),
    featuredPlanningItem: selectors.featuredPlanning.featuredPlanningItem(state),
    currentSearchDate: selectors.featuredPlanning.currentSearchDate(state),
    featuredPlanningItems: selectors.featuredPlanning.orderedFeaturedPlanningList(state),
    featuredPlanIdsInList: selectors.featuredPlanning.featuredPlanIdsInList(state),
    lockedItems: selectors.locks.getLockedItems(state),
    loadingIndicator: selectors.main.loadingIndicator(state),
    users: selectors.general.users(state),
    desks: selectors.general.desks(state),
    contentTypes: selectors.general.contentTypes(state),
    removeList: selectors.featuredPlanning.featuredPlaningToRemove(state),
});

const mapDispatchToProps = (dispatch) => ({
    saveDirtyData: (ids) => dispatch(actions.planning.featuredPlanning.saveDirtyData(ids)),
    loadFeaturedPlanningsData: (date) =>
        dispatch(actions.planning.featuredPlanning.loadFeaturedPlanningsData(date)),
    getFeaturedPlanningItemForDate: (date) =>
        dispatch(actions.planning.featuredPlanning.getFeaturedPlanningItemForDate(date)),
    setFeaturePlanningInUse: () => dispatch(actions.planning.featuredPlanning.setFeaturePlanningInUse()),
    unsetFeaturePlanningInUse: () => dispatch(actions.planning.featuredPlanning.unsetFeaturePlanningInUse()),
    saveFeaturedPlanningForDate: (item) =>
        dispatch(actions.planning.featuredPlanning.saveFeaturedPlanningForDate(item)),
    openCancelModal: (modalProps) => (
        dispatch(actions.showModal({
            modalType: MODALS.IGNORE_CANCEL_SAVE,
            modalProps: modalProps,
        }))
    ),
    notifyValidationErrors: (msg) => (dispatch(actions.main.notifyValidationErrors([msg]))),
});

export const FeaturedPlanningModal = connect(mapStateToProps, mapDispatchToProps)(FeaturedPlanningModalComponent);
