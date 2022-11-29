import * as React from 'react';
import {connect} from 'react-redux';
import moment from 'moment-timezone';

import {appConfig} from 'appConfig';
import {IFeaturedPlanningItem, IPlanningItem} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';
import {KEYCODES} from '../../../constants';

import * as selectors from '../../../selectors';
import * as actions from '../../../actions';
import {isExistingItem, planningUtils, onEventCapture} from '../../../utils';

import {Button} from 'superdesk-ui-framework/react';
import {Modal} from '../../index';
import {FeaturedPlanningModalSubnav} from './FeaturedPlanningModalSubnav';
import {FeaturedPlanningListGroup} from './FeaturedPlanningListGroup';
import {FeaturedPlanningList} from './FeaturedPlanningList';

import './style.scss';

interface IProps {
    inUse: boolean;
    dirty: boolean;
    readOnly: boolean;
    featuredPlanningItem: IFeaturedPlanningItem;

    selectedPlanningIds: Array<IPlanningItem['_id']>;
    selectedPlanningItems: Array<IPlanningItem>;
    unselectedPlanningIds: Array<IPlanningItem['_id']>;
    unselectedPlanningItems: Array<IPlanningItem>;

    featuredPlanningItems: Array<IPlanningItem>;
    removeList: Array<IPlanningItem>;
    currentSearchDate: moment.Moment;

    isLockedForCurrentUser: boolean;

    closeFeaturedStoriesModal(): void;
    movePlanningToSelectedList(item: IPlanningItem): void;
    movePlanningToUnselectedList(item: IPlanningItem): void;
    removeHighlightForItem(item: IPlanningItem): void;
    updateSelectedList(planningIds: Array<IPlanningItem['_id']>): void;
    onSave(tearDown: boolean): void;
    postFeaturedStory(): void;
}

export class FeaturedPlanningModalComponent extends React.Component<IProps, any> {
    constructor(props) {
        super(props);

        this.handleKeydown = this.handleKeydown.bind(this);
        this.movePlanningToSelectedList = this.movePlanningToSelectedList.bind(this);
        this.movePlanningToUnselectedList = this.movePlanningToUnselectedList.bind(this);
        this.removeHighlightForItem = this.removeHighlightForItem.bind(this);
        this.onSortChange = this.onSortChange.bind(this);
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
            this.props.closeFeaturedStoriesModal();
        }
    }

    onSortChange(items: Array<IPlanningItem>) {
        this.props.updateSelectedList(items.map((item) => item._id));
    }

    movePlanningToSelectedList(item: IPlanningItem, event) {
        onEventCapture(event);
        this.props.movePlanningToSelectedList(item);
    }

    movePlanningToUnselectedList(item: IPlanningItem, event) {
        onEventCapture(event);
        this.props.movePlanningToUnselectedList(item);
    }

    removeHighlightForItem(item: IPlanningItem, event) {
        onEventCapture(event);
        this.props.removeHighlightForItem(item);
    }

    render() {
        if (!this.props.inUse) {
            return null;
        }

        const {gettext} = superdeskApi.localization;
        const canPost = (
            !this.props.readOnly &&
            !this.props.featuredPlanningItem?.posted &&
            this.props.selectedPlanningIds?.length
        );
        const itemUpdatedAfterPosting = planningUtils.isFeaturedPlanningUpdatedAfterPosting(
            this.props.featuredPlanningItem
        );
        const existingItem = isExistingItem(this.props.featuredPlanningItem);
        const canUpdate = (
            itemUpdatedAfterPosting ||
            (
                !this.props.readOnly &&
                existingItem &&
                this.props.dirty &&
                this.props.featuredPlanningItem?.posted
            )
        );
        const emptyMessage = (
            !this.props.unselectedPlanningIds?.length &&
            this.props.featuredPlanningItems?.length
        ) ?
            gettext('All featured planning items are currently selected') :
            gettext('No available selections');

        return (
            <Modal
                show={true}
                fill={true}
                onHide={this.props.closeFeaturedStoriesModal}
            >
                <Modal.Header>
                    <h3 className="modal__heading">
                        {gettext(
                            'Featured Stories based on timezone: {{tz}}',
                            {tz: appConfig.default_timezone}
                        )}
                    </h3>
                    <a
                        className="icn-btn"
                        aria-label={gettext('Close')}
                        onClick={this.props.closeFeaturedStoriesModal}
                    >
                        <i className="icon-close-small" />
                    </a>
                </Modal.Header>
                <Modal.Body
                    noPadding={true}
                    fullHeight={true}
                    noScroll={true}
                >
                    <FeaturedPlanningModalSubnav itemUpdatedAfterPosting={itemUpdatedAfterPosting} />
                    <div className="grid">
                        {(this.props.isLockedForCurrentUser) ? null : (
                            <div className="sd-loader" />
                        )}
                        <FeaturedPlanningListGroup>
                            <FeaturedPlanningList
                                testId="list-available"
                                onClick={this.removeHighlightForItem}
                                readOnly={this.props.readOnly}
                                selectedPlanningIds={this.props.selectedPlanningIds}
                                onAddToSelectedFeaturedPlanning={this.movePlanningToSelectedList}
                                onRemoveFromSelectedFeaturedPlanning={this.movePlanningToUnselectedList}
                                item={undefined}
                                items={this.props.unselectedPlanningItems}
                                emptyMsg={emptyMessage}
                                header={gettext('Available selections')}
                            />
                        </FeaturedPlanningListGroup>
                        <FeaturedPlanningListGroup leftBorder={true}>
                            <FeaturedPlanningList
                                testId="list-selected"
                                onClick={this.removeHighlightForItem}
                                readOnly={this.props.readOnly}
                                selectedPlanningIds={this.props.selectedPlanningIds}
                                onAddToSelectedFeaturedPlanning={this.movePlanningToSelectedList}
                                onRemoveFromSelectedFeaturedPlanning={this.movePlanningToUnselectedList}
                                item={this.props.featuredPlanningItem}
                                items={this.props.selectedPlanningItems}
                                emptyMsg={gettext('No selected featured stories')}
                                header={gettext('Currently Selected')}
                                showAuditInformation={true}
                                withMargin={true}
                                onSortChange={this.onSortChange}
                                sortable={true}
                            />

                            {!this.props.removeList?.length ? null : (
                                <FeaturedPlanningList
                                    testId="list-removed"
                                    onClick={this.removeHighlightForItem}
                                    readOnly={true}
                                    disabled={true}
                                    selectedPlanningIds={this.props.selectedPlanningIds}
                                    onAddToSelectedFeaturedPlanning={this.movePlanningToSelectedList}
                                    onRemoveFromSelectedFeaturedPlanning={this.movePlanningToUnselectedList}
                                    item={this.props.featuredPlanningItem}
                                    items={this.props.removeList}
                                    emptyMsg={emptyMessage}
                                    header={gettext('Selections automatically removed')}
                                    showAuditInformation={false}
                                    withMargin={true}
                                />
                            )}
                        </FeaturedPlanningListGroup>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        text={this.props.dirty ? gettext('Cancel') : gettext('Close')}
                        onClick={this.props.closeFeaturedStoriesModal}
                    />
                    {!canPost ? null : (
                        <Button
                            type="success"
                            text={gettext('Post')}
                            onClick={this.props.postFeaturedStory}
                        />
                    )}
                    {!canUpdate ? null : (
                        <Button
                            type="warning"
                            text={gettext('Update')}
                            onClick={this.props.postFeaturedStory}
                        />
                    )}
                    {!this.props.dirty ? null : (
                        <Button
                            type="primary"
                            text={gettext('Save')}
                            onClick={this.props.onSave.bind(null, false)}
                        />
                    )}
                </Modal.Footer>
            </Modal>
        );
    }
}

