import React from 'react';
import PropTypes from 'prop-types';
import './style.scss';

export class ColoredValueSelectFieldPopup extends React.Component {
    constructor(props) {
        super(props);
        this.handleClickOutside = this.handleClickOutside.bind(this);
        this.dom = {popup: null};
    }

    componentDidMount() {
        document.addEventListener('click', this.handleClickOutside, true);
    }

    componentWillUnmount() {
        document.removeEventListener('click', this.handleClickOutside, true);
    }

    handleClickOutside(event) {
        if ((!this.dom.popup || !this.dom.popup.contains(event.target))) {
            this.props.onCancel();
        }
    }

    render() {
        return (<div
            className="ColoredValueSelect__popup"
            ref={(node) => this.dom.popup = node}>
            {this.props.title && <label>{this.props.title}</label>}
            <ul>
                {this.props.clearable && <li>
                    <button type="button"
                        onClick={this.props.onChange.bind(null, {
                            label: 'None',
                            value: {qcode: null},
                        })} >
                        <span>None</span>
                    </button>
                </li>}
                {this.props.options.map((opt, index) => (
                    <li key={index}>
                        <button type="button" onClick={this.props.onChange.bind(null, opt)} >
                            <span className={this.props.getClassNamesForOption(opt)}>{opt.value.qcode}</span>
                            &nbsp;&nbsp;{opt.label}
                        </button>
                    </li>
                ))}
            </ul>
        </div>);
    }
}

ColoredValueSelectFieldPopup.propTypes = {
    onChange: PropTypes.func,
    onCancel: PropTypes.func,
    title: PropTypes.string,
    options: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string,
        value: PropTypes.object,
    })).isRequired,
    getClassNamesForOption: PropTypes.func,
    clearable: PropTypes.bool,
};
