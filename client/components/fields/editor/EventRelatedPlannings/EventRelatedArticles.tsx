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

import {ButtonGroup, Button} from 'superdesk-ui-framework/react';
import {Row} from '../../../UI/Form';
import {RelatedPlanningItem} from './RelatedPlanningItem';
import {PlanningMetaData} from '../../../RelatedPlannings/PlanningMetaData';

import './style.scss';
import {showModal} from '@superdesk/common';
import EventsRelatedArticlesModal from 'components/EventsRelatedArticles/EventsRelatedArticlesModal';

interface IProps extends IEditorFieldProps {
    item: IEventItem;
    schema?: IProfileSchemaTypeList;
    coverageProfile?: ISearchProfile;

    getRef(value: DeepPartial<IPlanningItem>): React.RefObject<PlanningMetaData | RelatedPlanningItem>;
    addPlanningItem(): void;
    removePlanningItem(item: DeepPartial<IPlanningItem>): void;
    updatePlanningItem(original: DeepPartial<IPlanningItem>, updates: DeepPartial<IPlanningItem>): void;
    addCoverageToWorkflow(original: IPlanningItem, coverage: IPlanningCoverageItem, index: number): void;
}

export class EditorFieldEventRelatedItems extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const disabled = this.props.disabled || this.props.schema?.read_only;

        return (
            <div className="related-plannings">
                <Row flex={true} noPadding={true}>
                    <label className="InputArray__label side-panel__heading side-panel__heading--big">
                        {gettext('Related Articles')}
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
                {!this.props.item.related_items?.length ? (
                    <Row>
                        <div className="info-box--dashed">
                            <label>{gettext('No related articles yet')}</label>
                            <button
                                onClick={() => {
                                    showModal(({closeModal}) => (
                                        <EventsRelatedArticlesModal
                                            selectedArticles={this.props.item.related_items}
                                            closeModal={closeModal}
                                        />
                                    ));
                                }}
                            >
                                Show search
                            </button>
                        </div>
                    </Row>
                ) : (
                    <React.Fragment>
                        <div>
                            {JSON.stringify(this.props.item.related_items)}
                        </div>
                    </React.Fragment>
                )}
            </div>
        );
    }
}
