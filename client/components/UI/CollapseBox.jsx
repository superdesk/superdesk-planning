import React from 'react';
import PropTypes from 'prop-types';

export class CollapseBox extends React.Component {
    constructor(props) {
        super(props);
        this.state = {open: false};
    }

    toggleOpenState() {
        this.setState({open: !this.state.open});
    }

    render() {
        if (this.state.open) {
            return (
                <div className="sd-collapse-box sd-shadow--z2 sd-collapse-box--open">
                    <div className="sd-collapse-box__content-wraper">
                        <div className="sd-collapse-box__content">
                            <div className="sd-collapse-box__tools">
                                <a className="icn-btn" onClick={this.toggleOpenState.bind(this)}>
                                    <i className="icon-chevron-up-thin" />
                                </a>
                            </div>
                            {this.props.openItemTopBar &&
                            <div className="sd-collapse-box__content-block sd-collapse-box__content-block--top">
                                {this.props.openItemTopBar}
                            </div>}
                            {this.props.openItem}
                        </div>
                    </div>
                </div>);
        }

        return (
            <div className="sd-collapse-box sd-shadow--z2"
                onClick={this.toggleOpenState.bind(this)}>
                {this.props.collapsedItem}
            </div>
        );
    }
}

CollapseBox.propTypes = {
    collapsedItem: PropTypes.node.isRequired,
    openItem: PropTypes.node.isRequired,
    openItemTopBar: PropTypes.node,
};
