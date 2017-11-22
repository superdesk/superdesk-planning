import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { defer } from 'lodash';

class SubnavDropdown extends React.Component {
    constructor(props) {
        super(props);
        this.state = {open: false};
        this.toggle = this.toggle.bind(this);
        this.close = this.close.bind(this);
    }

    toggle() {
        // change state only when click event handling is over
        this.inToggle = true;
        defer(() => {
            this.setState({open: !this.state.open});
            this.inToggle = false;
        });
    }

    close() {
        if (!this.inToggle && this.state.open) {
            this.setState({open: false});
        }
    }

    componentDidMount() {
        document.addEventListener('click', this.close);
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.close);
    }

    render() {
        const isCreate = this.props.icon === 'icon-plus-large';
        const className = classNames('dropdown dropdown--align-right', {open: this.state.open});
        const buttonClassName = classNames('dropdown__toggle navbtn', {
            'sd-create-btn': isCreate,
        });

        return (
            <div className={className}>
                <button
                    ref={(btn) => this.btn = btn}
                    className={buttonClassName}
                    onClick={this.toggle}>
                    <i className={this.props.icon} />
                    {isCreate && (
                        <span className="circle" />
                    )}
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
