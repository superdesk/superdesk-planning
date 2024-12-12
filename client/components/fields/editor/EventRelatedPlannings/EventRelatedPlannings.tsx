import * as React from 'react';
import {connect} from 'react-redux';

import {
    IEditorFieldProps,
    IEventItem,
    ILockedItems,
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
import {TEMP_ID_PREFIX} from '../../../../constants';
import {addSomeRelatedPlanningsToEventEditor} from '../../../../utils/planning';
import * as selectors from '../../../../selectors';

interface IOwnProps extends IEditorFieldProps {
    item: IEventItem;
    schema?: IProfileSchemaTypeList;
    coverageProfile?: ISearchProfile;

    getRef(value: DeepPartial<IPlanningItem>): React.RefObject<PlanningMetaData | RelatedPlanningItem>;
    addPlanningItem(item?: IPlanningItem): Promise<Partial<IPlanningItem>>;
    removePlanningItem(item: DeepPartial<IPlanningItem>): void;
    updatePlanningItem(original: DeepPartial<IPlanningItem>, updates: DeepPartial<IPlanningItem>): void;
}

interface IReduxProps {
    lockedItems: ILockedItems;
}

type IProps = IOwnProps & IReduxProps;

export class EditorFieldEventRelatedPlanningsComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const {DropZone} = superdeskApi.components;
        const isAgendaEnabled = planningApi.planning.getEditorProfile().editor.agendas.enabled;
        const disabled = this.props.disabled || this.props.schema?.read_only;
        const planningItems = this.props.item.associated_plannings ?? [];

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
                            onClick={() => {
                                this.props.addPlanningItem();
                            }}
                        />
                    )}
                </Spacer>

                {disabled ? (
                    planningItems.map((plan, index) => (
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
                            planningItems.map((plan, index) => {
                                const isNewlyCreatedItem =
                                    index === planningItems.length - 1
                                    && plan._id.startsWith(TEMP_ID_PREFIX);

                                return (
                                    <RelatedPlanningItem
                                        ref={this.props.getRef(plan) as React.RefObject<RelatedPlanningItem>}
                                        key={plan._id}
                                        index={index}
                                        event={this.props.item}
                                        item={plan}
                                        removePlan={this.props.removePlanningItem}
                                        updatePlanningItem={this.props.updatePlanningItem}
                                        disabled={false}
                                        editorType={this.props.editorType}
                                        profile={this.props.profile}
                                        coverageProfile={this.props.coverageProfile}
                                        isAgendaEnabled={isAgendaEnabled}
                                        initiallyExpanded={isNewlyCreatedItem && (plan.coverages ?? []).length < 1}
                                    />
                                );
                            })
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

                                addSomeRelatedPlanningsToEventEditor([planningItem], this.props.lockedItems);
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

const mapStateToProps = (state): IReduxProps => ({
    lockedItems: selectors.locks.getLockedItems(state),
});


export const EditorFieldEventRelatedPlannings = connect(
    mapStateToProps,
)(EditorFieldEventRelatedPlanningsComponent);
