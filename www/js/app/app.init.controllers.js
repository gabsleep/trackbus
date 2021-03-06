(function() {
    'use strict';

    angular
        .module('app')
        .controller('InitController', InitController);

    InitController.$inject = ['$state', '$rootScope', 'alertService', 'stateService', 'ERROR_MESSAGES'];

    function InitController($state, $rootScope, alertService, stateService, ERROR_MESSAGES) {
        var vm = this;

        activate();

        function activate() {
            setLoadingEvents();
            stateService.list();
        };

        function setLoadingEvents(){
            //triggers loading on every state change
            $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
                alertService.showLoading();
            });
            $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
                alertService.hideLoading();
            });
            $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
                console.error(error);
                alertService.showAlert("Erro", ERROR_MESSAGES.GENERIC);
                alertService.hideLoading();
            });
        };
    };

})();