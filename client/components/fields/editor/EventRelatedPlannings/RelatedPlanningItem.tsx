import * as React from 'react';
import {set} from 'lodash';

import {IEventItem, IG2ContentType, IPlanningCoverageItem, IPlanningItem} from '../../../../interfaces';
import {superdeskApi} from '../../../../superdeskApi';

import {TEMP_ID_PREFIX} from '../../../../constants';
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
    removePlan(item: DeepPartial<IPlanningItem>): void;
    updatePlanningItem(
        original: DeepPartial<IPlanningItem>,
        updates: DeepPartial<IPlanningItem>,
        scrollOnChange: boolean
    ): void;
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

    focus() {
        if (this.containerNode.current != null) {
            this.containerNode.current.focus();
        }
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {item} = this.props;
        const hideRemoveIcon = !this.props.item._id.startsWith(TEMP_ID_PREFIX) || this.props.disabled;

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
                        updateCoverage={this.updateCoverage}
                        removeCoverage={this.removeCoverage}
                        duplicateCoverage={this.duplicateCoverage}
                    />
                )}
                {this.props.disabled ? null : (
                    <Row noPadding={true}>
                        <AddNewCoverages
                            event={this.props.event}
                            item={item}
                            updatePlanningItem={this.update}
                        />
                    </Row>
                )}
            </div>
        );
    }
}
