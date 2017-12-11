import React from 'react';
import PropTypes from 'prop-types';
import {Field} from 'redux-form';
import {connect} from 'react-redux';
import * as selectors from '../../selectors';
import 'whatwg-fetch';
import classNames from 'classnames';
import {Row} from '../UI/Preview';
import './style.scss';

export class LinkFieldComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {title: props.link};
        this.errorTitle = 'Could not load title';
    }

    componentWillMount() {
        this.setTitle(this.props.link);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.link !== this.props.link) {
            this.setTitle(nextProps.link);
        }
    }

    setTitle(link) {
        if (!link) {
            return;
        }

        if (!this.props.iframelyKey) {
            this.setState({title: this.errorTitle});
            return;
        }

        let url = 'https://iframe.ly/api/iframely?url=' + link + '&api_key=' + this.props.iframelyKey;

        fetch(url).then((response) => {
            // Need to do HTTP response status check manually for whatwg-fetch
            // refer: https://www.npmjs.com/package/whatwg-fetch
            if (response.status >= 200 && response.status < 300) {
                return response.json();
            } else {
                this.setState({title: this.errorTitle});
            }
        })
            .then((json) => {
                this.setState({title: json.meta.title});
            })
            .catch(() => {
            // This is in cases of network failuree issues
            // refer: https://www.npmjs.com/package/whatwg-fetch
                this.setState({title: this.errorTitle});
            });
    }

    render() {
        return (
            <li className="Link__Item">
                {this.props.readOnly && <Row
                    className='link'
                    value={this.props.link}>
                        { this.state.title &&
                            <a href={this.props.link} target="_blank" className="line-input">
                                {this.state.title}&nbsp;
                            </a>
                        }
                    </Row>
                }
                {!this.props.readOnly && <Field
                    name={this.props.fieldName}
                    className={classNames('line-input', {disabledInput: this.props.readOnly})}
                    component="input"
                    type="text"
                    placeholder="Paste link"/>
                }
                {!this.props.readOnly && <button
                    className="Link__remove"
                    onClick={this.props.onRemove}
                    title="Remove link"
                    type="button">
                    <i className="icon-trash" />
                </button>}
            </li>
        );
    }
}

LinkFieldComponent.propTypes = {
    onRemove: PropTypes.func,
    fieldName: PropTypes.string,
    link: PropTypes.string,
    iframelyKey: PropTypes.string,
    readOnly: PropTypes.bool,
};

const mapStateToProps = (state) => ({iframelyKey: selectors.getIframelyKey(state)});

export const LinkField = connect(mapStateToProps)(LinkFieldComponent);
