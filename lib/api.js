 import { UserData } from './database/UserData.js';

 if (Meteor.isClient) {
     //subscribe on all views not on a template by template basis
     Meteor.subscribe('isModerator');

     //Global helpers
     Template.registerHelper('isModerator', function() {
         return UserData.findOne({ _id: Meteor.userId }, { fields: { moderator: true } }).moderator;
     });


 }

 br = (function() {
     var api = {};

     api.isModerator = function() {
         var data = UserData.findOne({ _id: Meteor.userId() });
         if (data) {
             return data.moderator;
         }
     };

     return api;
 }());