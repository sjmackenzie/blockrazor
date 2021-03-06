import { Template } from 'meteor/templating';
import { Redflags } from '../../../lib/database/Redflags.js';
import { WalletImages } from '../../../lib/database/Images.js';
import { Currencies } from '../../../lib/database/Currencies.js'
import { GraphData } from '../../../lib/database/GraphData.js'

Template.redflag.onCreated(function() {
  this.autorun(() => {
    this.subscribe('redflagcomments', this._id);
  })

  this.showingComments = new ReactiveDict()
});

Template.redflag.helpers({
  numComments: function() {
    return _.size(Redflags.find({parentId: this._id}).fetch());
  },
  starsid: function() {
    return "star-" + this._id
  },
  bountyamount: function () {
    return "<FIXME>"; //FIXME
  },
  parentId: function() {
    return this.parentId;
  },
  comments: function() { //return database showing comments with parent: this._id
    return Redflags.find({parentId: this._id, flagRatio: {$lt: 0.6}}, {sort: {rating: -1, appealNumber: -1}});
  }
});
Template.redflag.events({
  'click .fa-thumbs-down': function(event) {
    Meteor.call('redFlagVote', this._id, "down", function(error,result) {
      if(!error) {
        $(event.currentTarget).parent().html('<i class="fa fa-check" aria-hidden="true"></i>');
      } else {sAlert.error(error.reason)};
    });
  },
  'click .fa-thumbs-up': function(event) {
    Meteor.call('redFlagVote', this._id, "up", function(error,result) {
      if(!error) {
        $(event.currentTarget).parent().html('<i class="fa fa-check" aria-hidden="true"></i>');
      } else {sAlert.error(error.reason)};
    });
  },
  'mouseover .fa-thumbs-down': function() {
    $('.fa-thumbs-down').css('cursor', 'pointer');
  },
  'mouseover .fa-thumbs-up': function() {
    $('.fa-thumbs-up').css('cursor', 'pointer');
  },
  'mouseover .flag': function() {
    $('.flag').css('cursor', 'pointer');
  },
  'click .flag': function() {
    $('#flagModal-' + this._id).modal('show');
  },
  'click .flagButton': function() {
    $('#flagModal-' + this._id).modal('hide');
    Meteor.call('redflag', this._id, function(error, resonse) {
      if(!error){
        sAlert.success("Thanks for letting us know!");
      } else {
        sAlert.error(error.reason);
      }
    });
  },
  'click .submitNewComment': function () {
    if(!Meteor.user()) {
      sAlert.error("You must be logged in to comment!");
    }
    var data = $('#replyText-' + this._id).val();
    var ifnoterror = function(){
    }
    if(data.length < 6 || data.length > 140) {
      sAlert.error("That entry is too short, or too long.");
    } else {
      Meteor.call('redFlagNewComment', this._id, data, 1, function(error, result) {
        if(!error) {
          sAlert.success("Thanks! Your comment has been posted!");
        } else {
          sAlert.error(error.reason);
          return;
        }
      });
      $('#replyText-' + this._id).val(" ");
      $(".newcomment-" + this._id).hide();
      Cookies.set("submitted" + this._id, true);
      $(".commentParent-" + this._id).hide();
      Template.instance().showingComments.set(this._id, "false")
    }
  },
  'keyup .replyText': function() {
    $('.replyText').keyup(function () {
  var max = 140;
  var len = $(this).val().length;
  if (len >= max) {
    $('#replyCharNum' + this._id).text(' you have reached the limit');
  } else {
    var char = max - len;
    $("#replyCharNum" + this._id).text(char + ' characters left');
  }
});
  },
  'focus .replyText': function() {
    $(".replyFooter-" + this._id).show();
    $('#replyText-' + this._id).height(60);
    $('#replyText-' + this._id).attr("placeholder", "Comments should be friendly, useful to others, and factually correct. If you see bad behavior, don't encourage it by replying, simply flag it and move on.");
  },
  'click .comments': function() {
    if(Cookies.get("submitted" + this._id) != "true") {
    $(".newcomment-" + this._id).show();
  };
  if(Template.instance().showingComments.get(this._id) != "true") {
    $(".commentParent-" + this._id).show();
    Template.instance().showingComments.set(this._id, "true")
  } else {
    $(".commentParent-" + this._id).hide();
    Template.instance().showingComments.set(this._id, "false")
  }

  },
  'mouseover .comments': function() {
    $('.comments').css('cursor', 'pointer');
  },
  'mouseover .reply': function() {
  },
  'click .reply': function() {
    $("." + this._id).toggle();
  },
  'click .wymihelp': function() {
    $('#wymiModal').modal('show');
  },
  'mouseover .wymihelp': function() {
    $('.wymihelp').css('cursor', 'pointer');
  },
});



