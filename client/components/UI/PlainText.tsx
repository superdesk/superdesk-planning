import * as React from 'react';
import {memoize} from 'lodash';

import {stringUtils} from '../../utils';

interface IProps {
    text?: string;
}

const getPlainText = memoize((html: string) => stringUtils.convertHtmlToPlainText(html));

export class PlainText extends React.PureComponent<IProps> {
    render() {
        return getPlainText(this.props.text) || null;
    }
}
