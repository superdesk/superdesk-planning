import React from 'react';

import {IPlanningCoverageItem, IPlanningItem} from '../../../interfaces';
import {ICON_COLORS} from '../../../constants';
import {onEventCapture, editorMenuUtils} from '../../../utils';

import {ItemIcon} from '../../index';
import {Item, Column, Row} from '../../UI/List';
import {CollapseBox} from '../../UI';
import {PlanningPreviewContent} from '../../Planning';
import {RelatedPlanningListItem} from './RelatedPlanningListItem';

interface IProps {
    plan: DeepPartial<IPlanningItem>;
    field?: string;
    scrollInView?: boolean; // defaults to true
    tabEnabled?: boolean;
    noOpen?: boolean;
    active?: boolean;
    showIcon?: boolean; // defaults to true
    showBorder?: boolean; // defaults to true
    noBg?: boolean;
    navigation?: any;
    onEditPlanning?(): void;
    onOpen?(): void;
    onClick?(): void;
    currentCoverageId?: IPlanningCoverageItem['coverage_id'];
}

export class PlanningMetaData extends React.PureComponent<IProps> {
    collapseBox: React.RefObject<CollapseBox>;

    constructor(props) {
        super(props);

        this.collapseBox = React.createRef();
    }

    scrollIntoView() {
        this.collapseBox.current?.scrollInView(true);
    }

    focus() {
        this.collapseBox.current?.scrollInView(true);
    }

    render() {
        const editPlanningComponent = this.props.onEditPlanning == null ? null : (
            <button
                data-sd-tooltip="Edit Planning Item"
                data-flow="left"
                onClick={(event) => {
                    onEventCapture(event);
                    this.props.onEditPlanning();
                }}
            >
                <i className="icon-pencil" />
            </button>
        );

        const planningListView = (
            <RelatedPlanningListItem
                item={this.props.plan}
                active={this.props.active}
                noBg={this.props.noBg}
                showBorder={this.props.showBorder ?? true}
                showIcon={this.props.showIcon ?? true}
                editPlanningComponent={editPlanningComponent}
            />
        );

        const planningInDetailTopBar = (
            <Item
                noBg={true}
                noHover={true}
            >
                <Column border={false}>
                    <ItemIcon
                        item={this.props.plan}
                        doubleSize={true}
                        color={ICON_COLORS.DARK_BLUE_GREY}
                    />
                </Column>
                <Column
                    border={false}
                    grow={true}
                >
                    <Row>
                        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                            <span className="sd-list-item__text-strong">
                                {this.props.plan.slugline}
                            </span>
                        </span>
                    </Row>
                </Column>
            </Item>
        );

        const planningInDetail = (
            <PlanningPreviewContent
                item={this.props.plan}
                inner={true}
                noPadding={true}
                currentCoverageId={this.props.currentCoverageId}
            />
        );

        const onClose = editorMenuUtils.onItemClose(this.props.navigation, this.props.field);
        const onOpen = editorMenuUtils.onItemOpen(this.props.navigation, this.props.field);
        const forceScroll = editorMenuUtils.forceScroll(this.props.navigation, this.props.field);
        const isOpen = editorMenuUtils.isOpen(this.props.navigation, this.props.field);

        return (
            <CollapseBox
                ref={this.collapseBox}
                collapsedItem={planningListView}
                openItemTopBar={planningInDetailTopBar}
                openItem={planningInDetail}
                scrollInView={this.props.scrollInView ?? true}
                tabEnabled={this.props.tabEnabled}
                tools={editPlanningComponent}
                noOpen={this.props.noOpen}
                isOpen={isOpen}
                onClose={onClose}
                onOpen={onOpen}
                onClick={this.props.onClick}
                forceScroll={forceScroll}
                scrollIntoViewOptions={{behavior: 'smooth'}}
            />
        );
    }
}
