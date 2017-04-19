import React from 'react'
import { connect } from 'react-redux'
import $ from 'jquery'
import 'jquery-ui/ui/core'
import 'jquery-ui/ui/resizable'
import 'jquery-ui/themes/base/resizable.css'

export class ResizableEventsPanelComponent extends React.Component {

    constructor(props) {
        super(props)
        this._onResize = this._onResize.bind(this)
    }

    _onResize(delay=0) {
        let thisNode = $(this.refs.panel)
        let nextElement = thisNode.next()
        let windowWidth = $(window).width()
        let thisOffset = thisNode.offset()
        let rightBorder = parseInt(thisNode.css('border-right-width'))
        //Fix for firefox, if no 'delay', don't use setTimeout()
        if (!delay) {
            nextElement.css({
                width: (windowWidth - (thisNode.width() + thisOffset.left + rightBorder)),
                left: (thisNode.width() + rightBorder),
            })
        } else {
            let timeout
            // use setTimeout to adjust for transition effects and rate limit
            // tried to use lodash debounce here, but it never seemed to work
            clearTimeout(timeout)
            timeout = setTimeout(() => {
                nextElement.css({
                    width: (windowWidth - (thisNode.width() + thisOffset.left + rightBorder)),
                    left: (thisNode.width() + rightBorder),
                })
            }, delay)
        }
    }

    componentDidMount() {
        let thisNode = $(this.refs.panel)
        let container = $(thisNode).parent()
        let children = $(thisNode).children()
        $(thisNode).resizable({
            handles: 'e',
            minWidth: this.props.minWidth,
            maxWidth: this.props.maxWidth,
            start: () => {
                // suspend transition effects
                container.addClass('no-transition')
                children.addClass('no-transition')
                $(thisNode).addClass('no-transition')
            },
            resize: () => {
                // adjust width of next element
                this._onResize()
            },
            stop: () => {
                // re-enable transition effects
                container.removeClass('no-transition')
                children.removeClass('no-transition')
                $(thisNode).removeClass('no-transition')
            },
        })
        // call resize once to initialy set width of next element
        this._onResize()
        window.addEventListener('resize', this._onResize)
    }

    componentWillUnmont() {
        window.removeEventListener('resize', this._onResize)
    }

    componentDidUpdate(prevProps) {
        // call resize for showEvents prop changes
        if (prevProps.showEvents !== this.props.showEvents) {
            this._onResize(500)
        }
    }

    render() {
        return <div ref='panel' className={this.props.className}>
            {this.props.children}
        </div>
    }
}

ResizableEventsPanelComponent.propTypes = {
    children: React.PropTypes.oneOfType([
        React.PropTypes.array,
        React.PropTypes.element,
    ]).isRequired,
    minWidth: React.PropTypes.number,
    maxWidth: React.PropTypes.number,
    className: React.PropTypes.string,
    showEvents: React.PropTypes.bool,
}
const mapStateToProps = (state) => ({ showEvents: state.events.show })
export const ResizableEventsPanel = connect(mapStateToProps)(ResizableEventsPanelComponent)
