import React from 'react';
import PropTypes from 'prop-types';

export default class OrderBar extends React.Component {
    onChangeOrder() {
        const {orderByField, orderDirection, onChange} = this.props;

        onChange(orderByField, orderDirection === 'Asc' ? 'Desc' : 'Asc');
    }

    onChangeField(event) {
        const {orderDirection, onChange} = this.props;

        onChange(event.target.value, orderDirection);
    }

    render() {
        const {orderByField, orderDirection, fields} = this.props;

        return (
            <div className="sortbar-container">
                <div className="sortbar">
                    <div>
                        <select onChange={this.onChangeField.bind(this)} value={orderByField}>
                            { fields.map((field) => (<option key={field} value={field}>{field}</option>)) }
                        </select>
                    </div>
                    <button onClick={() => this.onChangeOrder()} className="btn direction" title={orderDirection}>
                        { orderDirection === 'Asc' && (<i className="icon-ascending"/>) }
                        { orderDirection === 'Desc' && (<i className="icon-descending"/>) }
                    </button>
                </div>
            </div>
        );
    }
}

OrderBar.propTypes = {
    orderByField: PropTypes.string,
    orderDirection: PropTypes.string,
    fields: PropTypes.array,
    onChange: PropTypes.func,
};

OrderBar.defaultProps = {order: 'Asc'};
