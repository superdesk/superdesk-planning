import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {EventItem} from '.';
import {PlanningItem} from '../Planning';
import {NestedItem} from '../UI/List';
import {gettext} from '../../utils';


export class EventItemWithPlanning extends React.Component {
    constructor(props) {
        super(props);
        this.state = {openPlanningItems: false};
        this.toggleRelatedPlanning = this.toggleRelatedPlanning.bind(this);
    }

    toggleRelatedPlanning(evt) {
        evt.stopPropagation();
        if (!this.state.openPlanningItems) {
            this.props.showRelatedPlannings(get(this.props, 'eventProps.item', {}));
        }
        this.setState({openPlanningItems: !this.state.openPlanningItems});
    }

    render() {
        const planningItems = get(this.props, 'eventProps.item.planning_ids', []).length;
        const itemsText = planningItems > 1 ? gettext('items') : gettext('item');
        const showHideText = this.state.openPlanningItems ? gettext('Hide') : gettext('Show');
        const relatedPlanningText = `(${planningItems}) ${showHideText} ${gettext('planning')} ${itemsText}`;

        const getPlannings = (item) => (
            get(this.props.relatedPlanningsInList, item._id, []).map((plan, index) => {
                const planningProps = {
                    ...this.props.planningProps,
                    item: plan
                };

                return (<PlanningItem key={index} {...planningProps} />);
            })
        );

        const eventProps = {
            ...this.props.eventProps,
            toggleRelatedPlanning: this.toggleRelatedPlanning,
            relatedPlanningText: relatedPlanningText
        };

        const eventItem = <EventItem {...eventProps} />;

        return (
            <NestedItem
                parentItem={eventItem}
                collapsed={!this.state.openPlanningItems}
                expanded={this.state.openPlanningItems}
                nestedChildren={getPlannings(eventProps.item)}
            />
        );
    }
}

EventItemWithPlanning.propTypes = {
    eventProps: PropTypes.object.isRequired,
    planningProps: PropTypes.object.isRequired,
    showRelatedPlannings: PropTypes.func.isRequired,
    relatedPlanningsInList: PropTypes.object.isRequired,
};
