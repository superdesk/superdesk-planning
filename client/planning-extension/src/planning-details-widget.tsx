import * as React from 'react';
import {IArticleSideWidgetComponentType} from 'superdesk-api';
import {superdesk} from './superdesk';
import {extensionBridge} from './extension_bridge';
import {Button, Spinner} from 'superdesk-ui-framework/react';
const {editPlanningInNewTab} = extensionBridge.planning;
const {AuthoringWidgetLayout, AuthoringWidgetHeading} = superdesk.components;
const {gettext} = superdesk.localization;

export const PLANNING_DETAILS_WIDGET_ID = 'planning_details';
export const PLANNING_DETAILS_WIDGET_LABEL = gettext('Planning Details');

interface IState {
    loading: boolean;
    planningId: string | null;
    planningEtag: string | null;
}

export class PlanningDetailsWidget extends React.PureComponent<IArticleSideWidgetComponentType, IState> {
    constructor(props: IArticleSideWidgetComponentType) {
        super(props);

        this.state = {
            loading: props.article.assignment_id != null,
            planningId: null,
            planningEtag: null,
        };
    }

    componentDidMount() {
        const {assignment_id} = this.props.article;

        if (assignment_id != null) {
            this.fetchPlanningInfo(assignment_id);
            this.subscribeToUpdates();
        }
    }

    componentDidUpdate = (_prevProps: IArticleSideWidgetComponentType, prevState: IState): void => {
        const {assignment_id} = this.props.article;
        const {planningId} = this.state;

        if (assignment_id == null) return;

        // refetch if there's a valid assignment but not planning data or different planning data
        if (!planningId || planningId !== prevState.planningId)
            this.fetchPlanningInfo(assignment_id);
    }


    componentWillUnmount() {
        this.unsubscribeFromUpdates();
    }

    private fetchPlanningInfo = (assignment_id: string) => {
        extensionBridge.planning.getItemPlanningInfo({assignment_id})
            .then((planning) => {
                this.setState({
                    planningId: planning._id,
                    planningEtag: planning._etag,
                    loading: false,
                });
            })
            .catch(() => {
                this.setState({loading: false});
            });
    };

    private subscribeToUpdates = () => {
        window.addEventListener('planning:updated', this.onPlanningUpdated as EventListener);
    };

    private unsubscribeFromUpdates = () => {
        window.removeEventListener('planning:updated', this.onPlanningUpdated as EventListener);
    };

    private onPlanningUpdated = (event: Event) => {
        const customEvent = event as CustomEvent;
        const updatedPlanningItem = customEvent?.detail?.item;

        if (!updatedPlanningItem) return;

        const {assignment_id} = this.props.article;
        const {planningId, planningEtag} = this.state;

        if (!assignment_id || !planningId) return;

        // Only respond to changes of the currently loaded planning item
        if (updatedPlanningItem._id === planningId && updatedPlanningItem._etag !== planningEtag) {
            this.fetchPlanningInfo(assignment_id); // Re-fetch planning info
        }
    };

    private dispatchAddToPlanning = () => {
        window.dispatchEvent(new CustomEvent('planning:addToPlanning', {
            detail: this.props.article,
        }));
    };

    private dispatchFulfilAssignment = () => {
        window.dispatchEvent(new CustomEvent('planning:fulfilassignment', {
            detail: {item: this.props.article},
        }));
    };

    private dispatchUnlinkCoverage = () => {
        superdesk.entities.article.get(this.props.article._id).then((_item) => {
            window.dispatchEvent(new CustomEvent('planning:unlinkfromcoverage', {
                detail: {item: _item},
            }));
        });
    };

    private openPlanningEditor = () => {
        const {planningId} = this.state;

        if (planningId != null) {
            editPlanningInNewTab(planningId);
        }
    };

    render() {
        const {assignment_id} = this.props.article;
        const {loading} = this.state;

        if (loading) {
            return <Spinner size="large" />;
        }

        const PlanningDetailsBody = extensionBridge.ui.components.PlanningDetailsWidget;

        return (
            <AuthoringWidgetLayout
                header={(
                    <AuthoringWidgetHeading
                        widgetId={PLANNING_DETAILS_WIDGET_ID}
                        widgetName={PLANNING_DETAILS_WIDGET_LABEL}
                        editMode={false}
                    />
                )}
                body={(
                    <div>
                        {assignment_id != null ? (
                            <>
                                <PlanningDetailsBody item={{assignment_id}} />
                                <div className="sd-margin--2">
                                    <Button
                                        text={gettext('Edit Planning')}
                                        icon="edit"
                                        onClick={this.openPlanningEditor}
                                        expand
                                    />
                                    <div className="sd-margin-t--1" />
                                    <Button
                                        text={gettext('Unlink as Coverage')}
                                        icon="cut"
                                        onClick={this.dispatchUnlinkCoverage}
                                        expand
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="sd-margin--2">
                                <Button
                                    text={gettext('Add to Planning')}
                                    icon="calendar-list"
                                    onClick={this.dispatchAddToPlanning}
                                    expand
                                />
                                <div className="sd-margin-t--1" />
                                <Button
                                    text={gettext('Fulfil Assignment')}
                                    icon="bolt"
                                    onClick={this.dispatchFulfilAssignment}
                                    expand
                                />
                            </div>
                        )}
                    </div>
                )}
            />
        );
    }
}
