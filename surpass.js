(function(root){
  var surpass = {};

  function twiddlify(value, andmask, ormask, factor) {
    return (value * (factor || 1)) & (andmask || 0xffffffff) | (ormask || 0);
  }

  function colorTwiddler(andmask, ormask, factor) {
    andmask = andmask & 0xffffff;
    return function twiddler(value) {
      var color = twiddlify(value, andmask, ormask, factor).toString(16);
      return '#000000'.slice(0, 7-color.length) + color;
    };
  }

  function twiddlingColorExtractor(twiddler) {
    return function (hash, i) {
      return twiddler(hash.slice(i*6, (i+1)*6));
    };
  }

  function barColorizer(bars, extractor) {
    return function (hash) {
      for (var i = 0; i < bars.length; i++) {
        bars[i].style.backgroundColor = extractor(hash, i);
      }
    };
  }

  function makeBars(n) {
    var bars = [];
    var bar = document.createElement('div');
    bar.style.height = '100%';
    bar.style.width = 100 / n + '%';
    bars[0] = bar;
    for (var i = 1; i < n; i++) {
      bars[i] = bar.cloneNode(false);
    }
    return bars;
  }

  function surpassify(input){
    var sroot = input.createShadowRoot();
    var ie = document.createElement('shadow');
    sroot.appendChild(ie);
    console.log(sroot);
  }

  surpass.twiddlify = twiddlify;
  surpass.colorTwiddler = colorTwiddler;
  surpass.twiddlingColorExtractor = twiddlingColorExtractor;
  surpass.barColorizer = barColorizer;
  surpass.surpassify = surpassify;
  root.surpass = surpass;
})(typeof module != 'undefined' ? module.exports : window);
