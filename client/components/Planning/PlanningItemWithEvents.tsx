import React from 'react';
import {NestedItem} from '../../components/UI/List';
import {PlanningItem} from '../Planning/PlanningItem';
import {IEventItem, IEventListItemProps, IPlanningListItemProps} from 'interfaces';
import {superdeskApi} from '../../superdeskApi';
import {EventItem} from '../../components/Events';
import {eventUtils} from '../../utils';

interface IProps {
    planningProps: IPlanningListItemProps;
    relatedEventIds: Array<IEventItem['_id']>;
    getEventProps(event: IEventItem): IEventListItemProps;
}

interface IState {
    expanded: boolean;
}

export class PlanningItemWithEvents extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            expanded: false,
        };

        this.setVisibility = this.setVisibility.bind(this);
    }

    private setVisibility(expanded: boolean) {
        const nextState: IState = {
            ...this.state,
            expanded: expanded,
        };

        this.setState(nextState);
    }

    render() {
        const {planningProps} = this.props;
        const {WithLiveResources} = superdeskApi.components;

        return (
            <NestedItem
                parentItem={(
                    <PlanningItem
                        {...planningProps}
                        relatedEventsUI={{
                            visible: this.state.expanded,
                            setVisibility: this.setVisibility,
                        }}
                    />
                )}
                nestedChildren={(() => {
                    if (this.state.expanded !== true) {
                        return null;
                    }

                    return (
                        <WithLiveResources resources={[{resource: 'events', ids: this.props.relatedEventIds}]}>
                            {([res]) => (
                                <div>
                                    {
                                        res._items.map((item) => {
                                            const event = eventUtils.modifyForClient(item);

                                            return (
                                                <EventItem
                                                    {...this.props.getEventProps(event)}
                                                    multiSelectDisabled
                                                    key={event._id}
                                                    planningItem={planningProps}
                                                />
                                            );
                                        })
                                    }
                                </div>
                            )}
                        </WithLiveResources>
                    );
                })()}
                expanded={this.state.expanded}
            />
        );
    }
}
