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
        const vocabulary = superdeskApi.entities.vocabulary.getVocabulary('categories');

        return (
            <EditorFieldVocabulary
                {...this.props}
                field={this.props.field ?? 'anpa_category'}
                label={vocabulary.display_name ?? gettext('ANPA Category')}
                options={this.props.categories}
                singleSelect={this.props.singleSelect ?? (vocabulary.selection_type !== 'multi selection')}
            />
        );
    }
}

export const EditorFieldCategories = connect(
    mapStateToProps,
    null,
    null,
    {forwardRef: true}
)(EditorFieldCategoriesComponent);
