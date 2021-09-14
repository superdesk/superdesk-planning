import * as React from 'react';
import {get, set} from 'lodash';

import {EditorFieldText, IEditorFieldTextProps} from './text';

interface IState {
    item: {[key: string]: string};
}

export class EditorFieldNumber extends React.Component<IEditorFieldTextProps, IState> {
    constructor(props: IEditorFieldTextProps) {
        super(props);

        this.onChange = this.onChange.bind(this);
        this.state = {item: this.getItem()};
    }

    getItem() {
        const item = {};
        const value = get(this.props.item, this.props.field, this.props.defaultValue);

        set(item, this.props.field, value?.toString() ?? '');

        return item;
    }

    onChange(_field: string, value: string) {
        this.setState((prevState: Readonly<IState>) => {
            const item = {...prevState.item};

            set(item, this.props.field, value);

            return {item};
        });

        this.props.onChange(this.props.field, parseInt(value, 10) || null);
    }

    render() {
        return (
            <EditorFieldText
                {...this.props}
                onChange={this.onChange}
                item={this.state.item}
            />
        );
    }
}
