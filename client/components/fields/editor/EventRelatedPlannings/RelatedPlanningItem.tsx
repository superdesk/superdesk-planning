import * as React from 'react';
import {set} from 'lodash';

import {
    EDITOR_TYPE,
    IEventItem,
    IG2ContentType,
    IPlanningContentProfile,
    IPlanningCoverageItem,
    IPlanningItem,
    ISearchProfile
} from '../../../../interfaces';
import {superdeskApi} from '../../../../superdeskApi';

import {planningUtils} from '../../../../utils';

import {IconButton} from 'superdesk-ui-framework/react';
import {Row} from '../../../UI/Form';
import {RelatedCoverageItems} from './RelatedCoverageItems';
import {AddNewCoverages} from './AddNewCoverages';
import {RelatedPlanningListItem} from '../../../RelatedPlannings/PlanningMetaData/RelatedPlanningListItem';

interface IProps {
    event: IEventItem;
    item: DeepPartial<IPlanningItem>;
    index: number;
    disabled: boolean;
    editorType: EDITOR_TYPE;
    profile: IPlanningContentProfile;
    coverageProfile?: ISearchProfile;
    removePlan(item: DeepPartial<IPlanningItem>): void;
    updatePlanningItem(
        original: DeepPartial<IPlanningItem>,
        updates: DeepPartial<IPlanningItem>,
        scrollOnChange: boolean
    ): void;
    addCoverageToWorkflow(original: IPlanningItem, coverage: IPlanningCoverageItem, index: number): void;
    isAgendaEnabled: boolean;
    initiallyExpanded?: boolean;
}

export class RelatedPlanningItem extends React.PureComponent<IProps> {
    containerNode: React.RefObject<HTMLDivElement>;

    constructor(props) {
        super(props);

        this.containerNode = React.createRef();

        this.remove = this.remove.bind(this);
        this.update = this.update.bind(this);
        this.updateCoverage = this.updateCoverage.bind(this);
        this.removeCoverage = this.removeCoverage.bind(this);
        this.duplicateCoverage = this.duplicateCoverage.bind(this);
        this.onAddCoverageToWorkflow = this.onAddCoverageToWorkflow.bind(this);
    }

    scrollIntoView() {
        this.containerNode.current?.scrollIntoView({behavior: 'smooth'});
    }

    remove() {
        this.props.removePlan(this.props.item);
    }

    update(updates: DeepPartial<IPlanningItem>, scrollOnChange: boolean = true) {
        this.props.updatePlanningItem(this.props.item, updates, scrollOnChange);
    }

    updateCoverage(field: string, value: any) {
        const updates = {coverages: [...this.props.item.coverages]};

        set(updates, field, value);
        this.update(updates, false);
    }

    removeCoverage(coverage: DeepPartial<IPlanningCoverageItem>) {
        const coverages = this.props.item.coverages.filter(
            (cov) => cov.coverage_id !== coverage.coverage_id
        );

        this.update({coverages}, false);
    }

    duplicateCoverage(coverage: DeepPartial<IPlanningCoverageItem>, duplicateAs?: IG2ContentType['qcode']) {
        const coverages = planningUtils.duplicateCoverage(
            this.props.item,
            coverage,
            duplicateAs,
            this.props.event
        );

        this.update({coverages}, false);
    }

    onAddCoverageToWorkflow(coverage: IPlanningCoverageItem, index: number) {
        this.props.addCoverageToWorkflow(this.props.item, coverage, index);
    }

    focus() {
        if (this.containerNode.current != null) {
            this.containerNode.current.focus();
        }
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {item, isAgendaEnabled} = this.props;
        const hideRemoveIcon = this.props.disabled;

        return (
            <div
                className="planning-item"
                data-test-id={`editor--planning-item__${this.props.index}`}
                id={`planning-item--${item._id}`}
                ref={this.containerNode}
                tabIndex={0}
            >
                <Row noPadding={true}>
                    <RelatedPlanningListItem
                        item={item}
                        isAgendaEnabled={isAgendaEnabled}
                        showIcon={true}
                        shadow={1}
                        editPlanningComponent={hideRemoveIcon ? null : (
                            <IconButton
                                icon="trash"
                                ariaValue="Remove Planning"
                                onClick={this.remove}
                            />
                        )}
                    />
                </Row>
                <Row noPadding={true}>
                    <span className="form-label">{gettext('Coverages')}</span>
                </Row>
                {!this.props.item.coverages?.length ? null : (
                    <RelatedCoverageItems
                        item={this.props.item}
                        coverages={this.props.item.coverages}
                        disabled={this.props.disabled}
                        editorType={this.props.editorType}
                        updateCoverage={this.updateCoverage}
                        removeCoverage={this.removeCoverage}
                        duplicateCoverage={this.duplicateCoverage}
                        onAddCoverageToWorkflow={this.onAddCoverageToWorkflow}
                    />
                )}
                {this.props.disabled ? null : (
                    <Row noPadding={true}>
                        <AddNewCoverages
                            event={this.props.event}
                            item={item}
                            updatePlanningItem={this.update}
                            profile={this.props.profile}
                            coverageProfile={this.props.coverageProfile}
                            initiallyExpanded={this.props.initiallyExpanded}
                        />
                    </Row>
                )}
            </div>
        );
    }
}
