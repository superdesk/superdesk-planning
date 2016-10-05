import React from 'react';
import ReactDOM from 'react-dom';
EventDirectiveController.$inject = ['$element'];
export function EventDirectiveController($element) {
    var HelloMessage = React.createClass({
        render: function() {
            return <div>Hello {this.props.name}</div>;
        }
    });
    ReactDOM.render(!<HelloMessage name="blah" />, $element.get(0));
}
