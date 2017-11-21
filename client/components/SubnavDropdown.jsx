import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

class SubnavDropdown extends React.Component {
    constructor(props) {
        super(props);
        this.state = {open: false};
        this.toggle = this.toggle.bind(this);
    }

    toggle() {
        this.setState({open: !this.state.open});
    }

    render() {
        const className = classNames('dropdown dropdown--align-right', {open: this.state.open});
        return (
            <div className={className}>
                <button className="dropdown__toggle navbtn dropdown-toggle" onClick={this.toggle}>
                    <i className={this.props.icon} />
                </button>
                {this.state.open && (
                    <ul className="dropdown__menu dropdown--align-right">
                        <li className="dropdown__menu-label">{this.props.label}</li>
                        <li className="dropdown__menu-divider" />
                    </ul>
                )}
            </div>
        );
    }
}

SubnavDropdown.propTypes = {
    icon: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
};

export default SubnavDropdown;
