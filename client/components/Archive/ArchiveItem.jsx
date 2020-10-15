import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {Item, Border, ItemType, Column, Row} from '../UI/List';
import {PriorityLabel, UrgencyLabel} from '../';
import * as selectors from '../../selectors';

export const ArchiveItemComponent = ({item, priorities, urgencies, urgencyLabel}) => (
    <Item
        shadow={2}
        noHover={true}
        className="archive-item"
    >
        <Border state="locked" />
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
                    inline={true}
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

ArchiveItemComponent.propTypes = {
    item: PropTypes.object,
    priorities: PropTypes.array,
    urgencies: PropTypes.array,
    urgencyLabel: PropTypes.string,
};

const mapStateToProps = (state) => ({
    priorities: selectors.getArchivePriorities(state),
    urgencies: selectors.getUrgencies(state),
    urgencyLabel: selectors.vocabs.urgencyLabel(state),
});

export const ArchiveItem = connect(mapStateToProps)(ArchiveItemComponent);
