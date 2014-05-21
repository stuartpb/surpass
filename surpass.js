(function(root){
  var surpass = {};

  function twiddlify(value, andmask, ormask, factor) {
    return (value * (factor || 1)) & (andmask || 0xffffffff) | (ormask || 0);
  }

  function colorTwiddler(andmask, ormask, factor) {
    andmask = andmask & 0xffffff;
    return function(value) {
      var color = twiddlify(value, andmask, ormask, factor).toString(16);
      return '#000000'.slice(0, 7-color.length) + color;
    };
  }

  function barColorizer(bars, toColor) {
    return function(hash) {
      for (var i=0; i < bars.length; i++) {
        bars[i].style.backgroundColor = toColor(hash.slice(i*6, (i+1)*6));
      }
    };
  }

  surpass.twiddlify = twiddlify;
  surpass.colorTwiddler = colorTwiddler;
  surpass.barColorizer = barColorizer;
  root.surpass = surpass;
})(typeof module != 'undefined' ? module.exports : window);
