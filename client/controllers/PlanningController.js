PlanningController.$inject = ['$modal'];
export function PlanningController($modal) {
    var vm = this;
    angular.extend(vm, {
        openAddEventForm: function openAddEventForm() {
            $modal.open({
                template: require('../views/addEventModal.html')
            });
        }
    });
}
