import {connect} from 'react-redux';
import * as selectors from '../../selectors';

import {PlanningUi} from './PlanningUi';
import {AddToPlanningUi} from './AddToPlanningUi';

const mapStateToProps = (state) => ({
    editorOpen: !!selectors.forms.currentItemType(state),
    previewOpen: !!selectors.main.previewType(state),
});

export const PlanningApp = connect(mapStateToProps)(PlanningUi);
export const AddToPlanningApp = connect(mapStateToProps)(AddToPlanningUi);
