import React from 'react'
import ReactDOM from 'react-dom'
import { get } from 'lodash'
import $ from 'jquery'
import 'jquery-ui/ui/core'
import 'jquery-ui/ui/resizable';
import 'jquery-ui/themes/base/resizable.css';

export class ResizablePanel extends React.Component {

    constructor(props) {
        super(props)
    }

    componentDidMount() {
        let thisNode = ReactDOM.findDOMNode(this)
        let parentAttrName = ReactDOM.findDOMNode(this).parentNode.attributes[0].name
        let parentAttrValue = ReactDOM.findDOMNode(this).parentNode.attributes[0].value

        if (ReactDOM.findDOMNode(this).parentNode.attributes.length > 1) {
            parentAttrName = ReactDOM.findDOMNode(this).parentNode.attributes[1].name
            parentAttrValue = ReactDOM.findDOMNode(this).parentNode.attributes[1].value
        }
        $(thisNode).resizable({
            handles: this.props.direction,
            minWidth: this.props.minWidth,
            maxWidth: this.props.maxWidth
        })
    }

    render() {
        return <div className={this.props.className}> 
            {this.props.children}
            <div className="ui-resizable-handle ui-resizable-e"></div>
        </div>
    }
}

ResizablePanel.propTypes = {
    children: React.PropTypes.oneOfType([
        React.PropTypes.array, 
        React.PropTypes.element
    ]).isRequired,
    direction: React.PropTypes.oneOf(['s', 'e', 'se']),
    minWidth: React.PropTypes.number,
    maxWidth: React.PropTypes.number,
    className: React.PropTypes.string,
}
ResizablePanel.defaultProps = {
    direction: 'e',
    minWidth: 100
}
