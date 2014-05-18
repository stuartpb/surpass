(function(root){
  var surpass = {};

  function twiddlify(value, andmask, ormask, factor) {
    return (value * (factor || 1)) & (andmask || 0xffffffff) | (ormask || 0);
  }

  function colorizer(andmask, ormask, factor) {
    andmask = andmask | 0xffffff;
    return function(value) {
      var color = twiddlify(value, andmask, ormask, factor).toString(16);
      return '#000000'.slice(0, 7-color.length) + color;
    };
  }
  surpass.twiddlify = twiddlify;
  surpass.colorizer = colorizer;
  root.surpass = surpass;
})(typeof module != 'undefined' ? module.exports : window);
