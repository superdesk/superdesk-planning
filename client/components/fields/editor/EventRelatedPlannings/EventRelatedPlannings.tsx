import * as React from 'react';

import {IEditorFieldProps, IEventItem, IPlanningItem} from '../../../../interfaces';
import {superdeskApi} from '../../../../superdeskApi';

import {ButtonGroup, Button} from 'superdesk-ui-framework/react';
import {Row} from '../../../UI/Form';
import {RelatedPlanningItem} from './RelatedPlanningItem';

import './style.scss';

interface IProps extends IEditorFieldProps {
    item: IEventItem;

    getRef(value: DeepPartial<IPlanningItem>): React.RefObject<RelatedPlanningItem>;
    addPlanningItem(): void;
    removePlanningItem(item: DeepPartial<IPlanningItem>): void;
    updatePlanningItem(original: DeepPartial<IPlanningItem>, updates: DeepPartial<IPlanningItem>): void;
}

export class EditorFieldEventRelatedPlannings extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <div className="related-plannings">
                <Row flex={true} noPadding={true}>
                    <label className="InputArray__label side-panel__heading side-panel__heading--big">
                        {gettext('Related Plannings')}
                    </label>
                    {this.props.disabled ? null : (
                        <ButtonGroup align="right">
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
                    this.props.item.associated_plannings?.map((plan, index) => (
                        <RelatedPlanningItem
                            ref={this.props.getRef(plan)}
                            key={plan._id}
                            index={index}
                            event={this.props.item}
                            item={plan}
                            removePlan={this.props.removePlanningItem}
                            updatePlanningItem={this.props.updatePlanningItem}
                            disabled={this.props.disabled}
                        />
                    ))
                )}
            </div>
        );
    }
}
