import * as React from 'react';
import {IEditorFieldProps, IPlanningCoverageItem} from '../../../interfaces';
import {EditorFieldToggle} from './base/toggle';

import {superdeskApi} from '../../../superdeskApi';
import {Tooltip} from '@sourcefabric/common';
import {isItemExpired, planningUtils} from '../../../utils';
import {IPlanningItem} from 'globals';
import {WORKFLOW_STATE} from '../../../constants';

type IProps = IEditorFieldProps<IPlanningCoverageItem> & {planningItem: IPlanningItem};

export class EditorFieldAddCoverageToWorkflow extends React.PureComponent<IProps> {
    getTooltipMessage(): string {
        const {gettext} = superdeskApi.localization;
        const coverage = this.props.item;
        const planning = this.props.planningItem;

        if (coverage.workflow_status === WORKFLOW_STATE.CANCELLED) {
            return gettext('Coverage was cancelled');
        }

        if (!planningUtils.isCoverageDraft(coverage)) {
            return gettext('Coverage must be in draft status');
        }

        if (!planningUtils.isCoverageAssigned(coverage)) {
            return gettext('Coverage must be assigned to a desk');
        }

        if (isItemExpired(planning)) {
            return gettext('Cannot change workflow status if the coverage is part of an expired planning item');
        }

        return gettext('You cannot change workflow status');
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const tooltipMessage = this.getTooltipMessage();

        return (
            <Tooltip
                disabled={this.props.disabled === false}
                content={tooltipMessage}
            >
                <EditorFieldToggle
                    {...this.props}
                    field="add_coverage_to_workflow"
                    label={this.props.item.add_coverage_to_workflow
                        ? gettext('Cancel coverage')
                        : gettext('Add to workflow')
                    }
                    defaultValue={false}
                />
            </Tooltip>
        );
    }
}
