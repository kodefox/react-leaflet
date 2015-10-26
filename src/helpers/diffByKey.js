function diffByKey(oldItems, newItems) {
  var toRemove = [];
  var toAdd = [];
  var toUpdate = [];
  Object.keys(oldItems).forEach((key) => {
    if (newItems.hasOwnProperty(key)) {
      toUpdate.push(key);
    } else {
      toRemove.push(key);
    }
  });
  Object.keys(newItems).forEach((key) => {
    if (!oldItems.hasOwnProperty(key)) {
      toAdd.push(key);
    }
  });
  return {toRemove, toAdd, toUpdate};
}

module.exports = diffByKey;