Template.redflags.onCreated(function(){
  this.showredflagged = new ReactiveVar(false)
  this.addingnewredflag = new ReactiveVar(false)
  this.lastId = new ReactiveVar('')

  this.autorun(() => {
    this.currencyId = (Currencies.findOne({ slug: FlowRouter.getParam("slug") }) || {})._id

    if (this.currencyId) {
      this.subscribe('redflags', this.currencyId)
    }
  })
});
Template.redflags.helpers({
  redflagDescription: function () {
    return this.featureTag; //find metricTag data from collection
  },
  redflags: function() {
  	console.log(Template.instance().currencyId)
    return Redflags.find({currencyId: Template.instance().currencyId, flagRatio: {$lt: 0.6}}, {sort: {rating: -1, appealNumber: -1}});
  },
  redflagsFlagged: function() {
    return Redflags.find({currencyId: Template.instance().currencyId, flagRatio: {$gt: 0.6}});
  }
});

Template.redflags.events({
  'click .showRedFlagged': function() {
    if(Template.instance().showredflagged.get() == false) {
      Template.instance().showredflagged.set(true);
      $('.showRedFlagged').text("Show");
    } else {
      Template.instance().showredflagged.set(false)
      $('.showRedFlagged').html("Hide");
    }
},
  'click .help': function() {
    $('#addFeatureModal').modal('show');
  },
  'mouseover .help': function() {
    $('.help').css('cursor', 'pointer');
  },
  'focus #featureName': function() {
    if(Cookies.get('addFeatureModal') != "true") {
      $('#addFeatureModal').modal('show');
      Cookies.set('addFeatureModal', true);
    }
  },
  'mouseover .currencyDetailBox': function() {
    if(_.size(Redflags.find({}).fetch()) == 0 && !Cookies.get('featureModal')) {
      $('#featureModal').modal('show');
      Cookies.set('featureModal', true);
    }
  },
  'keyup #featureName': function() {
    $('#featureName').keyup(function () {
  var max = 140;
  var len = $(this).val().length;
  if (len >= max) {
    $('#charNum').text(' you have reached the limit');
  } else {
    var char = max - len;
    $('#charNum').text(char + ' characters left');
  }
});
  },
  'click .submitRedFlag': function () {
    if(!Meteor.user()) {
      sAlert.error("You must be logged in to red flag a currency");
    }
    var data = $('#redflagContent').val();
    if(data.length < 6 || data.length > 140) {
      sAlert.error("That entry is too short, or too long.");
    } else {
      Meteor.call('newRedFlagMethod', this._id, data);
      $('#redflagContent').val(" ");
      $('#showAddNewRedflag').toggle();
      $('.redflagheading').text("Red Flag Currency");
      Template.instance().addingnewredflag.set(false);
      sAlert.success("Thanks! Red flag added");
    }
  },
  'click .showAddNewRedflag': function() {
    $('#showAddNewRedflag').toggle();
    if(!Template.instance().addingnewredflag.get()) {
      $('.redflagheading rating').text("Red Flag Currency");
      Template.instance().addingnewredflag.set(true);
    } else {
      $('.redflagheading rating').text("Red Flag");
      Template.instance().addingnewredflag.set(false);
    }
  },
  'click #name': function () {
    if(Template.instance().lastId.get()){document.getElementById(Template.instance().lastId.get()).style.display = "none";}
    document.getElementById(this._id).style.display = "block";
    Template.instance().lastId.set(this._id);


  }
});

Template.redflagComment.events({
  'click .flag': function() {
    $('#flagModal-' + this._id).modal('show');
  },
  'click .commentFlag': function() {
    $('#flagModal-' + this._id).modal('hide');
    Meteor.call('redflag', this._id, function(error, resonse) {
      if(!error){
        sAlert.success("Thanks for letting us know!");
      } else {
        sAlert.error(error.reason);
      }
    });
  }

});