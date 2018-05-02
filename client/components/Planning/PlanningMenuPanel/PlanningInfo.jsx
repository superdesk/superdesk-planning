import React from 'react';
import PropTypes from 'prop-types';

import {getDateTimeString} from '../../../utils';
import {Item, Column, Row, Border} from '../../UI/List';
import {CollapseBox} from '../../UI';
import {StateLabel, InternalNoteLabel} from '../../../components';

export const PlanningInfo = ({item, onClick, timeFormat, dateFormat, active}) => {
    const collapsedItem = (<Item noBg={!active} onClick={onClick} activated={active}>
        <Border/>
        <Column grow={true} border={false}>
            <Row paddingBottom>
                <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                    {item.slugline &&
                            <span className="ListItem__slugline form-label">{item.slugline}</span>
                    }
                </span>
                <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                    <StateLabel
                        className="pull-right"
                        item={item} />
                </span>
            </Row>
            <Row>
                <InternalNoteLabel item={item} marginRight={true} />
                <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                    <time className="pull-right">
                        <i className="icon-time"/>
                        {getDateTimeString(item.planning_date, dateFormat, timeFormat)}
                    </time>
                </span>
            </Row>
        </Column>
    </Item>);

    return (
        <CollapseBox
            collapsedItem={collapsedItem}
            noOpen
        />);
};

PlanningInfo.propTypes = {
    item: PropTypes.object,
    onClick: PropTypes.func,
    active: PropTypes.bool,
    dateFormat: PropTypes.string,
    timeFormat: PropTypes.string,
};
