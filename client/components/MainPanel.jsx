import React from 'react';
import PropTypes from 'prop-types';
import ListGroup from './ListGroup';

class MainPanel extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { groups, onItemClick } = this.props;
        return (
            <div className="sd-column-box__main-column">
                {groups.map((group) => (
                    <ListGroup
                        key={group.date}
                        name={group.date}
                        items={[group.event]}
                        onItemClick={onItemClick}
                    />
                ))}
            </div>
        );
    }
}

MainPanel.propTypes = {
    groups: PropTypes.array,
    onItemClick: PropTypes.func.isRequired,
};

export default MainPanel;
