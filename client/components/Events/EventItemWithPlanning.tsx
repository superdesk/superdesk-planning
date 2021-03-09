import React from 'react';
import {get, findIndex} from 'lodash';

import {
    LIST_VIEW_TYPE,
    IEventListItemProps,
    IPlanningListItemProps,
    IEventItem,
    IEventOrPlanningItem,
    IPlanningItem,
} from '../../interfaces';
import {superdeskApi} from '../../superdeskApi';

import {onEventCapture} from '../../utils';
import {KEYCODES} from '../../constants';

import {EventItem} from '.';
import {PlanningItem} from '../Planning';
import {NestedItem} from '../UI/List';

interface IProps {
    eventProps: IEventListItemProps;
    planningProps: IPlanningListItemProps;
    relatedPlanningsInList: {[key: string]: Array<IPlanningItem>};
    navigateDown?: boolean;
    previewItem: IEventOrPlanningItem['_id'];
    listViewType: LIST_VIEW_TYPE;

    showRelatedPlannings(item: IEventItem): void;
    refNode?(node: HTMLElement): void;
    navigateList(increment?: boolean): void;
    onItemActivate(item: IEventItem, forceActivate?: boolean): void;
}

interface IState {
    openPlanningItems: boolean;
    activeIndex: number;
}

