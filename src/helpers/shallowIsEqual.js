function shallowIsEqual(oldObject, newObject) {
  var oldKeys = Object.keys(oldObject);
  var newKeys = Object.keys(newObject);
  if (newKeys.length !== oldKeys.length) {
    return false;
  }
  for (var i = 0; i < newKeys.length; i++) {
    var key = newKeys[i];
    if (newObject[key] !== oldObject[key]) {
      return false;
    }
  }
  return true;
}

module.exports = shallowIsEqual;
