import * as React from 'react';

import {
    IEditorFieldProps,
    IEventItem,
    IPlanningCoverageItem,
    IPlanningItem,
    IProfileSchemaTypeList,
    ISearchProfile
} from '../../../../interfaces';
import {planningApi, superdeskApi} from '../../../../superdeskApi';

import {Button, Spacer} from 'superdesk-ui-framework/react';
import {RelatedPlanningItem} from './RelatedPlanningItem';
import {PlanningMetaData} from '../../../RelatedPlannings/PlanningMetaData';

import './style.scss';

interface IProps extends IEditorFieldProps {
    item: IEventItem;
    schema?: IProfileSchemaTypeList;
    coverageProfile?: ISearchProfile;

    getRef(value: DeepPartial<IPlanningItem>): React.RefObject<PlanningMetaData | RelatedPlanningItem>;
    addPlanningItem(item?: IPlanningItem): void;
    removePlanningItem(item: DeepPartial<IPlanningItem>): void;
    updatePlanningItem(original: DeepPartial<IPlanningItem>, updates: DeepPartial<IPlanningItem>): void;
    addCoverageToWorkflow(original: IPlanningItem, coverage: IPlanningCoverageItem, index: number): void;
}

export class EditorFieldEventRelatedPlannings extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const {DropZone} = superdeskApi.components;
        const isAgendaEnabled = planningApi.planning.getEditorProfile().editor.agendas.enabled;
        const disabled = this.props.disabled || this.props.schema?.read_only;

        return (
            <div className="related-plannings">
                <Spacer h gap="4" justifyContent="space-between" noWrap>
                    <label className="InputArray__label side-panel__heading side-panel__heading--big">
                        {gettext('Related Plannings')}
                    </label>

                    {disabled ? null : (
                        <Button
                            type="primary"
                            icon="plus-large"
                            text="plus-large"
                            shape="round"
                            size="small"
                            iconOnly={true}
                            onClick={this.props.addPlanningItem}
                        />
                    )}
                </Spacer>

                {disabled ? (
                    this.props.item.associated_plannings.map((plan, index) => (
                        <PlanningMetaData
                            ref={this.props.getRef(plan) as React.RefObject<PlanningMetaData>}
                            key={plan._id}
                            field={`plannings[${index}]`}
                            plan={plan}
                            scrollInView={true}
                            tabEnabled={true}
                        />
                    ))
                ) : (
                    <>
                        {
                            this.props.item.associated_plannings?.map((plan, index) => (
                                <RelatedPlanningItem
                                    ref={this.props.getRef(plan) as React.RefObject<RelatedPlanningItem>}
                                    key={plan._id}
                                    index={index}
                                    event={this.props.item}
                                    item={plan}
                                    removePlan={this.props.removePlanningItem}
                                    updatePlanningItem={this.props.updatePlanningItem}
                                    addCoverageToWorkflow={this.props.addCoverageToWorkflow}
                                    disabled={false}
                                    editorType={this.props.editorType}
                                    profile={this.props.profile}
                                    coverageProfile={this.props.coverageProfile}
                                    isAgendaEnabled={isAgendaEnabled}
                                />
                            ))
                        }

                        <DropZone
                            canDrop={
                                (event) => event.dataTransfer.getData(
                                    'application/superdesk.planning.planning_item',
                                ) != null
                            }
                            onDrop={(event) => {
                                event.preventDefault();
                                const planningItem: IPlanningItem = JSON.parse(
                                    event.dataTransfer.getData('application/superdesk.planning.planning_item'),
                                );

                                const alreadyExists = (this.props.item.associated_plannings ?? [])
                                    .find((item) => item._id === planningItem._id) != null;

                                if (alreadyExists) {
                                    superdeskApi.ui.notify.error(gettext('This item is already added'));
                                } else {
                                    this.props.addPlanningItem(planningItem);
                                }
                            }}
                            multiple={true}
                        >
                            {gettext('Drop planning items here')}
                        </DropZone>
                    </>
                )}
            </div>
        );
    }
}
