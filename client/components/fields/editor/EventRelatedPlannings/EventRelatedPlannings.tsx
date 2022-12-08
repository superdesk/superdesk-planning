import * as React from 'react';

import {IEditorFieldProps, IEventItem, IPlanningItem, IProfileSchemaTypeList} from '../../../../interfaces';
import {superdeskApi} from '../../../../superdeskApi';

import {ButtonGroup, Button} from 'superdesk-ui-framework/react';
import {Row} from '../../../UI/Form';
import {RelatedPlanningItem} from './RelatedPlanningItem';
import {PlanningMetaData} from '../../../RelatedPlannings/PlanningMetaData';

import './style.scss';

interface IProps extends IEditorFieldProps {
    item: IEventItem;
    schema?: IProfileSchemaTypeList;

    getRef(value: DeepPartial<IPlanningItem>): React.RefObject<PlanningMetaData | RelatedPlanningItem>;
    addPlanningItem(): void;
    removePlanningItem(item: DeepPartial<IPlanningItem>): void;
    updatePlanningItem(original: DeepPartial<IPlanningItem>, updates: DeepPartial<IPlanningItem>): void;
}

export class EditorFieldEventRelatedPlannings extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const disabled = this.props.disabled || this.props.schema?.read_only;

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
                                    disabled={false}
                                    editorType={this.props.editorType}
                                />
                            ))
                        )}
                    </React.Fragment>
                )}
            </div>
        );
    }
}
