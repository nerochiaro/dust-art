Submissions = new Mongo.Collection("submissons");

var icons = { "installation" : "cubes",
               "performance" : "music",
               "workshop" : "university",
               "car" : "car" }

if (Meteor.isClient) {
  Router.route('/', function() { this.render('main') });

  Template.main.rendered = function() {
    $("#show-only-funded").checkbox("setting", {
      onChange: function()  {
        Session.set('show-only-funded', $("#show-only-funded").prop("checked"))
      }
    });

    $("#show-email-list").checkbox("setting", {
      onChange: function()  {
        Session.set('show-email-list', $("#show-email-list").prop("checked"))
      }
    });
  }

  Template.submissions.helpers({
    submissions: function () {
      var sortField = Session.get("submissions-sort-field") || "art_type";
      var sortDirection = Session.get("submissions-sort-direction") || 1;
      var sort = {};
      sort[sortField] = sortDirection;

      var and = [];
      var hidden = Session.get('art-type-hidden') || [];
      if (hidden.length > 0) and.push({art_type: { $not: { $in: hidden} }});

      if (Session.get('show-only-funded')) and.push({fund_request: {$gt: 0}})

      var query = (and.length > 0) ? {$and: and} : {};

      return Submissions.find(query, {sort: sort});
    },
    showEmailList: function() { return Session.get('show-email-list') }
  });

  Template.artTypeSelector.helpers({
    isDisabled: function(args) {
      var hidden = Session.get('art-type-hidden') || [];
      return (_.indexOf(hidden, args.hash.type) == -1) ? "" : "basic";
    }
  })

  Template.artTypeSelector.events({
    'click div': function(event) {
      var hidden = Session.get("art-type-hidden") || [];
      var type = $(event.currentTarget).attr('art-type');
      if (_.indexOf(hidden, type) == -1) hidden.push(type);
      else hidden = _.without(hidden, type)
      Session.set("art-type-hidden", hidden);
    }
  })

  Template.sortHeader.helpers({
    sortIcon: function(args) {
      if (args.hash.field == Session.get("submissions-sort-field")) {
        return (Session.get("submissions-sort-direction") == 1) ? "up arrow" : "down arrow"
      } else return ""
    }
  });

  Template.sortHeader.events({
    'click th': function(event) {
      var field = $(event.currentTarget).attr("sort-field");
      if (!field) return;
      if (Session.get("submissions-sort-field") == field) {
        Session.set("submissions-sort-direction", Session.get("submissions-sort-direction") * -1);
      } else {
        Session.set("submissions-sort-field", field);
        Session.set("submissions-sort-direction", 1);
      }
    }
  });

  Template.submission.helpers({
    selected: function () {
      return Session.equals("selectedSubmission", this._id) ? "selected" : '';
    },
    anchor: function () { return this._id.split("_")[1].replace(".json", "") },
    icon: function () { return icons[this.art_type] },
    isFunded: function() { return this.art_funding == "yes" },
    logistics: function() {
      switch (this.art_type) {
      case "installation": return this.install_size_x + "x" + this.install_size_y + "x" + this.install_height + "m" +
                                  (this.install_power_watts ? " / " + this.install_power_watts + "W" : "");
      case "workshop":
      case "performance": return this.performance_duration + ", " + this.performance_frequency
      default: ""
      }
    }
  });

  Template.submissions.rendered = function() {
    $("#show-email-list").checkbox("setting", {
      onChange: function()  {
        Session.set('show-email-list', $("#show-email-list").prop("checked"))
      }
    })
  }

  Template.emailList.helpers({
    emails: function() {
      return this.map(function(s) {
        return '"' + s.contact_name + '" <' + s.contact_email + '>'
      }).join(", ");
    }
  })

  Template.fullSubmission.helpers({
    icon: function () { return icons[this.art_type] },
    anchor: function () { return this._id.split("_")[1].replace(".json", "") },

    isFunded: function() { return this.art_funding == "yes" },
    hasAnyPlus: function() { return this.fund_plus_green.length > 0 ||
                                    this.fund_plus_awareness.length > 0 ||
                                    this.fund_plus_participation.length > 0 },
    hasAnyPlans: function() { return this.fund_plan_a.length > 0 ||
                                     this.fund_plan_b.length > 0 },
    budgetAmount: function() {
      if (this.art_funding == "yes") {
        var tot = parseInt(this.fund_total, 10);
        var req = parseInt(this.fund_request, 10);
        var per = Math.round((req * 100) / tot);

        return this.fund_request + "€ of " + this.fund_total + "€ (" + per + "%)";
      } else return 0;
    },
    budgetExtra: function() { return (this.art_funding !== "yes") ? "" :
                                      (parseInt(this.fund_total, 10) - parseInt(this.fund_request, 10)) + "€" },
    hasExtra: function() { return this.art_funding == "yes" &&
                                  parseInt(this.fund_total, 10) - parseInt(this.fund_request, 10) > 0 },
    extraWarning: function() { return (parseInt(this.fund_total, 10) - parseInt(this.fund_request, 10) > 0 &&
                                       this.fund_raise.length == 0) ? "warning sign" : "" },
    overview: function() {
      return { "installation" : this.install_overview,
               "performance" : this.performance_overview }[this.art_type] || "";
    }
  })
}
