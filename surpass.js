(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.surpass = factory();
  }
}(this, function () {
  // http://www.isthe.com/chongo/tech/comp/fnv/index.html
  function fnv1a(bytes) {
    return bytes.reduce(function fnv1aCore(hash, byte) {
      hash ^= byte;
      // calculate hash * 16777619 in int32 high-end-overflow arithmetic,
      // instead of JS's native floating-point low-end-rounding arithmetic
      return hash + (hash << 1) + (hash << 4) +
        (hash << 7) + (hash << 8) + (hash << 24);
    }, 2166136261) >>> 0;
  }
  function utf8Bytes(str) {
    return unescape(encodeURIComponent(str)).split('').map(function (s) {
      return s.charCodeAt(0);
    });
  }
  function grossSimplify(str) {
    var hash = fnv1a(utf8Bytes(str));
    var high = hash >>> 16;
    var low = hash & 0xffff;
    return (high ^ low) % 144;
  }
  var colorSets = ['rgb', 'rbg', 'grb', 'gbr', 'brg', 'bgr'];
  var shapeSets = ['cts', 'cst', 'tcs', 'tsc', 'sct', 'stc'];
  var arrangements = ['t', 'r', 'b', 'l']; // clockwise from top aka CSS order
  function colorsShapesArrangement(grossIndex) {
    return {
      arrangement: arrangements[grossIndex % 4],
      colors: colorSets[(grossIndex / 4 | 0) % 6],
      shapes: shapeSets[grossIndex / 24 | 0]
    };
  }

  function namespaced(classNames) {
    if (!Array.isArray(classNames)) {
      classNames = classNames.split(/\s+/g);
    }
    return classNames.map(function(className) {
      return 'surpass_' + className;
    }).join(' ');
  }

  var teSurpassContainer = document.createElement('div');
  teSurpassContainer.className = namespaced('container');

  var teInputContainer = document.createElement('div');
  teInputContainer.className = namespaced('input-container');
  // the actual input gets added to the container in construction

  var teSurpassButton = document.createElement('button');
  var teMaskingButton = teSurpassButton.cloneNode(teSurpassButton);
  teMaskingButton.className = namespaced('button masking-button');
  var teUnmaskedButton = teSurpassButton.cloneNode(teSurpassButton);
  teUnmaskedButton.className = namespaced('button unmasked-button');
  teUnmaskedButton.textContent =
    decodeURIComponent('%F0%9F%91%81%EF%B8%8E'); // eye

  var teGrossSimplSpot = document.createElement('div');
  teGrossSimplSpot.className = namespaced(
    'gross-simpl-spot gross-simpl-round');
  var teGrossSimplShape = document.createElement('div');
  teGrossSimplShape.className = namespaced(
    'gross-simpl-shape gross-simpl-block gross-simpl-dot');
  teGrossSimplSpot.appendChild(teGrossSimplShape);

  return function surpass(baseInput, opts) {
    // TODO: verify that `baseInput` is, in fact, a (password) input
    opts = opts || {};
    opts.mode = opts.mode ||
      baseInput.type == 'password' ? 'masked' : 'clear';

    var container = teSurpassContainer.cloneNode(false);
    var inputContainer = teInputContainer.cloneNode(false);
    container.appendChild(inputContainer);

    var maskingButton = teMaskingButton.cloneNode(false);

    var spots = [];

    for (var i = 0; i < 3; i++) {
      spots[i] = teGrossSimplSpot.cloneNode(true);
      spots[i].className += ' ' + namespaced('gross-simpl-x' + i);
      maskingButton.appendChild(spots[i]);
    }

    maskingButton.addEventListener('click', function(evt) {
      baseInput.type = 'password';
    });

    container.appendChild(maskingButton);

    var unmaskedButton = teUnmaskedButton.cloneNode(true);

    unmaskedButton.addEventListener('click', function(evt) {
      baseInput.type = 'text';
    });

    container.appendChild(unmaskedButton);

    function updateGrossSimplification(value) {
      var csa = colorsShapesArrangement(grossSimplify(value));
      var posPrefix = 'gross-simpl-' + csa.arrangement;

      for (var i = 0; i < 3; i++) {
        var spotEl = spots[i];
        var shapeEl = spotEl.children[0];
        var color = csa.colors[i];
        var shape = csa.shapes[i];
        spotEl.className = namespaced(['gross-simpl-spot', posPrefix + i,
          shape == 'c' ? 'gross-simpl-round' : 'gross-simpl-pointy']);
        shapeEl.className = namespaced(['gross-simpl-shape',
          shape == 't' ? 'gross-simpl-tri' : 'gross-simpl-block',
          'gross-simpl-' + color]);
      }
    }

    baseInput.addEventListener('input', function(evt) {
      // TODO: get clever with animation / timeouts
      updateGrossSimplification(baseInput.value);
    });

    baseInput.parentNode.replaceChild(container, baseInput);
    inputContainer.appendChild(baseInput);
    return container;
  };
}));
