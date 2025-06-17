import {IPlanningItem} from '../../interfaces';

// It has to be importable from the main superdesk repo.
export interface IPlanningExtensionConfigurationOptions {
    assignmentsTopBarWidget?: boolean;

    /**
     * Custom comparison function for sorting planning items
     *
     * Orders elements in the planning only list view.
     */
    comparePlanningItems?: (a: IPlanningItem, b: IPlanningItem) => number;
}
