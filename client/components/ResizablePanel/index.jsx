import React from 'react'
import ReactDOM from 'react-dom'
import $ from 'jquery'
import 'jquery-ui/ui/core'
import 'jquery-ui/ui/resizable'
import 'jquery-ui/themes/base/resizable.css'

export class ResizablePanel extends React.Component {

    constructor(props) {
        super(props)
    }

    componentDidMount() {
        let thisNode = ReactDOM.findDOMNode(this)

        $(thisNode).resizable({
            handles: this.props.direction,
            minWidth: this.props.minWidth,
            maxWidth: this.props.maxWidth,
            start: (e, ui) => {
                let container = ui.element.parent()
                let children = ui.element.children()
                let element = ui.element
                container.addClass('no-transition')
                children.addClass('no-transition')
                element.addClass('no-transition')
            },
            stop: (e, ui) => {
                let container = ui.element.parent()
                let children = ui.element.children()
                let element = ui.element
                container.removeClass('no-transition')
                children.removeClass('no-transition')
                element.removeClass('no-transition')
            } 
        })
    }

    render() {
        return <div className={this.props.className}> 
            {this.props.children}
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
    direction: 'e'
}
