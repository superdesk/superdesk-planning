import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {ICON_COLORS} from '../../../constants';
import {StateLabel} from '../..';
import {ItemIcon} from '../../index';
import {Item, Column, Row, ActionMenu, Border} from '../../UI/List';
import {CollapseBox} from '../../UI/CollapseBox';
import {planningUtils, onEventCapture, editorMenuUtils} from '../../../utils';
import {PlanningPreviewContent} from '../../Planning/PlanningPreviewContent';
import {AgendaNameList} from '../../Agendas';
import {CoverageIcon} from '../../Coverages/';

export const PlanningMetaData = (
    {
        plan,
        scrollInView,
        tabEnabled,
        lockedItems,
        onEditPlanning,
        noOpen,
        onClick,
        navigation,
        active,
        showIcon,
        showBorder,
        users,
        desks,
        field,
        contentTypes,
    }
) => {
    const isItemLocked = lockedItems ? planningUtils.isPlanningLocked(plan, lockedItems) : false;
    const editPlanningComponent = onEditPlanning ?
        (
            <button
                data-sd-tooltip="Edit Planning Item"
                data-flow="left"
                onClick={(event) => {
                    onEventCapture(event);
                    onEditPlanning();
                }}
            >
                <i className="icon-pencil" />
            </button>
        ) : null;


    const planningListView = (
        <Item noBg={!active} activated={active}>
            {showBorder && isItemLocked && <Border state="locked" />}
            <div className="sd-list-item__border" />
            {showIcon && (
                <Column>
                    <ItemIcon
                        item={plan}
                        color={ICON_COLORS.DARK_BLUE_GREY}
                    />
                </Column>
            )}
            <Column grow={true} border={false}>
                <Row>
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                        <span className="sd-list-item__text-strong">{plan.slugline}</span>
                    </span>
                </Row>
                <Row>
                    <span className="no-padding">
                        <span className="sd-list-item__text-label">agenda:</span>
                        <span className="sd-overflow-ellipsis sd-list-item__text-strong sd-list-item--element-grow">
                            <AgendaNameList agendas={plan._agendas} />
                        </span>
                    </span>
                </Row>
            </Column>
            <Column>
                <Row>
                    <span className="sd-no-wrap">
                        {get(plan, 'coverages.length', 0) > 0 && plan.coverages.map((coverage, i) => (
                            <CoverageIcon
                                key={i}
                                coverage={coverage}
                                users={users}
                                desks={desks}
                                contentTypes={contentTypes}
                            />
                        )
                        )}
                    </span>
                </Row>
                <StateLabel item={plan} verbose={true} className="pull-right" />
            </Column>
            {editPlanningComponent && <ActionMenu>{editPlanningComponent}</ActionMenu>}
        </Item>
    );

    const planningInDetailTopBar = (
        <Item noBg={true} noHover={true}>
            <Column border={false}>
                <ItemIcon
                    item={plan}
                    doubleSize={true}
                    color={ICON_COLORS.DARK_BLUE_GREY}
                />
            </Column>
            <Column border={false} grow={true}>
                {(
                    <Row>
                        <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                            <span className="sd-list-item__text-strong">{plan.slugline}</span>
                        </span>
                    </Row>
                )}
            </Column>
        </Item>
    );

    const planningInDetail = (
        <PlanningPreviewContent item={plan} inner={true} noPadding={true} />
    );

    const onClose = editorMenuUtils.onItemClose(navigation, field);
    const onOpen = editorMenuUtils.onItemOpen(navigation, field);
    const forceScroll = editorMenuUtils.forceScroll(navigation, field);
    const isOpen = editorMenuUtils.isOpen(navigation, field);

    return (
        <CollapseBox
            collapsedItem={planningListView}
            openItemTopBar={planningInDetailTopBar}
            openItem={planningInDetail}
            scrollInView={scrollInView}
            tabEnabled={tabEnabled}
            tools={editPlanningComponent}
            noOpen={noOpen}
            isOpen={isOpen}
            onClose={onClose}
            onOpen={onOpen}
            onClick={onClick}
            forceScroll={forceScroll}
        />
    );
};

PlanningMetaData.propTypes = {
    plan: PropTypes.object,
    scrollInView: PropTypes.bool,
    tabEnabled: PropTypes.bool,
    onEditPlanning: PropTypes.func,
    onOpen: PropTypes.func,
    onClick: PropTypes.func,
    noOpen: PropTypes.bool,
    navigation: PropTypes.object,
    active: PropTypes.bool,
    lockedItems: PropTypes.object,
    showIcon: PropTypes.bool,
    showBorder: PropTypes.bool,
    users: PropTypes.array,
    desks: PropTypes.array,
    field: PropTypes.string,
    contentTypes: PropTypes.array,
};


PlanningMetaData.defaultProps = {
    scrollInView: true,
    showIcon: true,
    showBorder: true,
};
