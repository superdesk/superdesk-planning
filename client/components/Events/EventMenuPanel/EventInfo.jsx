import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import {appConfig} from 'appConfig';

import {getDateTimeString} from '../../../utils';
import {CollapseBox} from '../../UI';
import {Item, Column, Row, Border} from '../../UI/List';
import {StateLabel, InternalNoteLabel} from '../../../components';

export const EventInfo = ({item, onClick, active}) => {
    const collapsedItem = (
        <Item noBg={!active} onClick={onClick} activated={active}>
            <Border />
            <Column grow={true}>
                <Row paddingBottom>
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                        {item.slugline &&
                            <span className="sd-list-item__slugline">{item.slugline}</span>
                        }
                        <span className="sd-overflow-ellipsis sd-list-item--element-grow">{item.name}</span>
                    </span>
                </Row>
                <Row>
                    <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                        <time className="no-padding">
                            <InternalNoteLabel item={item} marginRight={true} />
                            <i className="icon-time" />
                            {get(item, 'dates.start') &&
                            getDateTimeString(
                                item.dates.start,
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

EventInfo.propTypes = {
    item: PropTypes.object,
    onClick: PropTypes.func,
    active: PropTypes.bool,
};
