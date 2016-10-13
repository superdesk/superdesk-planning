PlanningController.$inject = ['addEventForm'];
export function PlanningController(addEventForm) {
    var vm = this;
    angular.extend(vm, {
        openAddEventForm: addEventForm.openForm
    });
}
