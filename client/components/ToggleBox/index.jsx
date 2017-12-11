import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export class ToggleBox extends React.Component {
    constructor(props) {
        super(props);
        this.state = {isOpen: this.props.isOpen};
        this.scrollInView = this.scrollInView.bind(this);
    }

    toggle() {
        this.setState({isOpen: !this.state.isOpen});
    }

    scrollInView() {
        if (this.state.isOpen) {
            const node = ReactDOM.findDOMNode(this);

            if (node) {
                node.scrollIntoView();
            }
        }
    }

    // eslint-disable-next-line
    componentDidUpdate(prevProps, prevState) {
        if (this.state.isOpen && this.props.scrollInView) {
            this.scrollInView();
        }
    }

    render() {
        const {
            style,
            title,
            children,
        } = this.props;

        return (
            <div className={classNames('toggle-box toggle-box--circle', style, {hidden: !this.state.isOpen})}>
                <div className="toggle-box__header" onClick={this.toggle.bind(this)}>
                    <div className="toggle-box__chevron"><i className="icon-chevron-right-thin"/></div>
                    <div className="toggle-box__label">{title}</div>
                    <div className="toggle-box__line"/>
                </div>
                <div className="toggle-box__content-wraper">
                    {
                        this.state.isOpen &&
                    <div className="toggle-box__content">
                        {children}
                    </div>
                    }
                </div>
            </div>
        );
    }
}

ToggleBox.propTypes = {
    style: PropTypes.string,
    isOpen: PropTypes.bool,
    title: PropTypes.string.isRequired,
    children: PropTypes.node,
    scrollInView: PropTypes.bool,
};

ToggleBox.defaultProps = {
    isOpen: true,
    scrollInView: false,
};
