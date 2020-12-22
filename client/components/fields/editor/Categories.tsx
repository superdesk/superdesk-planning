import * as React from 'react';
import {connect} from 'react-redux';

import {superdeskApi} from '../../../superdeskApi';
import {EditorFieldVocabulary} from './base/vocabulary';
import {IANPACategory, IEditorFieldProps} from '../../../interfaces';
import {categories} from '../../../selectors/vocabs';

interface IProps extends IEditorFieldProps {
    categories: Array<IANPACategory>;
}

const mapStateToProps = (state) => ({
    categories: categories(state),
});

export class EditorFieldCategoriesComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldVocabulary
                field={this.props.field ?? 'anpa_category'}
                label={this.props.label ?? gettext('ANPA Category')}
                options={this.props.categories}
                {...this.props}
            />
        );
    }
}

export const EditorFieldCategories = connect(mapStateToProps)(EditorFieldCategoriesComponent);
