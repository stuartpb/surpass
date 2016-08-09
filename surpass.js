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

  function stateMachine(initState) {
    var exitState = initState && initState();
    return function stateTransition(enterState) {
      if (exitState) exitState();
      exitState = enterState && enterState();
    };
  }

  function elementClassState(el, className) {
    return function addClass() {
      el.classList.add(className);
      return function removeClass() {
        el.classList.remove(className);
      };
    };
  }

  function invElementClassState(el, className) {
    return function removeClass() {
      el.classList.remove(className);
      return function addClass() {
        el.classList.add(className);
      };
    };
  }

  var teSurpassContainer = document.createElement('div');
  teSurpassContainer.className = namespaced('container');

  var teInputContainer = document.createElement('div');
  teInputContainer.className = namespaced('input-container');
  // the actual input gets added to the container in construction
  var teInputShroud = document.createElement('div');
  teInputShroud.className = namespaced('input-shroud');

  var teSurpassButton = document.createElement('button');
  var teMaskModeButton = teSurpassButton.cloneNode(teSurpassButton);
  teMaskModeButton.className = namespaced('button mask-button');
  var teExposeModeButton = teSurpassButton.cloneNode(teSurpassButton);
  teExposeModeButton.className = namespaced('button expose-button');
  teExposeModeButton.textContent =
    decodeURIComponent('%F0%9F%91%81%EF%B8%8E'); // eye
  var teShroudModeButton = teSurpassButton.cloneNode(teSurpassButton);
  teShroudModeButton.className = namespaced('button shroud-button');
  teShroudModeButton.textContent =
    decodeURIComponent("%E2%97%BC%EF%B8%8F"); // black square

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
    var mode = opts.mode ||
      baseInput.type == 'password' ? 'mask' : 'expose';

    function namedMode(name, substates) {
      function call(f) {
        return f && f();
      }
      return function() {
        mode = name;
        var substateExits = substates.map(call);
        return function exitSubstates() {
          return substateExits.forEach(call);
        };
      };
    }

    function setBaseInputType(type) {
      baseInput.type = type;
    }

    var container = teSurpassContainer.cloneNode(false);
    var inputContainer = teInputContainer.cloneNode(false);
    container.appendChild(inputContainer);

    var inputShroud = teInputShroud.cloneNode(false);
    var shroudModeButton = teShroudModeButton.cloneNode(true);

    var shroudActiveState = elementClassState(
      inputShroud, namespaced("input-shroud-active"));
    var shroudInactiveState = elementClassState(
      inputShroud, namespaced("input-shroud-inactive"));
    var emptyShroudClass = namespaced("input-shroud-empty");

    var shroudMode = namedMode('shroud', [
      shroudActiveState,
      setBaseInputType.bind(null,'password'),
      function () {
        for (var i = 0; i < 3; i++) {
          spots[i].className =
            namespaced('gross-simpl-spot gross-simpl-round gross-simpl-x' + i);
          spots[i].children[0].className = teGrossSimplShape.className;
        }
      }
    ]);
    var maskMode = namedMode('mask', [
      shroudInactiveState,
      setBaseInputType.bind(null,'password')
    ]);
    var exposeMode = namedMode('expose', [
      shroudInactiveState,
      setBaseInputType.bind(null,'text')
    ]);
    var surpassStateMachine = stateMachine(
      mode == 'shroud' ? shroudMode :
      mode == 'expose' ? exposeMode :
      maskMode);

    inputShroud.addEventListener('click', function(evt) {
      baseInput.focus();
    });

    shroudModeButton.addEventListener('click', function(evt) {
      if (mode == 'shroud') {
        surpassStateMachine(maskMode);
      } else {
        surpassStateMachine(shroudMode);
      }
      if (baseInput.value == '') {
        inputShroud.classList.add(emptyShroudClass);
      } else {
        inputShroud.classList.remove(emptyShroudClass);
      }
      baseInput.focus();
    });

    container.appendChild(shroudModeButton);

    var maskModeButton = teMaskModeButton.cloneNode(false);

    var spots = [];

    for (var i = 0; i < 3; i++) {
      spots[i] = teGrossSimplSpot.cloneNode(true);
      spots[i].className += ' ' + namespaced('gross-simpl-x' + i);
      maskModeButton.appendChild(spots[i]);
    }

    maskModeButton.addEventListener('click', function(evt) {
      surpassStateMachine(maskMode);
    });

    container.appendChild(maskModeButton);

    var exposeModeButton = teExposeModeButton.cloneNode(true);

    exposeModeButton.addEventListener('click', function(evt) {
      if (mode == 'expose') {
        surpassStateMachine(maskMode);
      } else {
        surpassStateMachine(exposeMode);
      }
    });

    container.appendChild(exposeModeButton);

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
      var value = baseInput.value;
      if (value == '') {
        inputShroud.classList.add(emptyShroudClass);
      } else {
        inputShroud.classList.remove(emptyShroudClass);
      }
      // TODO: get clever with animation / timeouts / modality respect
      if (mode != 'shroud') {
        updateGrossSimplification(baseInput.value);
      }
    });

    baseInput.addEventListener('focus', function(evt) {
      inputShroud.textContent = '|';
    });

    baseInput.addEventListener('blur', function(evt) {
      inputShroud.textContent = '';
    });

    baseInput.parentNode.replaceChild(container, baseInput);
    inputContainer.appendChild(baseInput);
    inputContainer.appendChild(inputShroud);
    return container;
  };
}));