const mapStateToProps = (state) => ({
    isLockedForCurrentUser: selectors.featuredPlanning.isLockedForCurrentUser(state),
    inUse: selectors.featuredPlanning.inUse(state),
    featuredPlanningItem: selectors.featuredPlanning.featuredPlanningItem(state),
    currentSearchDate: selectors.featuredPlanning.currentSearchDate(state),
    featuredPlanningItems: selectors.featuredPlanning.storedPlannings(state),
    featuredPlanIdsInList: selectors.featuredPlanning.featuredPlanIdsInList(state),
    lockedItems: selectors.locks.getLockedItems(state),
    users: selectors.general.users(state),
    desks: selectors.general.desks(state),
    contentTypes: selectors.general.contentTypes(state),
    removeList: selectors.featuredPlanning.autoRemovedPlanningItems(state),
    selectedPlanningIds: selectors.featuredPlanning.selectedPlanningIds(state),
    unselectedPlanningIds: selectors.featuredPlanning.unselectedPlanningIds(state),
    dirty: selectors.featuredPlanning.isDirty(state),
    readOnly: selectors.featuredPlanning.isReadOnly(state),
    selectedPlanningItems: selectors.featuredPlanning.selectedPlanningItems(state),
    unselectedPlanningItems: selectors.featuredPlanning.unselectedPlanningItems(state),
});

const mapDispatchToProps = (dispatch) => ({
    closeFeaturedStoriesModal: () => dispatch(actions.planning.featuredPlanning.closeFeaturedStoriesModal()),
    movePlanningToSelectedList: (item) => dispatch(actions.planning.featuredPlanning.movePlanningToSelectedList(item)),
    movePlanningToUnselectedList: (item) => (
        dispatch(actions.planning.featuredPlanning.movePlanningToUnselectedList(item))
    ),
    removeHighlightForItem: (item) => dispatch(actions.planning.featuredPlanning.removeHighlightForItem(item)),
    updateSelectedList: (planningIds) => dispatch(actions.planning.featuredPlanning.updateSelectedList(planningIds)),
    onSave: (teardown) => dispatch(actions.planning.featuredPlanning.saveFeaturedStory(teardown)),
    postFeaturedStory: () => dispatch(actions.planning.featuredPlanning.postFeaturedStory()),
});

export const FeaturedPlanningModal = connect(mapStateToProps, mapDispatchToProps)(FeaturedPlanningModalComponent);
