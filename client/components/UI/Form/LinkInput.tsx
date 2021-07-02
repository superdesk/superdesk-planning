import React from 'react';
import 'whatwg-fetch';
import {get} from 'lodash';

import {appConfig} from 'appConfig';

import {superdeskApi} from '../../../superdeskApi';

import {IconButton, Tooltip} from 'superdesk-ui-framework/react';
import {Row, LineInput, Label, TextArea} from './';

import './style.scss';

interface IProps {
    field: string;
    value: string;
    label?: string;
    readOnly?: boolean;
    message?: string;
    noMargin?: boolean; // defaults to true

    onChange(field: string, value: string): void;
    remove(): void;
    onFocus?(): void;
}

interface IState {
    title: string;
}

/**
 * @ngdoc react
 * @name LinkInput
 * @description Component to attach links as input
 */
export class LinkInput extends React.Component<IProps, IState> {
    errorTitle: string;

    constructor(props) {
        super(props);
        this.state = {title: props.value};
        this.errorTitle = superdeskApi.localization.gettext('Could not load title');
    }

    componentWillMount() {
        this.setTitle(this.props.value);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.value !== this.props.value ||
            get(nextProps, `errors.${nextProps.field}`) !== get(this.props, `errors.${this.props.field}`)) {
            this.setTitle(nextProps.value, nextProps);
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
        let hostname = this.extractHostname(link);
        const protocol = link.indexOf('://') > -1 ? link.split('/')[0] : 'http:';
        const resource = link.substr(link.indexOf(hostname) + hostname.length);

        // Only add 'www.' back in if the original link has 'www.' in it
        if (link.indexOf('://www.') > -1) {
            hostname = 'www.' + hostname;
        }

        return `${protocol}//${hostname}${resource}`;
    }

    setTitle(link, props = this.props) {
        if (!link) {
            return;
        }

        const hostName = this.extractHostname(link);

        if (!appConfig.iframely || !appConfig.iframely.key) {
            this.setState({title: 'www.' + hostName});
            return;
        }

        const urlRegExp = new RegExp(
            '^' +
            // host & domain names, may end with dot
            // can be replaced by a shortest alternative
            // (?![-_])(?:[-\\w\\u00a1-\\uffff]{0,63}[^-_]\\.)+
            '(?:' +
            '(?:' +
              '[a-z0-9\\u00a1-\\uffff]' +
              '[a-z0-9\\u00a1-\\uffff_-]{0,62}' +
            ')?' +
            '[a-z0-9\\u00a1-\\uffff]\\.' +
            ')+' +
            // TLD identifier name, may end with dot
            '(?:[a-z\\u00a1-\\uffff]{2,}\\.?)' +
            // ")" +
                '(?:[/?#]\\S*)?' +
            '$', 'i'
        );


        if (get(props, `errors.${props.field}.length`, 0) > 0 || !hostName.match(urlRegExp)) {
            return;
        }

        let url = 'https://iframe.ly/api/iframely?url=' + link + '&api_key=' + appConfig.iframely.key;

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
            // This is in cases of network failure issues
            // refer: https://www.npmjs.com/package/whatwg-fetch
                this.setState({title: this.errorTitle});
            });
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {
            value,
            field,
            remove,
            onChange,
            label,
            readOnly,
            noMargin = true,
            onFocus,
            ...props
        } = this.props;

        const showLink = this.state.title &&
            !props.message &&
            get(value, 'length', 0) > 0;

        return readOnly ? (
            <Row>
                <LineInput noMargin={noMargin} noLabel={true}>
                    <Label text={this.state.title} />
                    <a
                        href={this.getAbsoulteURL(value)}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {value}
                    </a>
                </LineInput>
            </Row>
        ) : (
            <Row className="link-input">
                <LineInput
                    {...props}
                    readOnly={readOnly}
                    noMargin={noMargin}
                    invalid={get(props, `errors.${field}.length`, 0) > 0}
                    message={get(props, `errors.${field}`)}
                >
                    <Label text={label} />

                    <TextArea
                        className="link-input__input"
                        field={field}
                        value={value}
                        onChange={onChange}
                        placeholder={gettext('Paste link')}
                        readOnly={readOnly}
                        paddingRight60={true}
                        autoFocus
                        tabIndex={0}
                        multiLine={false}
                        onFocus={onFocus}
                    />

                    {showLink && appConfig.iframely && appConfig.iframely.key && (
                        <a
                            href={this.getAbsoulteURL(value)}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {this.state.title}
                        </a>
                    )}

                    <span
                        className="sd-line-input__icon-right"
                        style={{top: '1.6rem'}}
                    >
                        {!showLink ? null : (
                            <Tooltip text={gettext('Open link')}>
                                <IconButton
                                    icon="link"
                                    ariaValue={gettext('Open link')}
                                    onClick={() => {
                                        window.open(this.getAbsoulteURL(value), '_blank');
                                    }}
                                />
                            </Tooltip>
                        )}

                        <Tooltip text={gettext('Delete link')}>
                            <IconButton
                                onClick={remove}
                                icon="trash"
                                ariaValue={gettext('Delete link')}
                            />
                        </Tooltip>
                    </span>
                </LineInput>
            </Row>
        );
    }
}
