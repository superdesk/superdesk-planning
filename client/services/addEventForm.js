addEventForm.$inject = ['$modal'];
export function addEventForm($modal) {
    return {
        openForm: function openAddEventForm(event) {
            $modal.open({
                template: require('../views/addEventModal.html'),
                controllerAs: 'vm',
                controller: function() {
                    var vm = this;
                    vm.event = event;
                }
            });
        }
    };
}