export class EventItemWithPlanning extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);
        this.state = {
            openPlanningItems: false,
            activeIndex: -1, // Index of active nested element (-1=None, 0=event, 1....=respective planning item)
        };
        this.toggleRelatedPlanning = this.toggleRelatedPlanning.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    toggleRelatedPlanning(evt) {
        evt.stopPropagation();
        if (!this.state.openPlanningItems) {
            this.props.showRelatedPlannings(get(this.props, 'eventProps.item', {}));
        }

        const activeIndex = this.state.activeIndex >= 0 ? 0 : this.state.activeIndex;

        this.setState({
            activeIndex: activeIndex,
            openPlanningItems: !this.state.openPlanningItems,
        });

        this.activateItem(activeIndex, false);
    }

    componentWillReceiveProps(nextProps) {
        if (this.state.openPlanningItems) {
            const currentPlannings = get(this.props, 'eventProps.item.planning_ids', []).length;
            const nextPlannings = get(nextProps, 'eventProps.item.planning_ids', []).length;

            if (currentPlannings !== nextPlannings) {
                this.props.showRelatedPlannings(get(nextProps, 'eventProps.item', {}));
            }
        }

        // If the event just got activated - set the right event/planning-item as active
        if (!get(this.props, 'eventProps.active') && get(nextProps, 'eventProps.active')) {
            document.addEventListener('keydown', this.handleKeyDown);

            if (nextProps.navigateDown) {
                // Make event the active element
                this.activateItem(0);
            } else {
                // Make the last planning item as active it navigating up (if planning items are open)
                this.activateItem(!this.state.openPlanningItems ? 0 : this.getRelatedPlanningsForEvent().length);
            }
            return;
        } else if (!get(nextProps, 'eventProps.active') && this.state.activeIndex !== -1) {
            // Got deactivated
            this.deactivateSelf();
            return;
        }

        // If something else was previewed, we need to set the active index appropriately
        if (nextProps.previewItem && this.props.previewItem !== nextProps.previewItem) {
            if (nextProps.previewItem !== get(nextProps, 'eventProps.item._id') &&
                !this.getRelatedPlanningsForEvent(nextProps).map((item) => get(item, '_id'))
                    .includes(nextProps.previewItem)) {
                // Previewed item has nothing with this nested item - so deactivate it
                this.deactivateSelf();
            } else if (nextProps.previewItem === get(nextProps, 'eventProps.item._id') &&
                this.state.activeIndex !== 0) {
                // what's previewed was the event item
                this.setState({activeIndex: 0});
                document.addEventListener('keydown', this.handleKeyDown);
            } else {
                // One of the planning item is previewed by item-click
                const index = findIndex(this.getRelatedPlanningsForEvent(nextProps), (item) =>
                    item._id === nextProps.previewItem);

                if (index >= 0) {
                    this.setState({activeIndex: index + 1});
                    document.addEventListener('keydown', this.handleKeyDown);
                }
            }
        }
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeyDown);
    }

    getNextActiveIndex(increment = true) {
        const nextIndex = increment ? this.state.activeIndex + 1 : this.state.activeIndex - 1;

        // If the planning items are not open or we have the last planning item as active
        // Nothing to scroll to
        if (increment &&
            (!this.state.openPlanningItems || nextIndex > this.getRelatedPlanningsForEvent().length)) {
            return -1;
        }

        return nextIndex;
    }

    getRelatedPlanningsForEvent(props = this.props) {
        const {relatedPlanningsInList, eventProps} = props;

        return get(relatedPlanningsInList, eventProps.item._id, []);
    }

    handleKeyDown(event) {
        if (!get(event, 'target') || !event.target.classList.contains('sd-column-box__main-column__items') ||
            this.state.activeIndex < 0) {
            // Key-down outside the item list or this nested item is not activated - return
            return;
        }

        // We handle only these three keys as of now
        if (![KEYCODES.UP, KEYCODES.DOWN, KEYCODES.ENTER].includes(get(event, 'keyCode'))) {
            return;
        }

        onEventCapture(event);
        // Preview item
        if (get(event, 'keyCode') === KEYCODES.ENTER) {
            this.activateItem(this.state.activeIndex, false, true);
            return;
        }

        const increment = get(event, 'keyCode') === KEYCODES.DOWN;
        const nextIndex = this.getNextActiveIndex(increment);

        if (nextIndex === -1) {
            // We don't have the planning items open and nothing to navigate locally
            // So, we hand over the navigation to the parent list component
            const navigated = this.props.navigateList(increment);

            if (navigated) {
                document.removeEventListener('keydown', this.handleKeyDown);
            }
        } else {
            // Activate appropriate local item
            this.activateItem(nextIndex);
        }
    }

    // Fuction to set an item active and preview if needede
    activateItem(index, setState = true, forceActivate = false) {
        if (index === -1) {
            return;
        }

        const item = index === 0 ? get(this.props, 'eventProps.item') :
            get(this.getRelatedPlanningsForEvent(), `[${index - 1}]`);

        if (item) {
            // If preview pane is open, this will change the preview item accordingly
            this.props.onItemActivate(item, forceActivate);
        }

        if (setState) {
            this.setState({activeIndex: index});
        }
    }

    deactivateSelf() {
        // Set self to inactive and remove event listeners
        if (this.state.activeIndex !== -1) {
            this.setState({activeIndex: -1});
        }

        document.removeEventListener('keydown', this.handleKeyDown);
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const planningItems = get(this.props, 'eventProps.item.planning_ids', []).length;
        const relatedPlanningText = gettext('({{ count }}) {{ action }} planning item(s)', {
            count: planningItems,
            action: this.state.openPlanningItems ? gettext('Hide') : gettext('Show'),
        });

        const getPlannings = (item) => (
            get(this.props.relatedPlanningsInList, item._id, []).map((plan, index) => {
                const planningProps = {
                    ...this.props.planningProps,
                    item: plan,
                };

                // Planning items are indexed from 1 - as event takes 0
                return (<PlanningItem key={index} {...planningProps} active={this.state.activeIndex === index + 1} />);
            })
        );

        const eventProps = {
            ...this.props.eventProps,
            toggleRelatedPlanning: this.toggleRelatedPlanning,
            relatedPlanningText: relatedPlanningText,
        };

        // Event is always indexed as 0
        const eventItem = <EventItem {...eventProps} active={this.state.activeIndex === 0} />;

        return (
            <NestedItem
                parentItem={eventItem}
                collapsed={!this.state.openPlanningItems}
                expanded={this.state.openPlanningItems}
                nestedChildren={getPlannings(eventProps.item)}
                noMarginTop={this.props.listViewType === LIST_VIEW_TYPE.LIST}
                refNode={this.props.refNode}
            />
        );
    }
}
