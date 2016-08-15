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

  function elementClassState(el, className) {
    return {
      enter: function addClass() {
        el.classList.add(className);
      },
      exit: function removeClass() {
        el.classList.remove(className);
      }
    };
  }

  var glyphs = {
    eye: decodeURIComponent("%F0%9F%91%81%EF%B8%8E"),
    blackSquare: decodeURIComponent("%E2%97%BC%EF%B8%8F"),
    check: decodeURIComponent("%E2%9C%94%EF%B8%8F"),
    rightTri: decodeURIComponent("%E2%96%B6%EF%B8%8F"),
    downTri: decodeURIComponent("%E2%96%BC"),
    notEqual: decodeURIComponent("%E2%89%A0"),
    arrows: decodeURIComponent("%E2%87%85")
  };

  var teSurpassContainer = document.createElement('div');
  teSurpassContainer.className = namespaced('container');

  var teSurpassRowContainer = document.createElement('div');
  teSurpassRowContainer.className = namespaced('row');

  var teInputContainer = document.createElement('div');
  teInputContainer.className = namespaced('input-container');
  // the actual input gets added to the container in construction
  var teInputShroud = document.createElement('div');
  teInputShroud.className = namespaced('input-shroud');

  var teBaseButton = document.createElement('button');
  teBaseButton.type = 'button';
  var teMaskModeButton = teBaseButton.cloneNode(false);
  teMaskModeButton.className = namespaced('mode-button mask-button');
  var teExposeModeButton = teBaseButton.cloneNode(false);
  teExposeModeButton.className = namespaced('mode-button expose-button');
  teExposeModeButton.textContent = glyphs.eye;
  var teShroudModeButton = teBaseButton.cloneNode(false);
  teShroudModeButton.className = namespaced('mode-button shroud-button');
  teShroudModeButton.textContent = glyphs.blackSquare;
  var teToggleDoubleButton = teBaseButton.cloneNode(false);
  var toggleButtonBaseClassName =
    namespaced('double-toggle-button check-state');
  teToggleDoubleButton.className = toggleButtonBaseClassName;

  var maskSpotClassPrefix = namespaced(
    'gross-simpl-spot gross-simpl-round gross-simpl-x');
  var maskDotShapeClassName = namespaced(
    'gross-simpl-shape gross-simpl-block gross-simpl-dot');

  var teGrossSimplSpot = document.createElement('div');
  var teGrossSimplShape = document.createElement('div');
  teGrossSimplShape.className = maskDotShapeClassName;
  teGrossSimplSpot.appendChild(teGrossSimplShape);

  function surpassifyInput(baseInput, opts, announceModeChange) {
    var container = teSurpassRowContainer.cloneNode(false);
    var inputContainer = teInputContainer.cloneNode(false);
    container.appendChild(inputContainer);

    var inputShroud = teInputShroud.cloneNode(false);
    var shroudModeButton = teShroudModeButton.cloneNode(true);

    var shroudActiveState = elementClassState(
      inputShroud, namespaced("input-shroud-active"));
    var shroudInactiveState = elementClassState(
      inputShroud, namespaced("input-shroud-inactive"));
    var emptyShroudClass = namespaced("input-shroud-empty");

    var maskedTypingClassName = namespaced("mask-button-typing");

    var maskModeButton = teMaskModeButton.cloneNode(false);

    var spots = [];
    for (var i = 0; i < 3; i++) {
      spots[i] = teGrossSimplSpot.cloneNode(true);
      spots[i].className = maskSpotClassPrefix + i;
      maskModeButton.appendChild(spots[i]);
    }

    function setMaskButtonDots() {
      for (var i = 0; i < 3; i++) {
        spots[i].className = maskSpotClassPrefix + i;
        spots[i].children[0].className = maskDotShapeClassName;
      }
    }

    function updateGrossSimplification() {
      var value = baseInput.value;

      // don't display the empty-string simplification
      if (value == '') {
        return setMaskButtonDots();
      }

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

    var typingWait = opts.typingWait;
    var grossSimplificationTimeout = null;
    function stopGrossSimplificationTimeout() {
      if (grossSimplificationTimeout) {
        maskModeButton.classList.remove(maskedTypingClassName);
        clearTimeout(grossSimplificationTimeout);
        grossSimplificationTimeout = null;
      }
    }
    function finishGrossSimplificationTimeout() {
      maskModeButton.classList.remove(maskedTypingClassName);
      grossSimplificationTimeout = null;
      updateGrossSimplification();
    }
    function bumpGrossSimplificationTimeout() {
      if (grossSimplificationTimeout) {
        clearTimeout(grossSimplificationTimeout);
      } else {
        setMaskButtonDots();
        maskModeButton.classList.add(maskedTypingClassName);
      }
      grossSimplificationTimeout = setTimeout(
        finishGrossSimplificationTimeout, typingWait);
    }

    function setBaseInputTypeState(type) {
      return {enter: function() {
        baseInput.type = type;
      }};
    }

    function updateShroudEmptiness() {
      if (baseInput.value == '') {
        inputShroud.classList.add(emptyShroudClass);
      } else {
        inputShroud.classList.remove(emptyShroudClass);
      }
    }

    var modeSubstates = {
      shroud: [
        shroudActiveState,
        setBaseInputTypeState('password'),
        {enter: setMaskButtonDots},
        {enter: stopGrossSimplificationTimeout},
        {enter: updateShroudEmptiness}
      ],
      mask: [
        shroudInactiveState,
        setBaseInputTypeState('password'),
        {enter: function () {
          if (mode == 'shroud' && baseInput.value != '') {
            bumpGrossSimplificationTimeout();
          }
        }}
      ],
      expose: [
        shroudInactiveState,
        setBaseInputTypeState('text'),
        {enter: stopGrossSimplificationTimeout},
        {enter: updateGrossSimplification}
      ]
    };
    var mode;
    function setMode(newMode) {
      var i;
      function runOrNop(f) {
        if (f) f();
      }
      if (mode) {
        var oldSubstates = modeSubstates[mode];
        for (i = 0; i < oldSubstates.length; i++) {
          runOrNop(oldSubstates[i].exit);
        }
      }
      var newSubstates = modeSubstates[newMode];
      for (i = 0; i < newSubstates.length; i++) {
        runOrNop(newSubstates[i].enter);
      }
      mode = newMode;
    }
    setMode(opts.mode);

    inputShroud.addEventListener('click', function(evt) {
      baseInput.focus();
    });

    // Inserting the original input is deferred until after construction,
    // so that it may retain its position in the document until the final
    // constructed container is ready to be inserted in its place.
    // Once the baseInput is replaced, it can finally be prepended into
    // this container; until then, we just append the shroud.
    inputContainer.appendChild(inputShroud);

    shroudModeButton.addEventListener('click', function(evt) {
      announceModeChange(mode == 'shroud' ? 'mask' : 'shroud');
      baseInput.focus();
    });

    container.appendChild(shroudModeButton);

    maskModeButton.addEventListener('click', function(evt) {
      announceModeChange('mask');
    });

    container.appendChild(maskModeButton);

    var exposeModeButton = teExposeModeButton.cloneNode(true);

    exposeModeButton.addEventListener('click', function(evt) {
      announceModeChange(mode == 'expose' ? 'mask' : 'expose');
    });

    container.appendChild(exposeModeButton);

    baseInput.addEventListener('input', function(evt) {
      updateShroudEmptiness();
      if (mode == 'mask') {
        if (baseInput.value != '') {
          bumpGrossSimplificationTimeout();
        } else {
          stopGrossSimplificationTimeout();
          setMaskButtonDots();
        }
      } else if (mode == 'expose') {
        // update gross simplification without delay when exposing
        updateGrossSimplification();
      }
    });

    baseInput.addEventListener('focus', function(evt) {
      inputShroud.textContent = '|';
    });

    baseInput.addEventListener('blur', function(evt) {
      inputShroud.textContent = '';
    });

    return {
      container: container,
      inputContainer: inputContainer,
      setMode: setMode
    };
  }

  function doubleSurpassify(baseInput, opts) {
    var baseRow, checkRow;
    function setModeBothRows(mode) {
      baseRow.setMode(mode);
      checkRow.setMode(mode);
    }

    var checkInput = document.createElement('input');

    // will be inverted again for first update
    var doubleChecking = !opts.double;

    checkInput.type = baseInput.type;
    baseRow = surpassifyInput(baseInput, opts, setModeBothRows);
    checkRow = surpassifyInput(checkInput, opts, setModeBothRows);
    checkRow.container.classList.add(namespaced('check-row'));

    // TODO: make these configurable etc.
    var checkMessages = {
      available:
        [glyphs.rightTri, glyphs.check, glyphs.check, '?'].join(' '),
      prompting:
        [glyphs.downTri, glyphs.arrows, '_'].join(' '),
      unmatching:
        [glyphs.downTri, glyphs.arrows, glyphs.notEqual].join(' '),
      matching:
        [glyphs.downTri, glyphs.arrows, '='].join(' ')
    };

    var toggleButton = teToggleDoubleButton.cloneNode(false);
    function setDoubleCheckState(stateName) {
      toggleButton.textContent = checkMessages[stateName];
      toggleButton.className = toggleButtonBaseClassName + ' ' +
        namespaced('check-' + stateName);
    }
    function updateDoubleCheckState() {
      if (doubleChecking) {
        var checkValue = checkInput.value;
        var baseValue = baseInput.value;
        if (checkValue == '') {
          setDoubleCheckState('prompting');
        } else if (baseValue == checkValue) {
          setDoubleCheckState('matching');
        } else {
          setDoubleCheckState('unmatching');
        }
      }
    }
    baseInput.addEventListener('input', updateDoubleCheckState);
    checkInput.addEventListener('input', updateDoubleCheckState);
    function toggleDoubleChecking() {
      doubleChecking = !doubleChecking;
      if (doubleChecking) {
        checkRow.container.hidden = false;
        // TODO: clear previous checked value?
        updateDoubleCheckState();
      } else {
        checkRow.container.hidden = true;
        setDoubleCheckState('available');
      }
    }
    toggleButton.addEventListener('click', toggleDoubleChecking);
    toggleDoubleChecking();

    var container = teSurpassContainer.cloneNode(false);
    container.appendChild(baseRow.container);
    container.appendChild(toggleButton);
    container.appendChild(checkRow.container);

    baseInput.parentNode.replaceChild(container, baseInput);
    baseRow.inputContainer.insertBefore(baseInput,
      baseRow.inputContainer.firstChild);
    checkRow.inputContainer.insertBefore(checkInput,
      checkRow.inputContainer.firstChild);

    return container;
  }

  function singleSurpassify(baseInput, opts) {
    var baseRow;
    function propogateModeBack(mode) {
      return baseRow.setMode(mode);
    }
    baseRow = surpassifyInput(baseInput, opts, propogateModeBack);
    baseInput.parentNode.replaceChild(baseRow.container, baseInput);
    baseRow.inputContainer.insertBefore(baseInput,
      baseRow.inputContainer.firstChild);
    return baseRow.container;
  }

  return function surpass(baseInput, optObj) {
    // TODO: verify that `baseInput` is, in fact, a (password) input
    function intOrDefault(x, def) {
      x = parseInt(x, 10);
      return x === 0 ? 0 : x || def;
    }
    var opts = {
      mode: optObj && optObj.mode ||
        baseInput.type == 'password' ? 'mask' : 'expose',
      forceSingle: optObj && optObj.forceSingle,
      double: optObj && optObj.double,
      typingWait: intOrDefault(optObj && optObj.typingWait, 500)
    };
    if (opts.forceSingle) {
      return singleSurpassify(baseInput, opts);
    } else {
      return doubleSurpassify(baseInput, opts);
    }
  };
}));
