import React from 'react';
import PropTypes from 'prop-types';

import {Item, Border, ItemType, Column, Row} from '../UI/List';
import {PriorityLabel, UrgencyLabel} from '../';

export const ArchiveItem = ({item, priorities, urgencies, urgencyLabel}) => (
    <Item
        shadow={2}
        noHover={true}
    >
        <Border state="locked"/>
        <ItemType
            item={item}
            hasCheck={false}
        />
        <Column>
            <Row>
                <UrgencyLabel
                    item={item}
                    label={urgencyLabel}
                    urgencies={urgencies}
                    tooltipFlow="down"
                    className="sd-list-item__inline-icon"
                />
                <PriorityLabel
                    item={item}
                    priorities={priorities}
                    tooltipFlow="down"
                />
            </Row>
        </Column>
        <Column>
            <Row>
                <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                    <span className="sd-list-item__slugline">{item.slugline}</span>
                    {item.headline}
                </span>
            </Row>
        </Column>
    </Item>
);

ArchiveItem.propTypes = {
    item: PropTypes.object,
    priorities: PropTypes.array,
    urgencies: PropTypes.array,
    urgencyLabel: PropTypes.string,
};
