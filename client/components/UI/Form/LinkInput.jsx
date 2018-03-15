import React from 'react';
import PropTypes from 'prop-types';
import 'whatwg-fetch';
import {Row, Input, LineInput, Label} from './';
import './style.scss';

export class LinkInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = {title: props.value};
        this.errorTitle = 'Could not load title';
    }

    componentWillMount() {
        this.setTitle(this.props.value);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.value !== this.props.value) {
            this.setTitle(nextProps.value);
        }
    }

    extractHostname(link) {
        let hostname;

        // Find & remove protocol (http, ftp, etc.) and get hostname
        if (link.indexOf('://') > -1) {
            hostname = link.split('/')[2];
        } else {
            hostname = link.split('/')[0];
        }

        // Find & remove port number
        hostname = hostname.split(':')[0];

        // Find & remove "?"
        hostname = hostname.split('?')[0];

        return hostname.replace('www.', '');
    }

    getAbsoulteURL(link) {
        const hostname = this.extractHostname(link);
        const protocol = link.indexOf('://') > -1 ? link.split('/')[0] : 'http:';

        return protocol + '//www.' + hostname;
    }

    setTitle(link) {
        if (!link) {
            return;
        }

        if (!this.props.iframelyKey) {
            this.setState({title: 'www.' + this.extractHostname(link)});
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
        const {value, field, remove, onChange, label, readOnly, ...props} = this.props;

        return readOnly ? (
            <Row>
                <LineInput noMargin={true}>
                    <Label text={this.state.title} />
                    <a href={this.getAbsoulteURL(value)} target="_blank">{value}</a>
                </LineInput>
            </Row>
        ) : (
            <Row className="link-input">
                <LineInput {...props} readOnly={readOnly}>
                    <Label text={label} />
                    <a className="icn-btn sd-line-input__icon-right" onClick={remove}>
                        <i className="icon-trash" />
                    </a>
                    <Input
                        field={field}
                        value={value}
                        onChange={onChange}
                        type="text"
                        placeholder="Paste link"
                        readOnly={readOnly}
                        autoFocus
                    />
                    {this.state.title && (
                        <a href={this.getAbsoulteURL(value)} target="_blank">{this.state.title}</a>
                    )}
                </LineInput>
            </Row>
        );
    }
}

LinkInput.propTypes = {
    remove: PropTypes.func,
    field: PropTypes.string,
    value: PropTypes.string,
    label: PropTypes.string,
    onChange: PropTypes.func,
    iframelyKey: PropTypes.string,
    readOnly: PropTypes.bool,
};

LinkInput.defaultProps = {
    readOnly: false,
    value: '',
};
