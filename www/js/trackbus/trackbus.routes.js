(function() {
    'use strict';

    angular
        .module('trackbus')
        .config(config);

    config.$inject = ['$stateProvider', 'STATES'];

    function config($stateProvider, STATES) {
        $stateProvider
            .state(STATES.LIST, {
                url: '/list',
                templateUrl: 'templates/trackbus/list.html',
                controller: 'ListController',
                controllerAs: 'vm',
                resolve: {
                    linesPromise: function(busWebFactory) {
                        return busWebFactory.listLines(true);
                    }
                }
            })
            .state(STATES.MAP, {
                url: '/map/:line',
                templateUrl: 'templates/trackbus/map.html',
                controller: 'MapController',
                controllerAs: 'vm',
                resolve: {
                    busesPromise: function(busWebFactory, $stateParams) {
                        return busWebFactory.listBuses($stateParams.line);
                    }
                }
            })
            .state(STATES.OPTIONS, {
                url: '/options',
                templateUrl: 'templates/trackbus/options.html',
                controller: 'OptionsController',
                controllerAs: 'vm'
            });
    };

})();