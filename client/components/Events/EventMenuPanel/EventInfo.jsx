import React from 'react';
import PropTypes from 'prop-types';

import {getDateTimeString} from '../../../utils';
import {Item, Column, Row, Border} from '../../UI/List';
import {StateLabel, InternalNoteLabel} from '../../../components';

export const EventInfo = ({item, onClick, timeFormat, dateFormat, active}) => (
    <Item noBg={!active} onClick={onClick} activated={active} className="sd-collapse-box sd-shadow--z2">
        <Border/>
        <Column grow={true} border={false}>
            <Row paddingBottom>
                <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                    {item.slugline &&
                            <span className="sd-list-item__slugline">{item.slugline}</span>
                    }
                </span>
                <time>
                    <InternalNoteLabel item={item} marginRight={true} />
                    <i className="icon-time"/>
                    {getDateTimeString(item.dates.start, dateFormat, timeFormat)}
                </time>
            </Row>
            <Row>
                <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                    <StateLabel
                        className="pull-right"
                        item={item} />
                </span>
            </Row>
        </Column>
    </Item>
);

EventInfo.propTypes = {
    item: PropTypes.object,
    onClick: PropTypes.func,
    active: PropTypes.bool,
    dateFormat: PropTypes.string,
    timeFormat: PropTypes.string,
};
