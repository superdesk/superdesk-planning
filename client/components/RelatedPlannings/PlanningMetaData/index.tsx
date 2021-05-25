import React from 'react';
import PropTypes from 'prop-types';

import {ICON_COLORS} from '../../../constants';
import {onEventCapture, editorMenuUtils} from '../../../utils';

import {ItemIcon} from '../../index';
import {Item, Column, Row} from '../../UI/List';
import {CollapseBox} from '../../UI';
import {PlanningPreviewContent} from '../../Planning';
import {RelatedPlanningListItem} from './RelatedPlanningListItem';

export const PlanningMetaData = (
    {
        plan,
        scrollInView,
        tabEnabled,
        onEditPlanning,
        noOpen,
        onClick,
        navigation,
        active,
        showIcon,
        showBorder,
        field,
        noBg,
    }
) => {
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
        <RelatedPlanningListItem
            item={plan}
            active={active}
            noBg={noBg}
            showBorder={showBorder}
            showIcon={showIcon}
            editPlanningComponent={editPlanningComponent}
        />
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
    showIcon: PropTypes.bool,
    showBorder: PropTypes.bool,
    field: PropTypes.string,
    noBg: PropTypes.bool,
};


PlanningMetaData.defaultProps = {
    scrollInView: true,
    showIcon: true,
    showBorder: true,
};
