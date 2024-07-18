import React from 'react';
import {NestedItem} from '../../components/UI/List';
import {PlanningItem} from '../Planning/PlanningItem';
import {IEventItem, IEventListItemProps, IPlanningListItemProps} from 'interfaces';
import {planningApi, superdeskApi} from '../../superdeskApi';
import {EventItem} from '../../components/Events';
import {Loader} from 'superdesk-ui-framework/react';

interface IProps {
    planningProps: IPlanningListItemProps;
    relatedEventIds: Array<IEventItem['_id']>;
    getEventProps(event: IEventItem): IEventListItemProps;
}

interface IState {
    expanded: boolean;
    events: {status: 'not-initialized'} | {status: 'loading'} | {status: 'ready'; items: Array<IEventItem>};
}

export class PlanningItemWithEvents extends React.Component<IProps, IState> {
    private _mounted: boolean;

    constructor(props: IProps) {
        super(props);

        this._mounted = false;

        this.state = {
            expanded: false,
            events: {status: 'not-initialized'},
        };

        this.loadEvents = this.loadEvents.bind(this);
        this.setVisibility = this.setVisibility.bind(this);
    }

    componentDidMount(): void {
        this._mounted = true;
    }

    componentWillUnmount(): void {
        this._mounted = false;
    }

    private loadEvents(): void {
        planningApi.events.getByIds(this.props.relatedEventIds, 'draft').then((response) => {
            if (this._mounted) { // would be good to use an AbortSignal.
                this.setState({events: {status: 'ready', items: response}});
            }
        });
    }

    private setVisibility(expanded: boolean) {
        const nextState: IState = {
            ...this.state,
            expanded: expanded,
        };

        if (nextState.expanded === true && this.state.events.status === 'not-initialized') {
            nextState.events = {status: 'loading'};

            this.loadEvents();
        }

        this.setState(nextState);
    }

    render() {
        const {planningProps} = this.props;
        const {assertNever} = superdeskApi.helpers;

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
                    switch (this.state.events.status) {
                    case 'not-initialized':
                        return null;
                    case 'loading':
                        return (
                            <Loader />
                        );
                    case 'ready':
                        return this.state.events.items.map((event) => (
                            <EventItem
                                {...this.props.getEventProps(event)}
                                multiSelectDisabled
                                key={event._id}
                            />
                        ));
                    default:
                        assertNever(this.state.events);
                    }
                })()}
                expanded={this.state.expanded}
            />
        );
    }
}
