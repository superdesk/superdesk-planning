import * as React from 'react';
import {connect} from 'react-redux';

import {superdeskApi} from '../../../superdeskApi';
import {EditorFieldVocabulary} from './base/vocabulary';
import {locators} from '../../../selectors/vocabs';
import {ILocator, IEditorFieldProps} from '../../../interfaces';

interface IProps extends IEditorFieldProps {
    locators: Array<ILocator>;
}

const mapStateToProps = (state) => ({
    locators: locators(state),
});

export class EditorFieldPlaceComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldVocabulary
                field={this.props.field ?? 'place'}
                label={this.props.label ?? gettext('Place')}
                defaultValue={[]}
                options={this.props.locators}
                groupField="group"
                {...this.props}
            />
        );
    }
}

export const EditorFieldPlace = connect(mapStateToProps)(EditorFieldPlaceComponent);
