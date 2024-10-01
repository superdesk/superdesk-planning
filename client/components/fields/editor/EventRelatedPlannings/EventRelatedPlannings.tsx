import * as React from 'react';
import {connect} from 'react-redux';

import {
    IEditorFieldProps,
    IEventItem,
    IPlanningCoverageItem,
    IPlanningItem,
    IProfileSchemaTypeList,
    ISearchProfile
} from '../../../../interfaces';
import {planningApi, superdeskApi} from '../../../../superdeskApi';

import {ButtonGroup, Button} from 'superdesk-ui-framework/react';
import {Row} from '../../../UI/Form';
import {RelatedPlanningItem} from './RelatedPlanningItem';
import {PlanningMetaData} from '../../../RelatedPlannings/PlanningMetaData';

import './style.scss';
import {DropZone3} from 'core/ui/components/drop-zone-3';

interface IProps extends IEditorFieldProps {
    item: IEventItem;
    schema?: IProfileSchemaTypeList;
    coverageProfile?: ISearchProfile;

    getRef(value: DeepPartial<IPlanningItem>): React.RefObject<PlanningMetaData | RelatedPlanningItem>;
    addPlanningItem(): void;
    dropPlanningItem(planningItem: IPlanningItem): void;
    removePlanningItem(item: DeepPartial<IPlanningItem>): void;
    updatePlanningItem(original: DeepPartial<IPlanningItem>, updates: DeepPartial<IPlanningItem>): void;
    addCoverageToWorkflow(original: IPlanningItem, coverage: IPlanningCoverageItem, index: number): void;
    dispatch: (action) => Promise<IPlanningItem>;
}

export class EditorFieldEventRelatedPlanningsComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const isAgendaEnabled = planningApi.planning.getEditorProfile().editor.agendas.enabled;
        const disabled = this.props.disabled || this.props.schema?.read_only;

        const canDrop = (planningItem: IPlanningItem) => {
            if (planningItem.type !== 'planning' || this.props.item.associated_plannings.includes(planningItem)) {
                return false;
            }
            return true;
        };

        return (
            <div className="related-plannings">
                <Row flex={true} noPadding={true}>
                    <label className="InputArray__label side-panel__heading side-panel__heading--big">
                        {gettext('Related Plannings')}
                    </label>
                    {disabled ? null : (
                        <ButtonGroup align="end">
                            <Button
                                type="primary"
                                icon="plus-large"
                                text="plus-large"
                                shape="round"
                                size="small"
                                iconOnly={true}
                                onClick={this.props.addPlanningItem}
                            />
                        </ButtonGroup>
                    )}
                </Row>
                {!this.props.item.associated_plannings?.length ? (
                    <Row>
                        <div className="info-box--dashed">
                            <label>{gettext('No related Planning yet')}</label>
                        </div>
                    </Row>
                ) : (
                    <React.Fragment>
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
                        )}
                    </React.Fragment>
                )}

                <DropZone3
                    className="basic-drag-block"
                    canDrop={(event) => canDrop(
                        JSON.parse(event.dataTransfer.getData('application/superdesk.planningItem')),
                    )}
                    onDrop={(event) => {
                        event.preventDefault();
                        const planningItem = JSON.parse(
                            event.dataTransfer.getData('application/superdesk.planningItem'),
                        );

                        const planningItemsArray = planningItem.related_events ?? [];

                        this.props.dropPlanningItem({
                            ...planningItem,
                            related_events: [...planningItemsArray, {_id: this.props.item._id}],
                        });
                    }}
                    multiple={true}
                />
            </div>
        );
    }
}

const mapDispatchToProps = (dispatch) => ({
    dispatch,
});

export const EditorFieldEventRelatedPlannings = connect(
    null,
    mapDispatchToProps
)(EditorFieldEventRelatedPlanningsComponent);

