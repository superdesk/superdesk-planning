import React from 'react';
import PropTypes from 'prop-types';

import {gettext} from '../../utils';

import {Button} from '../UI';

export default class OrderBar extends React.Component {
    constructor(props) {
        super(props);

        this.onChangeOrder = this.onChangeOrder.bind(this);
        this.onChangeField = this.onChangeField.bind(this);
    }

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
                        <select onChange={this.onChangeField} value={orderByField}>
                            { fields.map((field) => (<option key={field} value={field}>{field}</option>)) }
                        </select>
                    </div>
                    <Button
                        onClick={this.onChangeOrder}
                        className="direction"
                        title={orderDirection === 'Asc' ? gettext('Ascending') : gettext('Descending')}
                        iconOnly={true}
                        icon={orderDirection === 'Asc' ? 'icon-ascending' : 'icon-descending'}
                    />
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
