var store, adapter;
var Person;

module("Attribute Changes and Dirtiness", {
  setup: function() {
    adapter = DS.Adapter.create();

    store = DS.Store.create({
      adapter: adapter
    });

    Person = DS.Model.extend({
      firstName: DS.attr('string')
    });
  }
});

test("By default, if a record's attribute is changed, it becomes dirty", function() {
  store.load(Person, { id: 1, firstName: "Yehuda" });
  var wycats = store.find(Person, 1);

  wycats.set('firstName', "Brohuda");

  ok(wycats.get('isDirty'), "record has become dirty");
});

test("By default, a newly created record is dirty", function() {
  var wycats = store.createRecord(Person);

  ok(wycats.get('isDirty'), "record is dirty");
});

test("By default, changing the relationship between two records does not cause them to become dirty", function() {
  adapter.dirtyRecordsForHasManyChange = Ember.K;
  adapter.dirtyRecordsForBelongsToChange = Ember.K;

  var Post = DS.Model.extend();

  var Comment = DS.Model.extend({
    post: DS.belongsTo(Post)
  });

  Post.reopen({
    comments: DS.hasMany(Comment)
  });

  store.load(Post, { id: 1, comments: [1] });
  store.load(Comment, { id: 1, post: 1 });

  var post = store.find(Post, 1);
  var comment = store.find(Comment, 1);

  comment.set('post', null);

  ok(!post.get('isDirty'), "post should not be dirty");
  ok(!comment.get('isDirty'), "comment should not be dirty");
});

test("By default, changing a one-to-one relationship causes both records to become dirty", function() {
  var Post = DS.Model.extend();

  var Attachment = DS.Model.extend({
    post: DS.belongsTo(Post)
  });

  Post.reopen({
    attachment: DS.hasOne(Attachment)
  });

  store.load(Post, { id: 1, comments: [1] });
  store.load(Attachment, { id: 1, post: 1 });

  var post = store.find(Post, 1);
  var attachment = store.find(Attachment, 1);

  attachment.set('post', null);

  ok(post.get('isDirty'), "post should be dirty");
  ok(attachment.get('isDirty'), "attachment should be dirty");
});

test("If dirtyRecordsForAttributeChange does not add the record to the dirtyRecords set, it does not become dirty", function() {
  store.load(Person, { id: 1, firstName: "Yehuda" });
  var wycats = store.find(Person, 1);

  adapter.dirtyRecordsForAttributeChange = function(dirtyRecords, changedRecord, attributeName) {
    equal(changedRecord, wycats, "changed record is passed to hook");
    equal(attributeName, "firstName", "attribute name is passed to hook");
  };

  wycats.set('firstName', "Brohuda");

  ok(!wycats.get('isDirty'), "the record is not dirty despite attribute change");
});

test("If dirtyRecordsForAttributeChange adds the record to the dirtyRecords set, it becomes dirty", function() {
  store.load(Person, { id: 1, firstName: "Yehuda" });
  var wycats = store.find(Person, 1);

  adapter.dirtyRecordsForAttributeChange = function(dirtyRecords, changedRecord, attributeName) {
    equal(changedRecord, wycats, "changed record is passed to hook");
    equal(attributeName, "firstName", "attribute name is passed to hook");
    dirtyRecords.add(changedRecord);
  };

  wycats.set('firstName', "Brohuda");

  ok(wycats.get('isDirty'), "the record is dirty after attribute change");
});

test("If dirtyRecordsForAttributeChange adds a different record than the changed record to the dirtyRecords set, the different record becomes dirty", function() {
  store.load(Person, { id: 1, firstName: "Yehuda" });
  store.load(Person, { id: 2, firstName: "Tom" });
  var wycats = store.find(Person, 1);
  var tomdale = store.find(Person, 2);

  adapter.dirtyRecordsForAttributeChange = function(dirtyRecords, changedRecord, attributeName) {
    equal(changedRecord, wycats, "changed record is passed to hook");
    equal(attributeName, "firstName", "attribute name is passed to hook");
    dirtyRecords.add(tomdale);
  };

  wycats.set('firstName', "Brohuda");

  ok(tomdale.get('isDirty'), "the record is dirty after attribute change");
  ok(!wycats.get('isDirty'), "the record is not dirty after attribute change");
});

test("If dirtyRecordsForAttributeChange adds two records to the dirtyRecords set, both become dirty", function() {
  store.load(Person, { id: 1, firstName: "Yehuda" });
  store.load(Person, { id: 2, firstName: "Tom" });
  var wycats = store.find(Person, 1);
  var tomdale = store.find(Person, 2);

  adapter.dirtyRecordsForAttributeChange = function(dirtyRecords, changedRecord, attributeName) {
    equal(changedRecord, wycats, "changed record is passed to hook");
    equal(attributeName, "firstName", "attribute name is passed to hook");
    dirtyRecords.add(tomdale);
    dirtyRecords.add(wycats);
  };

  wycats.set('firstName', "Brohuda");

  ok(tomdale.get('isDirty'), "the record is dirty after attribute change");
  ok(wycats.get('isDirty'), "the record is dirty after attribute change");
});
