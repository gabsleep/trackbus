(function() {
    'use strict';

    angular
        .module('trackbus')
        .controller('TripController', TripController);

    TripController.$inject = [
        '$scope', 'uiGmapGoogleMapApi', '$interval',
        'spatialService', 'alertService', 'stopService', 'notificationService',
        'stopsPromise', 'configPromise', 'touristPromise',
        'PERSON_ICON', 'BUS_STOP_ICON', 'TOURIST_STOP_ICON',
        'TRACKBUS', 'SUCCESS_MESSAGES', 'ERROR_MESSAGES'
    ];

    function TripController(
        $scope, uiGmapGoogleMapApi, $interval,
        spatialService, alertService, stopService, notificationService,
        stopsPromise, configPromise, touristPromise,
        PERSON_ICON, BUS_STOP_ICON, TOURIST_STOP_ICON,
        TRACKBUS, SUCCESS_MESSAGES, ERROR_MESSAGES
    ) {
        var vm = this;
        var notifyStops = [];
        var notifyTourist = [];
        var options = configPromise;
        var updateWatch;
        var currentStop;

        vm.stops = stopsPromise;
        vm.touristSpots = options.tourist.enable ? touristPromise:[];
        vm.addStopProximityListener = addStopProximityListener;
        vm.toggleStopProximityListener = toggleStopProximityListener;
        vm.addTouristProximityListener = addTouristProximityListener;
        vm.toggleTouristProximityListener = toggleTouristProximityListener;
        vm.setPosition = setPosition;

        // Google Maps
        vm.stopsMarkers = [];
        vm.touristMarkers = [];
        vm.userMarker = {
            coords: {latitude: 0, longitude: 0},
            options: {icon: PERSON_ICON}
        };
        vm.map = {
            center: {latitude: 0, longitude: 0},
            zoom: 15
        };
        // Google Maps

        activate();

        function activate() {
            function mapSetup(){
                return uiGmapGoogleMapApi.then(function(maps) {
                    return setCurrentPosition();
                });
            };
            function setUpdateInterval() {
                updateWatch = $interval(notifyProximity, TRACKBUS.TIME_TO_UPDATE_STOPS);
                $scope.$on('$destroy', function() {
                    $interval.cancel(updateWatch);
                });
            };

            vm.stops = stopService.sortStops(vm.stops);
            return mapSetup().then(function(){
                setUpdateInterval();
                initializeStopsMarkers();
                initializeTouristMarkers();
                return spatialService.watchPosition(watchUserPosition);
            });
        };

        function getNextStop() {
            var stops = vm.stops.filter(function(s) {
                return Number(s.sequencia) === (Number(currentStop.sequencia) + 1);
            });
            return stopService.getClosestStop(stops, vm.userMarker.coords);
        };

        function setCurrentPosition(zoom) {
            return spatialService.getCurrentPosition().then(
                function success(result) {
                    var coords = {latitude: result.latitude, longitude: result.longitude};
                    setPosition(coords, zoom);
                },
                function error(result) {
                    console.error(result);
                    alertService.showAlert("Erro", ERROR_MESSAGES.NAVIGATOR_FAILURE);
                }
            );
        };

        function watchUserPosition(lat, lng){
            var coords = {latitude: lat, longitude: lng}
            if(!currentStop){
                currentStop = stopService.getClosestStop(vm.stops, coords);
                console.log(currentStop);
            }
            setUserPosition(coords);
            notifyProximity();
        };

        function setPosition(coords, zoom) {
            vm.map.refresh({latitude: coords.latitude, longitude: coords.longitude});
            if(zoom){
                vm.map.zoom = zoom;
            }
        };

        function setUserPosition(coords) {
            vm.userMarker.coords = coords;
        };

        function initializeStopsMarkers(){
            var result = [];
            vm.stopsMarkers = [];
            angular.forEach(vm.stops, function(stop) {
                result.push(new StopMarker(stop));
            });
            vm.stopsMarkers = result;
        };

        function initializeTouristMarkers(){
            var result = [];
            vm.touristMarkers = [];
            angular.forEach(vm.touristSpots, function(ts) {
                result.push(new TouristMarker(ts));
            });
            vm.touristMarkers = result;
        };

        function StopMarker(stop){
            //must contain latitude: Number, longitude: Number
            this.id = stop.sequencia;
            this.options = {icon: BUS_STOP_ICON};
            this.description = stop.descricao_ponto;
            this.distance = 0;
            this.coords = {
                latitude: stop.latitude,
                longitude: stop.longitude
            };
        };

        function TouristMarker(ts){
            //must contain latitude: Number, longitude: Number
            this.id = ts.nome;
            this.options = {icon: TOURIST_STOP_ICON};
            this.address = ts.endereco;
            this.distance = 0;
            this.coords = {
                latitude: ts.latitude,
                longitude: ts.longitude
            };
        };

        function indexOf(array, attr, value) {
            var index = -1;
            angular.forEach(array, function(element, key) {
                if(element[key] ==  value){
                    return index = key;
                }
            });
            return index;
        };

        function addProximityListener(array, value, message, notify) {
            if(array.contains(value)){
                return;
            }
            array.push(value);
            notifyProximity();
            if(notify){
                alertService.showAlert("Notificação", message);
            }
        };

        function removeProximityListener(array, attr, value, index) {
            var idx = index ? index:indexOf(array, attr, value);
            if(idx != -1){
                array.splice(idx, 1);
            }
        };

        function toggleProximityListener(array, attr, value) {
            var index = indexOf(array, attr, value);
            (index != -1) ? removeProximityListener(array, attr, value, index):addProximityListener(array, value);
        };

        function addStopProximityListener(stop, notify) {
            addProximityListener(notifyStops, stop, SUCCESS_MESSAGES.STOP_NOTIFICATION, notify);
        };

        function addTouristProximityListener(ts, notify) {
            addProximityListener(notifyStops, ts, SUCCESS_MESSAGES.TOURIST_NOTIFICATION, notify);
        };

        function removeStopProximityListener(stop, index) {
            removeProximityListener(notifyStops, "sequencia", stop.sequencia, index);
        };

        function removeTouristProximityListener(ts){
            removeProximityListener(notifyTourist, "id", ts.id, index);
        };

        function toggleStopProximityListener(stop){
           toggleProximityListener(notifyStops, "sequencia", stop.sequencia);
        };

        function toggleTouristProximityListener(ts) {
            toggleProximityListener(notifyTourist, "id", ts.id);
        };

        function notifyProximity() {
            var nextStop = getNextStop();
            if(!nextStop){
                return;
            }

            var distance = getDistance(nextStop);
            console.log("Notify: ", notifyStops);
            console.log("Current: ", currentStop);
            console.log("Next: ", nextStop);

            notifyTouristSpots(currentStop.pontos_turisticos);
            if(distance <= options.notification.stopDistance){
                debugger;
                if(indexOf(notifyStops, "description", nextStop.descricao_ponto) != -1){
                    nextStop.distance = distance;
                    notificationService.scheduleStopNotification(nextStop);
                    removeStopProximityListener(nextStop);
                    currentStop = nextStop;
                }
            }
        };

        function notifyTouristSpots(touristSpots) {
            function find(array, attr, value){
                var result;
                angular.forEach(array, function(e){
                    if(e[attr] === value){
                        return result = e;
                    }
                })
                return result;
            };

            var spot;
            angular.forEach(touristSpots, function(ts) {
                if(ts.distancia <= options.notification.touristDistance){
                    if(find(notifyTourist, "name", ts.name)){
                        spot = find(vm.touristSpots, "name", ts.name);
                        notificationService.scheduleTouristNotification(spot);
                    }
                }
            });

        };

        function getDistance(stop) {
            var _stop = angular.copy(stop);
            if(!_stop.coords){
                _stop.coords = {
                    latitude: _stop.latitude,
                    longitude: _stop.longitude
                }
            }
            return spatialService.getDistance(_stop.coords, vm.userMarker.coords);
        };
    };

})();