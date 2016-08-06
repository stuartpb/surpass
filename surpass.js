(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.surpass = factory();
  }
}(this, function () {

  // prime and offset for 32-bit FNV-1
  // http://www.isthe.com/chongo/tech/comp/fnv/index.html
  var fnv1Prime = 16777619;
  var fnv1OffsetBasis = 2166136261;
  function fnv1a(bytes) {
    return bytes.reduce(function fnv1aCore(hash, byte) {
      return (hash ^ byte) * fnv1Prime;
    }, fnv1OffsetBasis) >>> 0;
  }
  function utf8Bytes(str) {
    return unescape(encodeURIComponent(str)).split('').map(function (s) {
      return s.charCodeAt(0);
    });
  }
  function grossSimplify(str) {
    return fnv1a(utf8Bytes(str)) % 144;
  }
  var colorSets = ['rby', 'ryb', 'bry', 'byr', 'yrb', 'ybr'];
  var shapeSets = ['cts', 'cst', 'tcs', 'tsc', 'sct', 'stc'];
  var arrangements = ['t', 'r', 'b', 'l']; // clockwise from top aka CSS order
  function colorsShapesArrangement(grossIndex) {
    return {
      arrangement: arrangements[grossIndex % 4],
      colors: colorSets[(grossIndex / 4 | 0) % 6],
      shapes: shapeSets[grossIndex / 24 | 0]
    };
  }

  // positions for shapes to move to, from left to right,
  // by quarters of the available dimensions
  var arrPositions = {
    t: [[1,3], [2,1], [3,3]],
    r: [[1,1], [1,3], [3,2]],
    b: [[1,1], [2,3], [3,1]],
    l: [[1,2], [3,1], [3,3]]
  }

  var eqTriHeight = Math.sqrt(3)/2;
  var triHeightCompensation = (1 - eqTriHeight) / 2;

  var dotTransform = 'scale(0.5)';

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
  teUnmaskedButton.textContent = decodeURIComponent('%F0%9F%91%81'); // eye

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
      spots[i].style.transform = 'translate(-50%, -50%) ' + dotTransform;
      spots[i].className += ' ' + namespaced('gross-simpl-pos'+(i+1));
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
      var positions = arrPositions[csa.arrangement];

      var xq = maskingButton.clientWidth / 4;
      var yq = maskingButton.clientHeight / 4;

      for (var i = 0; i < 3; i++) {
        var spotEl = spots[i];
        var shapeEl = spotEl.children[0];
        var pos = positions[i];
        var color = csa.colors[i];
        var shape = csa.shapes[i];
        var spotW = spotEl.clientWidth;
        var x = xq * pos[0] - spotW / 2;
        var y = yq * pos[1] - spotW / 2;
        if (shape == 't') {
          y += spotW * triHeightCompensation;
        }
        spotEl.style.transform = 'translate(' + x + 'px,' + y + 'px)';
        spotEl.className = namespaced(['gross-simpl-spot',
          'gross-simpl-pos0',
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