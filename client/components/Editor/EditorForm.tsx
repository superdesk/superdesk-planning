import * as React from 'react';
import {connect} from 'react-redux';

import {
    EDITOR_TYPE,
    IEditorAPI,
    IEditorFormGroup,
    IFormItemManager,
    IProfileSchema,
    IPlanningAppState,
} from '../../interfaces';
import {planningApi, superdeskApi} from '../../superdeskApi';

import {EditorGroup} from './EditorGroup';
import {ContentBlock, ContentBlockInner} from '../UI/SidePanel';
import {EditorBookmarksBar} from './EditorBookmarksBar';

import {editorSelectors} from '../../selectors/editors';
import * as actions from '../../actions';

interface IProps {
    defaultGroup: IEditorFormGroup['id'];
    groups?: Array<IEditorFormGroup>;
    schema: IProfileSchema;
    globalProps: {[key: string]: any};
    fieldProps?: {[key: string]: any};
    header?: React.ReactNode;
    itemManager: IFormItemManager;
    activeNav?: string;
    editorType: EDITOR_TYPE;
}

const mapStateToProps = (state: IPlanningAppState, props: IProps) => ({
    groups: editorSelectors[props.editorType].getEditorGroupsSorted(state),
});

class EditorFormComponent extends React.PureComponent<IProps> {
    editorApi: IEditorAPI;

    constructor(props) {
        super(props);
        const dispatch = planningApi.redux.store.dispatch;

        if (!superdeskApi.privileges.hasPrivilege('planning_planning_management')) {
            const groupsById: {[key: string]: IEditorFormGroup} = {};

            this.props.groups.forEach((group) => {
                if (group.id != 'add-planning') {
                    groupsById[group.id] = group;
                }
            });
            dispatch(actions.editors.setFormGroups(this.props.editorType, groupsById));
        }
        this.editorApi = planningApi.editor(this.props.editorType);
    }

    componentDidMount() {
        this.editorApi.events.onEditorFormMounted();
    }

    render() {
        const isPanelEditor = this.props.editorType === EDITOR_TYPE.INLINE;
        const formContainerRefNode = !isPanelEditor ?
            null :
            this.editorApi.dom.formContainer;

        return (
            <React.Fragment>
                {!isPanelEditor ? null : (
                    <ContentBlock navbar={true} noPadding={true}>
                        <EditorBookmarksBar editorType={this.props.editorType} />
                    </ContentBlock>
                )}
                <div
                    className="side-panel__content-body"
                    ref={formContainerRefNode}
                    onScroll={!isPanelEditor ? undefined : this.editorApi.events.onScroll}
                >
                    {this.props.header}
                    <ContentBlock>
                        <ContentBlockInner grow={true}>
                            {(this.props.groups ?? []).map(
                                (group) => !group.fields?.length ? null : (
                                    <EditorGroup
                                        ref={this.editorApi.dom.groups[group.id]}
                                        key={group.id}
                                        group={group}
                                        defaultGroup={this.props.defaultGroup}
                                        schema={this.props.schema}
                                        editorType={this.props.editorType}
                                        globalProps={this.props.globalProps ?? {}}
                                        fieldProps={this.props.fieldProps ?? {}}
                                    />
                                )
                            )}
                        </ContentBlockInner>
                    </ContentBlock>
                    {this.props.children}
                    <div style={{height: '80vh'}} />
                </div>
            </React.Fragment>
        );
    }
}

export const EditorForm = connect(mapStateToProps)(EditorFormComponent);
