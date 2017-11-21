import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import * as selectors from '../selectors';

import ListGroup from './ListGroup';

class MainPanel extends React.Component {
    render() {
        const { groups } = this.props;
        return (
            <div className="sd-column-box__main-column">
                {groups.map((group) => (
                    <ListGroup
                        key={group.date}
                        name={group.date}
                        items={[group.event]}
                    />
                ))}
            </div>
        );
    }
}

MainPanel.propTypes = {
    groups: PropTypes.array,
};

const mapStateToProps = (state) => ({ groups: selectors.getEventsOrderedByDay(state) });

export default connect(mapStateToProps)(MainPanel);
