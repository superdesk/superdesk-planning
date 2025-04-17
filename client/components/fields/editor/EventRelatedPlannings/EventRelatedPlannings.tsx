import * as React from 'react';

import {IPlanningItem} from '../../../../interfaces';
import {planningApi, superdeskApi} from '../../../../superdeskApi';

import {Button, EmptyState, Spacer} from 'superdesk-ui-framework/react';
import {RelatedPlanningItem} from './RelatedPlanningItem';
import {PlanningMetaData} from '../../../RelatedPlannings/PlanningMetaData';

import './style.scss';
import {TEMP_ID_PREFIX} from '../../../../constants';
import {addSomeRelatedPlanningsToEventEditor} from '../../../../utils/planning';
import {IRelatedPlanningProps} from './EventRelatedPlanningWrapper';
import {isTemporaryId} from '../../../../utils';

export class EditorFieldEventRelatedPlanningsComponent extends React.PureComponent<IRelatedPlanningProps> {
    relatedItemRefs: {[id: string]: RelatedPlanningItem};

    constructor(props: IRelatedPlanningProps) {
        super(props);

        this.relatedItemRefs = {};
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {DropZone} = superdeskApi.components;
        const isAgendaEnabled = planningApi.planning.getEditorProfile().editor.agendas.enabled;
        const disabled = this.props.disabled || this.props.schema?.read_only;
        const planningItems = this.props.item.associated_plannings ?? [];

        const canAddItems: {allowed: boolean; error: string | null} = (() => {
            if (this.props.disabled || this.props.schema?.read_only) {
                return {
                    allowed: false,
                    error: null,
                };
            } else if (isTemporaryId(this.props.item._id)) {
                return {
                    allowed: false,
                    error: gettext('Event has to be created before adding related plannings'),
                };
            } else {
                return {
                    allowed: true,
                    error: null,
                };
            }
        })();

        const planningItemsMetadata = planningItems.length > 0 ? (
            <>
                {planningItems.map((plan, index) => (
                    <PlanningMetaData
                        key={plan._id}
                        field={`plannings[${index}]`}
                        plan={plan}
                        scrollInView={true}
                        tabEnabled={true}
                    />
                ))}
            </>
        ) : (
            <EmptyState
                title={superdeskApi.localization.gettext('No planning items have been added')}
                illustration="2"
                size="small"
            />
        );

        return (
            <div className="related-plannings">
                <Spacer h gap="4" justifyContent="space-between" noWrap>
                    <label className="InputArray__label side-panel__heading side-panel__heading--big">
                        {gettext('Related Plannings')}
                    </label>

                    {canAddItems.allowed && (
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
                {disabled ? planningItemsMetadata : (
                    <>
                        {planningItems.map((plan, index) => {
                            const isNewlyCreatedItem = index === planningItems.length - 1
                                && plan._id.startsWith(TEMP_ID_PREFIX);

                            return (
                                <RelatedPlanningItem
                                    // Reload if _etag has changed so autosave and saving doesn't crash
                                    key={plan._etag}
                                    ref={(ref) => {
                                        this.relatedItemRefs[index] = ref;
                                    }}
                                    index={index}
                                    event={this.props.item}
                                    item={plan}
                                    unlinkPlanning={this.props.unlinkPlanning}
                                    updatePlanningItem={this.props.updatePlanningItem}
                                    disabled={false}
                                    editorType={this.props.editorType}
                                    profile={this.props.profile}
                                    coverageProfile={this.props.coverageProfile}
                                    isAgendaEnabled={isAgendaEnabled}
                                    initiallyExpanded={isNewlyCreatedItem && (plan.coverages ?? []).length < 1}
                                />
                            );
                        })}
                    </>
                )}
                <DropZone
                    canDrop={() => canAddItems.allowed}
                    onDrop={(event) => {
                        const data = event.dataTransfer.getData('application/superdesk.planning.planning_item');

                        if (data.length < 1) {
                            superdeskApi.ui.notify.error(gettext('Dropped item is not a planning item'));
                        } else {
                            const planningItem: IPlanningItem = JSON.parse(data);

                            addSomeRelatedPlanningsToEventEditor([planningItem], this.props.lockedItems);
                        }
                    }}
                    multiple={true}
                    disabled={!canAddItems.allowed}
                >
                    {canAddItems.allowed ? gettext('Drop planning items here') : canAddItems.error}
                </DropZone>
            </div>
        );
    }
}
