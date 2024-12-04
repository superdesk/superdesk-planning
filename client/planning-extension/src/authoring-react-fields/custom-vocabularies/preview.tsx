import * as React from 'react';
import {IPreviewComponentProps} from 'superdesk-api';
import {ICustomVocabulariesValueOperational} from './interfaces';
import {ICustomVocabulariesConfig} from '.';

type IProps = IPreviewComponentProps<ICustomVocabulariesValueOperational, ICustomVocabulariesConfig>;

export class Preview extends React.PureComponent<IProps> {
    render() {
        // not implemented
        return null;
    }
}
