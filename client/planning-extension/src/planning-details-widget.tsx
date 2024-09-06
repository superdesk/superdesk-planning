import * as React from 'react';
import {IArticleSideWidgetComponentType} from 'superdesk-api';
import {superdesk} from './superdesk';
import {extensionBridge} from './extension_bridge';

const {AuthoringWidgetLayout, AuthoringWidgetHeading} = superdesk.components;
const {gettext} = superdesk.localization;

export const PLANNING_DETAILS_WIDGET_ID = 'planning_details';
export const PLANNING_DETAILS_WIDGET_LABEL = gettext('Planning Details');

export class PlanningDetailsWidget extends React.PureComponent<IArticleSideWidgetComponentType> {
    render() {
        const PlanningDetailsBody = extensionBridge.ui.components.PlanningDetailsWidget;

        if (this.props.article.assignment_id == null) {
            return null;
        }

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
                    <PlanningDetailsBody item={{assignment_id: this.props.article.assignment_id}} noPadding />
                )}
            />
        );
    }
}
