import React from 'react';
import PropTypes from 'prop-types';

import {appConfig} from 'appConfig';

import {getDateTimeString} from '../../../utils';
import {Item, Column, Row, Border} from '../../UI/List';
import {CollapseBox} from '../../UI';
import {StateLabel, InternalNoteLabel} from '../../../components';

export const PlanningInfo = ({item, onClick, active}) => {
    const collapsedItem = (
        <Item noBg={!active} onClick={onClick} activated={active}>
            <Border />
            <Column grow={true}>
                <Row paddingBottom>
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                        {item.slugline &&
                        <span className="sd-list-item__slugline">{item.slugline}</span>
                        }
                    </span>
                </Row>
                <Row>
                    <InternalNoteLabel item={item} marginRight={true} />
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                        <time className="no-padding">
                            <i className="icon-time" />
                            {item.planning_date &&
                            getDateTimeString(
                                item.planning_date,
                                appConfig.planning.dateformat,
                                appConfig.planning.timeformat
                            )
                            }
                        </time>
                    </span>
                </Row>
            </Column>
            <Column>
                <StateLabel
                    className="pull-right"
                    item={item}
                    verbose={true}
                    withExpiredStatus={true}
                />
            </Column>
        </Item>
    );

    return (
        <CollapseBox
            collapsedItem={collapsedItem}
            noOpen
        />
    );
};

PlanningInfo.propTypes = {
    item: PropTypes.object,
    onClick: PropTypes.func,
    active: PropTypes.bool,
};
