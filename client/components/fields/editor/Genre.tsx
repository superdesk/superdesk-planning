import * as React from 'react';
import {connect} from 'react-redux';

import {superdeskApi} from '../../../superdeskApi';
import {IEditorFieldProps, IGenre} from '../../../interfaces';
import {EditorFieldSelect} from './base/select';

interface IProps extends IEditorFieldProps {
    genres: Array<IGenre>;
    clearable?: boolean;
    defaultValue?: IGenre;
}

const mapStateToProps = (state) => ({
    genres: state.genres,
});

export class EditorFieldGenreComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldSelect
                {...this.props}
                field={this.props.field ?? 'genre'}
                label={this.props.label ?? gettext('Genre')}
                options={this.props.genres}
                labelField="name"
            />
        );
    }
}

export const EditorFieldGenre = connect(
    mapStateToProps,
    null,
    null,
    {forwardRef: true}
)(EditorFieldGenreComponent);
