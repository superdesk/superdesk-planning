import * as React from 'react';
import {IArticleSideWidgetComponentType} from 'superdesk-api';
import {superdesk} from './superdesk';
import {extensionBridge} from './extension_bridge';
import {editPlanningInNewTab} from '../../utils/assignments';
import {Button, Spinner} from 'superdesk-ui-framework/react';

const {AuthoringWidgetLayout, AuthoringWidgetHeading} = superdesk.components;
const {gettext} = superdesk.localization;

export const PLANNING_DETAILS_WIDGET_ID = 'planning_details';
export const PLANNING_DETAILS_WIDGET_LABEL = gettext('Planning Details');

interface IState {
    loading: boolean;
    planningId: string | null;
}

export class PlanningDetailsWidget extends React.PureComponent<IArticleSideWidgetComponentType, IState> {
    constructor(props: IArticleSideWidgetComponentType) {
        super(props);

        this.state = {
            loading: !!props.article.assignment_id,
            planningId: null,
        };
    }

    componentDidMount() {
        const {assignment_id} = this.props.article;

        if (assignment_id) {
            extensionBridge.planning.getItemPlanningInfo({assignment_id})
                .then((planning) => {
                    this.setState({
                        planningId: planning._id,
                        loading: false,
                    });
                })
                .catch(() => {
                    this.setState({loading: false});
                });
        }
    }

    dispatchAddToPlanning = () => {
        window.dispatchEvent(new CustomEvent('planning:addToPlanning', {
            detail: this.props.article
        }));
    };

    dispatchFulfilAssignment = () => {
        window.dispatchEvent(new CustomEvent('planning:fulfilassignment', {
            detail: {item: this.props.article}
        }));
    };

    dispatchUnlinkCoverage = () => {
        superdesk.entities.article.get(this.props.article._id).then((_item) => {
            window.dispatchEvent(new CustomEvent('planning:unlinkfromcoverage', {
                detail: {item: _item}
            }));
        });
    };

    openPlanningEditor = () => {
        const {planningId} = this.state;

        if (planningId) {
            editPlanningInNewTab(planningId);
        }
    };

    renderActionsNotLinked() {
        return (
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
        );
    }

    renderActionsLinked() {
        return (
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
        );
    }

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
                        {assignment_id ? (
                            <>
                                <PlanningDetailsBody item={{assignment_id}} />
                                {this.renderActionsLinked()}
                            </>
                        ) : (
                            this.renderActionsNotLinked()
                        )}
                    </div>
                )}
            />
        );
    }
}
