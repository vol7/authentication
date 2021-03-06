'use strict';

module.exports = function (app) {
  return function (entity) {
    var authConfig = app.get('auth');
    var idField = app.service(authConfig.service).id;

    if (!idField) {
      console.error('The adapter for the ' + authConfig.service + ' service does not add an `id` property to the service.  It needs to be updated to do so.');
      idField = entity.hasOwnProperty('id') ? 'id' : '_id';
    }

    var entityId = entity[idField];
    var socketMap = void 0;

    if (app.io) {
      socketMap = app.io.sockets.sockets;
    }
    if (app.primus) {
      socketMap = app.primus.connections;
    }

    Object.keys(socketMap).forEach(function (socketId) {
      var socket = socketMap[socketId];
      var feathers = socket.feathers || socket.request.feathers;
      var socketEntity = feathers && feathers[authConfig.entity];

      if (socketEntity) {
        var socketEntityId = socketEntity[idField];

        if ('' + entityId === '' + socketEntityId) {
          // Need to assign because of external references
          // Object.assign(socketEntity, theObject);

          // Delete any removed entity properties
          var entityProps = new Set(Object.keys(entity));
          Object.keys(entity).filter(function (prop) {
            return !entityProps.has(prop);
          }).forEach(function (prop) {
            return delete entity[prop];
          });
        }
      }
    });
  };
};