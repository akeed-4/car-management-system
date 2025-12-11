import {
  TransferState,
  makeStateKey
} from "./chunk-ZODU344J.js";
import {
  Deferred,
  _extends,
  callbacks_default,
  camelize,
  dependency_injector_default,
  each,
  equalByValue,
  errors_default,
  extend,
  extendFromObject,
  init_callbacks,
  init_common,
  init_deferred,
  init_dependency_injector,
  init_errors,
  init_extend,
  init_extends,
  init_inflector,
  init_iterator,
  init_type,
  isDefined,
  isFunction,
  isNumeric,
  isObject,
  isPlainObject,
  isRenderer,
  isString,
  isWindow,
  noop,
  type
} from "./chunk-6XC77YAX.js";
import {
  DOCUMENT,
  XhrFactory,
  isPlatformServer
} from "./chunk-JMWJDSKO.js";
import {
  Component,
  Directive,
  ElementRef,
  EventEmitter,
  Inject,
  Injectable,
  Input,
  IterableDiffers,
  NgModule,
  NgZone,
  Optional,
  PLATFORM_ID,
  Renderer2,
  TemplateRef,
  VERSION,
  ViewContainerRef,
  setClassMetadata,
  ɵɵInheritDefinitionFeature,
  ɵɵNgOnChangesFeature,
  ɵɵdefineComponent,
  ɵɵdefineDirective,
  ɵɵdefineInjectable,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdirectiveInject,
  ɵɵgetInheritedFactory,
  ɵɵinject,
  ɵɵsetNgModuleScope
} from "./chunk-F43I5743.js";

// node_modules/devextreme/esm/core/dom_adapter.js
init_dependency_injector();
init_common();

// node_modules/devextreme/esm/core/utils/shadow_dom.js
var DX_RULE_PREFIX = "dx-";
var ownerDocumentStyleSheet = null;
function createConstructedStyleSheet(rootNode) {
  try {
    return new CSSStyleSheet();
  } catch (err) {
    var styleElement = rootNode.ownerDocument.createElement("style");
    rootNode.appendChild(styleElement);
    return styleElement.sheet;
  }
}
function processRules(targetStyleSheet, styleSheets, needApplyAllStyles) {
  for (var i = 0; i < styleSheets.length; i++) {
    var sheet = styleSheets[i];
    try {
      for (var j = 0; j < sheet.cssRules.length; j++) {
        insertRule(targetStyleSheet, sheet.cssRules[j], needApplyAllStyles);
      }
    } catch (err) {
    }
  }
}
function insertRule(targetStyleSheet, rule, needApplyAllStyles) {
  var _rule$selectorText, _rule$cssRules, _rule$cssRules$, _rule$cssRules$$selec, _rule$name, _rule$style;
  var isDxRule = needApplyAllStyles || (null === (_rule$selectorText = rule.selectorText) || void 0 === _rule$selectorText ? void 0 : _rule$selectorText.includes(DX_RULE_PREFIX)) || (null === (_rule$cssRules = rule.cssRules) || void 0 === _rule$cssRules ? void 0 : null === (_rule$cssRules$ = _rule$cssRules[0]) || void 0 === _rule$cssRules$ ? void 0 : null === (_rule$cssRules$$selec = _rule$cssRules$.selectorText) || void 0 === _rule$cssRules$$selec ? void 0 : _rule$cssRules$$selec.includes(DX_RULE_PREFIX)) || (null === (_rule$name = rule.name) || void 0 === _rule$name ? void 0 : _rule$name.startsWith(DX_RULE_PREFIX)) || "DXIcons" === (null === (_rule$style = rule.style) || void 0 === _rule$style ? void 0 : _rule$style.fontFamily);
  if (isDxRule) {
    targetStyleSheet.insertRule(rule.cssText, targetStyleSheet.cssRules.length);
  }
}
function addShadowDomStyles($element) {
  var _el$getRootNode;
  var el = $element.get(0);
  var root = null === (_el$getRootNode = el.getRootNode) || void 0 === _el$getRootNode ? void 0 : _el$getRootNode.call(el);
  if (!(null !== root && void 0 !== root && root.host)) {
    return;
  }
  if (!ownerDocumentStyleSheet) {
    ownerDocumentStyleSheet = createConstructedStyleSheet(root);
    processRules(ownerDocumentStyleSheet, el.ownerDocument.styleSheets, false);
  }
  var currentShadowDomStyleSheet = createConstructedStyleSheet(root);
  processRules(currentShadowDomStyleSheet, root.styleSheets, true);
  root.adoptedStyleSheets = [ownerDocumentStyleSheet, currentShadowDomStyleSheet];
}
function isPositionInElementRectangle(element, x, y) {
  var _element$getBoundingC;
  var rect = null === (_element$getBoundingC = element.getBoundingClientRect) || void 0 === _element$getBoundingC ? void 0 : _element$getBoundingC.call(element);
  return rect && x >= rect.left && x < rect.right && y >= rect.top && y < rect.bottom;
}
function createQueue() {
  var shiftIndex = 0;
  var items = [];
  return {
    push(item) {
      items.push(item);
      return this;
    },
    shift() {
      shiftIndex++;
      return items[shiftIndex - 1];
    },
    get length() {
      return items.length - shiftIndex;
    },
    get items() {
      return items;
    }
  };
}
function getShadowElementsFromPoint(x, y, root) {
  var elementQueue = createQueue().push(root);
  while (elementQueue.length) {
    var el = elementQueue.shift();
    for (var i = 0; i < el.childNodes.length; i++) {
      var childNode = el.childNodes[i];
      if (childNode.nodeType === Node.ELEMENT_NODE && isPositionInElementRectangle(childNode, x, y) && "none" !== getComputedStyle(childNode).pointerEvents) {
        elementQueue.push(childNode);
      }
    }
  }
  var result = elementQueue.items.reverse();
  result.pop();
  return result;
}

// node_modules/devextreme/esm/core/dom_adapter.js
var ELEMENT_NODE = 1;
var TEXT_NODE = 3;
var DOCUMENT_NODE = 9;
var DOCUMENT_FRAGMENT_NODE = 11;
var nativeDOMAdapterStrategy = {
  querySelectorAll: (element, selector) => element.querySelectorAll(selector),
  elementMatches(element, selector) {
    var matches = element.matches || element.matchesSelector || element.mozMatchesSelector || element.msMatchesSelector || element.oMatchesSelector || element.webkitMatchesSelector || ((selector2) => {
      var doc = element.document || element.ownerDocument;
      if (!doc) {
        return false;
      }
      var items = this.querySelectorAll(doc, selector2);
      for (var i = 0; i < items.length; i++) {
        if (items[i] === element) {
          return true;
        }
      }
    });
    return matches.call(element, selector);
  },
  createElement(tagName, context) {
    context = context || this._document;
    return context.createElement(tagName);
  },
  createElementNS(ns, tagName, context) {
    context = context || this._document;
    return context.createElementNS(ns, tagName);
  },
  createTextNode(text, context) {
    context = context || this._document;
    return context.createTextNode(text);
  },
  createAttribute(text, context) {
    context = context || this._document;
    return context.createAttribute(text);
  },
  isNode: (element) => element && "object" === typeof element && "nodeType" in element && "nodeName" in element,
  isElementNode: (element) => element && element.nodeType === ELEMENT_NODE,
  isTextNode: (element) => element && element.nodeType === TEXT_NODE,
  isDocument: (element) => element && element.nodeType === DOCUMENT_NODE,
  isDocumentFragment: (element) => element && element.nodeType === DOCUMENT_FRAGMENT_NODE,
  removeElement(element) {
    var parentNode = element && element.parentNode;
    if (parentNode) {
      parentNode.removeChild(element);
    }
  },
  insertElement(parentElement, newElement, nextSiblingElement) {
    if (parentElement && newElement && parentElement !== newElement) {
      if (nextSiblingElement) {
        parentElement.insertBefore(newElement, nextSiblingElement);
      } else {
        parentElement.appendChild(newElement);
      }
    }
  },
  getAttribute: (element, name) => element.getAttribute(name),
  setAttribute(element, name, value) {
    if ("style" === name) {
      element.style.cssText = value;
    } else {
      element.setAttribute(name, value);
    }
  },
  removeAttribute(element, name) {
    element.removeAttribute(name);
  },
  setProperty(element, name, value) {
    element[name] = value;
  },
  setText(element, text) {
    if (element) {
      element.textContent = text;
    }
  },
  setClass(element, className, isAdd) {
    if (1 === element.nodeType && className) {
      isAdd ? element.classList.add(className) : element.classList.remove(className);
    }
  },
  setStyle(element, name, value) {
    element.style[name] = value || "";
  },
  _document: "undefined" === typeof document ? void 0 : document,
  getDocument() {
    return this._document;
  },
  getActiveElement(element) {
    var activeElementHolder = this.getRootNode(element);
    return activeElementHolder.activeElement;
  },
  getRootNode(element) {
    var _element$getRootNode, _element$getRootNode2;
    return null !== (_element$getRootNode = null === element || void 0 === element ? void 0 : null === (_element$getRootNode2 = element.getRootNode) || void 0 === _element$getRootNode2 ? void 0 : _element$getRootNode2.call(element)) && void 0 !== _element$getRootNode ? _element$getRootNode : this._document;
  },
  getBody() {
    return this._document.body;
  },
  createDocumentFragment() {
    return this._document.createDocumentFragment();
  },
  getDocumentElement() {
    return this._document.documentElement;
  },
  getLocation() {
    return this._document.location;
  },
  getSelection() {
    return this._document.selection;
  },
  getReadyState() {
    return this._document.readyState;
  },
  getHead() {
    return this._document.head;
  },
  hasDocumentProperty(property) {
    return property in this._document;
  },
  listen(element, event, callback, options) {
    if (!element || !("addEventListener" in element)) {
      return noop;
    }
    element.addEventListener(event, callback, options);
    return () => {
      element.removeEventListener(event, callback);
    };
  },
  elementsFromPoint(x, y, element) {
    var activeElementHolder = this.getRootNode(element);
    if (activeElementHolder.host) {
      return getShadowElementsFromPoint(x, y, activeElementHolder);
    }
    return activeElementHolder.elementsFromPoint(x, y);
  }
};
var dom_adapter_default = dependency_injector_default(nativeDOMAdapterStrategy);

// node_modules/devextreme/esm/events/core/events_engine.js
init_extends();

// node_modules/devextreme/esm/core/memorized_callbacks.js
init_iterator();
init_callbacks();
var MemorizedCallbacks = class {
  constructor() {
    this.memory = [];
    this.callbacks = callbacks_default();
  }
  add(fn) {
    each(this.memory, (_, item) => fn.apply(fn, item));
    this.callbacks.add(fn);
  }
  remove(fn) {
    this.callbacks.remove(fn);
  }
  fire() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    this.memory.push(args);
    this.callbacks.fire.apply(this.callbacks, args);
  }
};

// node_modules/devextreme/esm/events/core/event_registrator_callbacks.js
var event_registrator_callbacks_default = new MemorizedCallbacks();

// node_modules/devextreme/esm/events/core/events_engine.js
init_extend();

// node_modules/devextreme/esm/core/utils/window.js
var hasWindowValue = "undefined" !== typeof window;
var hasWindow = () => hasWindowValue;
var windowObject = hasWindow() ? window : void 0;
if (!windowObject) {
  windowObject = {};
  windowObject.window = windowObject;
}
var getWindow = () => windowObject;
var hasProperty = (prop) => hasWindow() && prop in windowObject;
var defaultScreenFactorFunc = (width) => {
  if (width < 768) {
    return "xs";
  } else if (width < 992) {
    return "sm";
  } else if (width < 1200) {
    return "md";
  } else {
    return "lg";
  }
};
var getCurrentScreenFactor = (screenFactorCallback) => {
  var screenFactorFunc = screenFactorCallback || defaultScreenFactorFunc;
  var windowWidth = dom_adapter_default.getDocumentElement().clientWidth;
  return screenFactorFunc(windowWidth);
};
var getNavigator = () => hasWindow() ? windowObject.navigator : {
  userAgent: ""
};

// node_modules/devextreme/esm/events/core/events_engine.js
init_dependency_injector();
init_type();
init_callbacks();
init_errors();

// node_modules/devextreme/esm/events/core/hook_touch_props.js
var touchPropsToHook = ["pageX", "pageY", "screenX", "screenY", "clientX", "clientY"];
var touchPropHook = function(name, event) {
  if (event[name] && !event.touches || !event.touches) {
    return event[name];
  }
  var touches = event.touches.length ? event.touches : event.changedTouches;
  if (!touches.length) {
    return;
  }
  return touches[0][name];
};
function hook_touch_props_default(callback) {
  touchPropsToHook.forEach(function(name) {
    callback(name, function(event) {
      return touchPropHook(name, event);
    });
  }, this);
}

// node_modules/devextreme/esm/core/utils/call_once.js
var callOnce = function(handler) {
  var result;
  var _wrappedHandler = function() {
    result = handler.apply(this, arguments);
    _wrappedHandler = function() {
      return result;
    };
    return result;
  };
  return function() {
    return _wrappedHandler.apply(this, arguments);
  };
};
var call_once_default = callOnce;

// node_modules/devextreme/esm/events/core/events_engine.js
var window2 = getWindow();
var EMPTY_EVENT_NAME = "dxEmptyEventType";
var NATIVE_EVENTS_TO_SUBSCRIBE = {
  mouseenter: "mouseover",
  mouseleave: "mouseout",
  pointerenter: "pointerover",
  pointerleave: "pointerout"
};
var NATIVE_EVENTS_TO_TRIGGER = {
  focusin: "focus",
  focusout: "blur"
};
var NO_BUBBLE_EVENTS = ["blur", "focus", "load"];
var forcePassiveFalseEventNames = ["touchmove", "wheel", "mousewheel", "touchstart"];
var EVENT_PROPERTIES = ["target", "relatedTarget", "delegateTarget", "altKey", "bubbles", "cancelable", "changedTouches", "ctrlKey", "detail", "eventPhase", "metaKey", "shiftKey", "view", "char", "code", "charCode", "key", "keyCode", "button", "buttons", "offsetX", "offsetY", "pointerId", "pointerType", "targetTouches", "toElement", "touches"];
function matchesSafe(target, selector) {
  return !isWindow(target) && "#document" !== target.nodeName && dom_adapter_default.elementMatches(target, selector);
}
var elementDataMap = /* @__PURE__ */ new WeakMap();
var guid = 0;
var skipEvent;
var special = function() {
  var specialData = {};
  event_registrator_callbacks_default.add(function(eventName, eventObject) {
    specialData[eventName] = eventObject;
  });
  return {
    getField: function(eventName, field) {
      return specialData[eventName] && specialData[eventName][field];
    },
    callMethod: function(eventName, methodName, context, args) {
      return specialData[eventName] && specialData[eventName][methodName] && specialData[eventName][methodName].apply(context, args);
    }
  };
}();
var eventsEngine = dependency_injector_default({
  on: getHandler(normalizeOnArguments(iterate(function(element, eventName, selector, data2, handler) {
    var handlersController = getHandlersController(element, eventName);
    handlersController.addHandler(handler, selector, data2);
  }))),
  one: getHandler(normalizeOnArguments(function(element, eventName, selector, data2, handler) {
    eventsEngine.on(element, eventName, selector, data2, function oneTimeHandler() {
      eventsEngine.off(element, eventName, selector, oneTimeHandler);
      handler.apply(this, arguments);
    });
  })),
  off: getHandler(normalizeOffArguments(iterate(function(element, eventName, selector, handler) {
    var handlersController = getHandlersController(element, eventName);
    handlersController.removeHandler(handler, selector);
  }))),
  trigger: getHandler(normalizeTriggerArguments(function(element, event, extraParameters) {
    var eventName = event.type;
    var handlersController = getHandlersController(element, event.type);
    special.callMethod(eventName, "trigger", element, [event, extraParameters]);
    handlersController.callHandlers(event, extraParameters);
    var noBubble = special.getField(eventName, "noBubble") || event.isPropagationStopped() || -1 !== NO_BUBBLE_EVENTS.indexOf(eventName);
    if (!noBubble) {
      var parents = [];
      !function getParents(element2) {
        var _element$parentNode;
        var parent = null !== (_element$parentNode = element2.parentNode) && void 0 !== _element$parentNode ? _element$parentNode : isObject(element2.host) ? element2.host : null;
        if (parent) {
          parents.push(parent);
          getParents(parent);
        }
      }(element);
      parents.push(window2);
      var i = 0;
      while (parents[i] && !event.isPropagationStopped()) {
        var parentDataByEvent = getHandlersController(parents[i], event.type);
        parentDataByEvent.callHandlers(extend(event, {
          currentTarget: parents[i]
        }), extraParameters);
        i++;
      }
    }
    if (element.nodeType || isWindow(element)) {
      special.callMethod(eventName, "_default", element, [event, extraParameters]);
      callNativeMethod(eventName, element);
    }
  })),
  triggerHandler: getHandler(normalizeTriggerArguments(function(element, event, extraParameters) {
    var handlersController = getHandlersController(element, event.type);
    handlersController.callHandlers(event, extraParameters);
  }))
});
function applyForEach(args, method) {
  var element = args[0];
  if (!element) {
    return;
  }
  if (dom_adapter_default.isNode(element) || isWindow(element)) {
    method.apply(eventsEngine, args);
  } else if (!isString(element) && "length" in element) {
    var itemArgs = Array.prototype.slice.call(args, 0);
    Array.prototype.forEach.call(element, function(itemElement) {
      itemArgs[0] = itemElement;
      applyForEach(itemArgs, method);
    });
  } else {
    throw errors_default.Error("E0025");
  }
}
function getHandler(method) {
  return function() {
    applyForEach(arguments, method);
  };
}
function detectPassiveEventHandlersSupport() {
  var isSupported = false;
  try {
    var options = Object.defineProperty({}, "passive", {
      get: function() {
        isSupported = true;
        return true;
      }
    });
    window2.addEventListener("test", null, options);
  } catch (e) {
  }
  return isSupported;
}
var passiveEventHandlersSupported = call_once_default(detectPassiveEventHandlersSupport);
var contains = (container, element) => {
  if (isWindow(container)) {
    return contains(container.document, element);
  }
  return container.contains ? container.contains(element) : !!(element.compareDocumentPosition(container) & element.DOCUMENT_POSITION_CONTAINS);
};
function getHandlersController(element, eventName) {
  var elementData = elementDataMap.get(element);
  eventName = eventName || "";
  var eventNameParts = eventName.split(".");
  var namespaces = eventNameParts.slice(1);
  var eventNameIsDefined = !!eventNameParts[0];
  eventName = eventNameParts[0] || EMPTY_EVENT_NAME;
  if (!elementData) {
    elementData = {};
    elementDataMap.set(element, elementData);
  }
  if (!elementData[eventName]) {
    elementData[eventName] = {
      handleObjects: [],
      nativeHandler: null
    };
  }
  var eventData = elementData[eventName];
  return {
    addHandler: function(handler, selector, data2) {
      var callHandler = function(e, extraParameters) {
        var handlerArgs = [e];
        var target = e.currentTarget;
        var relatedTarget = e.relatedTarget;
        var secondaryTargetIsInside;
        var result;
        if (eventName in NATIVE_EVENTS_TO_SUBSCRIBE) {
          secondaryTargetIsInside = relatedTarget && target && (relatedTarget === target || contains(target, relatedTarget));
        }
        if (void 0 !== extraParameters) {
          handlerArgs.push(extraParameters);
        }
        special.callMethod(eventName, "handle", element, [e, data2]);
        if (!secondaryTargetIsInside) {
          result = handler.apply(target, handlerArgs);
        }
        if (false === result) {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      var handleObject = {
        handler,
        wrappedHandler: function(e, extraParameters) {
          if (skipEvent && e.type === skipEvent) {
            return;
          }
          e.data = data2;
          e.delegateTarget = element;
          if (selector) {
            var currentTarget = e.target;
            while (currentTarget && currentTarget !== element) {
              if (matchesSafe(currentTarget, selector)) {
                e.currentTarget = currentTarget;
                callHandler(e, extraParameters);
              }
              currentTarget = currentTarget.parentNode;
            }
          } else {
            e.currentTarget = e.delegateTarget || e.target;
            callHandler(e, extraParameters);
          }
        },
        selector,
        type: eventName,
        data: data2,
        namespace: namespaces.join("."),
        namespaces,
        guid: ++guid
      };
      eventData.handleObjects.push(handleObject);
      var firstHandlerForTheType = 1 === eventData.handleObjects.length;
      var shouldAddNativeListener = firstHandlerForTheType && eventNameIsDefined;
      var nativeListenerOptions;
      if (shouldAddNativeListener) {
        shouldAddNativeListener = !special.callMethod(eventName, "setup", element, [data2, namespaces, handler]);
      }
      if (shouldAddNativeListener) {
        eventData.nativeHandler = getNativeHandler(eventName);
        if (passiveEventHandlersSupported() && forcePassiveFalseEventNames.indexOf(eventName) > -1) {
          nativeListenerOptions = {
            passive: false
          };
        }
        eventData.removeListener = dom_adapter_default.listen(element, NATIVE_EVENTS_TO_SUBSCRIBE[eventName] || eventName, eventData.nativeHandler, nativeListenerOptions);
      }
      special.callMethod(eventName, "add", element, [handleObject]);
    },
    removeHandler: function(handler, selector) {
      var removeByEventName = function(eventName2) {
        var eventData2 = elementData[eventName2];
        if (!eventData2.handleObjects.length) {
          delete elementData[eventName2];
          return;
        }
        var removedHandler;
        eventData2.handleObjects = eventData2.handleObjects.filter(function(handleObject) {
          var skip = namespaces.length && !isSubset(handleObject.namespaces, namespaces) || handler && handleObject.handler !== handler || selector && handleObject.selector !== selector;
          if (!skip) {
            removedHandler = handleObject.handler;
            special.callMethod(eventName2, "remove", element, [handleObject]);
          }
          return skip;
        });
        var lastHandlerForTheType = !eventData2.handleObjects.length;
        var shouldRemoveNativeListener = lastHandlerForTheType && eventName2 !== EMPTY_EVENT_NAME;
        if (shouldRemoveNativeListener) {
          special.callMethod(eventName2, "teardown", element, [namespaces, removedHandler]);
          if (eventData2.nativeHandler) {
            eventData2.removeListener();
          }
          delete elementData[eventName2];
        }
      };
      if (eventNameIsDefined) {
        removeByEventName(eventName);
      } else {
        for (var name in elementData) {
          removeByEventName(name);
        }
      }
      var elementDataIsEmpty = 0 === Object.keys(elementData).length;
      if (elementDataIsEmpty) {
        elementDataMap.delete(element);
      }
    },
    callHandlers: function(event, extraParameters) {
      var forceStop = false;
      var handleCallback = function(handleObject) {
        if (forceStop) {
          return;
        }
        if (!namespaces.length || isSubset(handleObject.namespaces, namespaces)) {
          handleObject.wrappedHandler(event, extraParameters);
          forceStop = event.isImmediatePropagationStopped();
        }
      };
      eventData.handleObjects.forEach(handleCallback);
      if (namespaces.length && elementData[EMPTY_EVENT_NAME]) {
        elementData[EMPTY_EVENT_NAME].handleObjects.forEach(handleCallback);
      }
    }
  };
}
function getNativeHandler(subscribeName) {
  return function(event, extraParameters) {
    var handlersController = getHandlersController(this, subscribeName);
    event = eventsEngine.Event(event);
    handlersController.callHandlers(event, extraParameters);
  };
}
function isSubset(original, checked) {
  for (var i = 0; i < checked.length; i++) {
    if (original.indexOf(checked[i]) < 0) {
      return false;
    }
  }
  return true;
}
function normalizeOnArguments(callback) {
  return function(element, eventName, selector, data2, handler) {
    if (!handler) {
      handler = data2;
      data2 = void 0;
    }
    if ("string" !== typeof selector) {
      data2 = selector;
      selector = void 0;
    }
    if (!handler && "string" === typeof eventName) {
      handler = data2 || selector;
      selector = void 0;
      data2 = void 0;
    }
    callback(element, eventName, selector, data2, handler);
  };
}
function normalizeOffArguments(callback) {
  return function(element, eventName, selector, handler) {
    if ("function" === typeof selector) {
      handler = selector;
      selector = void 0;
    }
    callback(element, eventName, selector, handler);
  };
}
function normalizeTriggerArguments(callback) {
  return function(element, src, extraParameters) {
    if ("string" === typeof src) {
      src = {
        type: src
      };
    }
    if (!src.target) {
      src.target = element;
    }
    src.currentTarget = element;
    if (!src.delegateTarget) {
      src.delegateTarget = element;
    }
    if (!src.type && src.originalEvent) {
      src.type = src.originalEvent.type;
    }
    callback(element, src instanceof eventsEngine.Event ? src : eventsEngine.Event(src), extraParameters);
  };
}
function normalizeEventArguments(callback) {
  eventsEngine.Event = function(src, config) {
    if (!(this instanceof eventsEngine.Event)) {
      return new eventsEngine.Event(src, config);
    }
    if (!src) {
      src = {};
    }
    if ("string" === typeof src) {
      src = {
        type: src
      };
    }
    if (!config) {
      config = {};
    }
    callback.call(this, src, config);
  };
  _extends(eventsEngine.Event.prototype, {
    _propagationStopped: false,
    _immediatePropagationStopped: false,
    _defaultPrevented: false,
    isPropagationStopped: function() {
      return !!(this._propagationStopped || this.originalEvent && this.originalEvent.propagationStopped);
    },
    stopPropagation: function() {
      this._propagationStopped = true;
      this.originalEvent && this.originalEvent.stopPropagation();
    },
    isImmediatePropagationStopped: function() {
      return this._immediatePropagationStopped;
    },
    stopImmediatePropagation: function() {
      this.stopPropagation();
      this._immediatePropagationStopped = true;
      this.originalEvent && this.originalEvent.stopImmediatePropagation();
    },
    isDefaultPrevented: function() {
      return !!(this._defaultPrevented || this.originalEvent && this.originalEvent.defaultPrevented);
    },
    preventDefault: function() {
      this._defaultPrevented = true;
      this.originalEvent && this.originalEvent.preventDefault();
    }
  });
  return eventsEngine.Event;
}
function iterate(callback) {
  var iterateEventNames = function(element, eventName) {
    if (eventName && eventName.indexOf(" ") > -1) {
      var args = Array.prototype.slice.call(arguments, 0);
      eventName.split(" ").forEach(function(eventName2) {
        args[1] = eventName2;
        callback.apply(this, args);
      });
    } else {
      callback.apply(this, arguments);
    }
  };
  return function(element, eventName) {
    if ("object" === typeof eventName) {
      var args = Array.prototype.slice.call(arguments, 0);
      for (var name in eventName) {
        args[1] = name;
        args[args.length - 1] = eventName[name];
        iterateEventNames.apply(this, args);
      }
    } else {
      iterateEventNames.apply(this, arguments);
    }
  };
}
function callNativeMethod(eventName, element) {
  var nativeMethodName = NATIVE_EVENTS_TO_TRIGGER[eventName] || eventName;
  if (function(eventName2, element2) {
    return "click" === eventName2 && "a" === element2.localName;
  }(eventName, element)) {
    return;
  }
  if (isFunction(element[nativeMethodName])) {
    skipEvent = eventName;
    element[nativeMethodName]();
    skipEvent = void 0;
  }
}
function calculateWhich(event) {
  if (function(event2) {
    return null == event2.which && 0 === event2.type.indexOf("key");
  }(event)) {
    return null != event.charCode ? event.charCode : event.keyCode;
  }
  if (function(event2) {
    return !event2.which && void 0 !== event2.button && /^(?:mouse|pointer|contextmenu|drag|drop)|click/.test(event2.type);
  }(event)) {
    return {
      1: 1,
      2: 3,
      3: 1,
      4: 2
    }[event.button];
  }
  return event.which;
}
function initEvent(EventClass) {
  if (EventClass) {
    eventsEngine.Event = EventClass;
    eventsEngine.Event.prototype = EventClass.prototype;
  }
}
initEvent(normalizeEventArguments(function(src, config) {
  var _src$view;
  var srcIsEvent = src instanceof eventsEngine.Event || hasWindow() && src instanceof window2.Event || (null === (_src$view = src.view) || void 0 === _src$view ? void 0 : _src$view.Event) && src instanceof src.view.Event;
  if (srcIsEvent) {
    this.originalEvent = src;
    this.type = src.type;
    this.currentTarget = void 0;
    if (Object.prototype.hasOwnProperty.call(src, "isTrusted")) {
      this.isTrusted = src.isTrusted;
    }
    this.timeStamp = src.timeStamp || Date.now();
  } else {
    _extends(this, src);
  }
  addProperty("which", calculateWhich, this);
  if (0 === src.type.indexOf("touch")) {
    delete config.pageX;
    delete config.pageY;
  }
  _extends(this, config);
  this.guid = ++guid;
}));
function addProperty(propName, hook, eventInstance) {
  Object.defineProperty(eventInstance || eventsEngine.Event.prototype, propName, {
    enumerable: true,
    configurable: true,
    get: function() {
      return this.originalEvent && hook(this.originalEvent);
    },
    set: function(value) {
      Object.defineProperty(this, propName, {
        enumerable: true,
        configurable: true,
        writable: true,
        value
      });
    }
  });
}
EVENT_PROPERTIES.forEach((prop) => addProperty(prop, (event) => event[prop]));
hook_touch_props_default(addProperty);
var beforeSetStrategy = callbacks_default();
var afterSetStrategy = callbacks_default();
eventsEngine.set = function(engine) {
  beforeSetStrategy.fire();
  eventsEngine.inject(engine);
  initEvent(engine.Event);
  afterSetStrategy.fire();
};
eventsEngine.subscribeGlobal = function() {
  applyForEach(arguments, normalizeOnArguments(function() {
    var args = arguments;
    eventsEngine.on.apply(this, args);
    beforeSetStrategy.add(function() {
      var offArgs = Array.prototype.slice.call(args, 0);
      offArgs.splice(3, 1);
      eventsEngine.off.apply(this, offArgs);
    });
    afterSetStrategy.add(function() {
      eventsEngine.on.apply(this, args);
    });
  }));
};
eventsEngine.forcePassiveFalseEventNames = forcePassiveFalseEventNames;
eventsEngine.passiveEventHandlersSupported = passiveEventHandlersSupported;
var events_engine_default = eventsEngine;

// node_modules/devextreme/esm/events/index.js
var on = events_engine_default.on;
var one = events_engine_default.one;
var off = events_engine_default.off;
var trigger = events_engine_default.trigger;
var triggerHandler = events_engine_default.triggerHandler;
var Event = events_engine_default.Event;

// node_modules/devextreme-angular/fesm2015/devextreme-angular-core.js
init_common();

// node_modules/devextreme/esm/core/element_data.js
var dataMap = /* @__PURE__ */ new WeakMap();
var strategy;
var strategyChanging = new MemorizedCallbacks();
var beforeCleanDataFunc = function() {
};
var afterCleanDataFunc = function() {
};
var setDataStrategy = function(value) {
  strategyChanging.fire(value);
  strategy = value;
  var cleanData = strategy.cleanData;
  strategy.cleanData = function(nodes) {
    beforeCleanDataFunc(nodes);
    var result = cleanData.call(this, nodes);
    afterCleanDataFunc(nodes);
    return result;
  };
};
setDataStrategy({
  data: function() {
    var element = arguments[0];
    var key = arguments[1];
    var value = arguments[2];
    if (!element) {
      return;
    }
    var elementData = dataMap.get(element);
    if (!elementData) {
      elementData = {};
      dataMap.set(element, elementData);
    }
    if (void 0 === key) {
      return elementData;
    }
    if (2 === arguments.length) {
      return elementData[key];
    }
    elementData[key] = value;
    return value;
  },
  removeData: function(element, key) {
    if (!element) {
      return;
    }
    if (void 0 === key) {
      dataMap.delete(element);
    } else {
      var elementData = dataMap.get(element);
      if (elementData) {
        delete elementData[key];
      }
    }
  },
  cleanData: function(elements) {
    for (var i = 0; i < elements.length; i++) {
      events_engine_default.off(elements[i]);
      dataMap.delete(elements[i]);
    }
  }
});
function data() {
  return strategy.data.apply(this, arguments);
}
function beforeCleanData(callback) {
  beforeCleanDataFunc = callback;
}
function removeData(element, key) {
  return strategy.removeData.call(this, element, key);
}
function cleanDataRecursive(element, cleanSelf) {
  if (!dom_adapter_default.isElementNode(element)) {
    return;
  }
  var childElements = element.getElementsByTagName("*");
  strategy.cleanData(childElements);
  if (cleanSelf) {
    strategy.cleanData([element]);
  }
}

// node_modules/devextreme/esm/core/renderer_base.js
init_type();

// node_modules/devextreme/esm/core/utils/style.js
init_inflector();
init_type();
var jsPrefixes = ["", "Webkit", "Moz", "O", "Ms"];
var cssPrefixes = {
  "": "",
  Webkit: "-webkit-",
  Moz: "-moz-",
  O: "-o-",
  ms: "-ms-"
};
var getStyles = call_once_default(function() {
  return dom_adapter_default.createElement("dx").style;
});
var forEachPrefixes = function(prop, callBack) {
  prop = camelize(prop, true);
  var result;
  for (var i = 0, cssPrefixesCount = jsPrefixes.length; i < cssPrefixesCount; i++) {
    var jsPrefix = jsPrefixes[i];
    var prefixedProp = jsPrefix + prop;
    var lowerPrefixedProp = camelize(prefixedProp);
    result = callBack(lowerPrefixedProp, jsPrefix);
    if (void 0 === result) {
      result = callBack(prefixedProp, jsPrefix);
    }
    if (void 0 !== result) {
      break;
    }
  }
  return result || "";
};
var styleProp = function(name) {
  if (name in getStyles()) {
    return name;
  }
  var originalName = name;
  name = name.charAt(0).toUpperCase() + name.substr(1);
  for (var i = 1; i < jsPrefixes.length; i++) {
    var prefixedProp = jsPrefixes[i].toLowerCase() + name;
    if (prefixedProp in getStyles()) {
      return prefixedProp;
    }
  }
  return originalName;
};
var stylePropPrefix = function(prop) {
  return forEachPrefixes(prop, function(specific, jsPrefix) {
    if (specific in getStyles()) {
      return cssPrefixes[jsPrefix];
    }
  });
};
var pxExceptions = ["fillOpacity", "columnCount", "flexGrow", "flexShrink", "fontWeight", "lineHeight", "opacity", "zIndex", "zoom"];
var normalizeStyleProp = function(prop, value) {
  if (isNumeric(value) && -1 === pxExceptions.indexOf(prop)) {
    value += "px";
  }
  return value;
};
var setDimensionProperty = function(elements, propertyName, value) {
  if (elements) {
    value = isNumeric(value) ? value += "px" : value;
    for (var i = 0; i < elements.length; ++i) {
      elements[i].style[propertyName] = value;
    }
  }
};
var setWidth = function(elements, value) {
  setDimensionProperty(elements, "width", value);
};
var setHeight = function(elements, value) {
  setDimensionProperty(elements, "height", value);
};
var setStyle = function(element, styleString) {
  var resetStyle = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : true;
  if (resetStyle) {
    var styleList = [].slice.call(element.style);
    styleList.forEach((propertyName) => {
      element.style.removeProperty(propertyName);
    });
  }
  styleString.split(";").forEach((style) => {
    var parts = style.split(":").map((stylePart) => stylePart.trim());
    if (2 === parts.length) {
      var [property, value] = parts;
      element.style[property] = value;
    }
  });
};

// node_modules/devextreme/esm/core/utils/size.js
init_type();
var window3 = getWindow();
var SPECIAL_HEIGHT_VALUES = ["auto", "none", "inherit", "initial"];
var getSizeByStyles = function(elementStyles, styles) {
  var result = 0;
  styles.forEach(function(style) {
    result += parseFloat(elementStyles[style]) || 0;
  });
  return result;
};
var getElementBoxParams = function(name, elementStyles) {
  var beforeName = "width" === name ? "Left" : "Top";
  var afterName = "width" === name ? "Right" : "Bottom";
  return {
    padding: getSizeByStyles(elementStyles, ["padding" + beforeName, "padding" + afterName]),
    border: getSizeByStyles(elementStyles, ["border" + beforeName + "Width", "border" + afterName + "Width"]),
    margin: getSizeByStyles(elementStyles, ["margin" + beforeName, "margin" + afterName])
  };
};
var getElementComputedStyle = function(element) {
  var _element$ownerDocumen;
  var view = (null === element || void 0 === element ? void 0 : null === (_element$ownerDocumen = element.ownerDocument) || void 0 === _element$ownerDocumen ? void 0 : _element$ownerDocumen.defaultView) || window3;
  return view.getComputedStyle && view.getComputedStyle(element);
};
var getCSSProperty = function(element, styles, name, defaultValue) {
  var _element$style;
  return (null === styles || void 0 === styles ? void 0 : styles[name]) || (null === (_element$style = element.style) || void 0 === _element$style ? void 0 : _element$style[name]) || defaultValue;
};
var boxIndices = {
  content: 0,
  padding: 1,
  border: 2,
  margin: 3,
  "content-box": 0,
  "border-box": 2
};
var dimensionComponents = {
  width: ["left", "right"],
  height: ["top", "bottom"]
};
function getComponentThickness(elem, dimension, component, styles) {
  var get = (elem2, styles2, field) => parseFloat(getCSSProperty(elem2, styles2, field, "0")) || 0;
  var suffix = "border" === component ? "-width" : "";
  return get(elem, styles, "".concat(component, "-").concat(dimensionComponents[dimension][0]).concat(suffix)) + get(elem, styles, "".concat(component, "-").concat(dimensionComponents[dimension][1]).concat(suffix));
}
var getSize = function(element, dimension, box) {
  var offsetFieldName = "width" === dimension ? "offsetWidth" : "offsetHeight";
  var styles = getElementComputedStyle(element);
  var result = getCSSProperty(element, styles, dimension);
  if ("" === result || "auto" === result) {
    result = element[offsetFieldName];
  }
  result = parseFloat(result) || 0;
  var currentBox = getCSSProperty(element, styles, "boxSizing", "content-box");
  var targetBox = box || currentBox;
  var targetBoxIndex = boxIndices[targetBox];
  var currentBoxIndex = boxIndices[currentBox];
  if (void 0 === targetBoxIndex || void 0 === currentBoxIndex) {
    throw new Error();
  }
  if (currentBoxIndex === targetBoxIndex) {
    return result;
  }
  var coeff = Math.sign(targetBoxIndex - currentBoxIndex);
  var padding = false;
  var border = false;
  var margin = false;
  var scrollThickness = false;
  if (1 === coeff) {
    targetBoxIndex += 1;
    currentBoxIndex += 1;
  }
  for (var boxPart = currentBoxIndex; boxPart !== targetBoxIndex; boxPart += coeff) {
    switch (boxPart) {
      case boxIndices.content:
        break;
      case boxIndices.padding:
        padding = coeff * getComponentThickness(element, dimension, "padding", styles);
        break;
      case boxIndices.border:
        border = coeff * getComponentThickness(element, dimension, "border", styles);
        break;
      case boxIndices.margin:
        margin = coeff * getComponentThickness(element, dimension, "margin", styles);
    }
  }
  if (padding || border) {
    var paddingAndBorder = (false === padding ? coeff * getComponentThickness(element, dimension, "padding", styles) : padding) + (false === border ? coeff * getComponentThickness(element, dimension, "border", styles) : border);
    scrollThickness = coeff * Math.max(0, Math.floor(element[offsetFieldName] - result - coeff * paddingAndBorder)) || 0;
  }
  return result + margin + padding + border + scrollThickness;
};
var getContainerHeight = function(container) {
  return isWindow(container) ? container.innerHeight : container.offsetHeight;
};
var parseHeight = function(value, container, element) {
  if (value.indexOf("px") > 0) {
    value = parseInt(value.replace("px", ""));
  } else if (value.indexOf("%") > 0) {
    value = parseInt(value.replace("%", "")) * getContainerHeight(container) / 100;
  } else if (!isNaN(value)) {
    value = parseInt(value);
  } else if (value.indexOf("vh") > 0) {
    value = window3.innerHeight / 100 * parseInt(value.replace("vh", ""));
  } else if (element && value.indexOf("em") > 0) {
    value = parseFloat(value.replace("em", "")) * parseFloat(window3.getComputedStyle(element).fontSize);
  }
  return value;
};
var getHeightWithOffset = function(value, offset, container) {
  if (!value) {
    return null;
  }
  if (SPECIAL_HEIGHT_VALUES.indexOf(value) > -1) {
    return offset ? null : value;
  }
  if (isString(value)) {
    value = parseHeight(value, container);
  }
  if (isNumeric(value)) {
    return Math.max(0, value + offset);
  }
  var operationString = offset < 0 ? " - " : " ";
  return "calc(" + value + operationString + Math.abs(offset) + "px)";
};
var addOffsetToMaxHeight = function(value, offset, container) {
  var maxHeight = getHeightWithOffset(value, offset, container);
  return null !== maxHeight ? maxHeight : "none";
};
var addOffsetToMinHeight = function(value, offset, container) {
  var minHeight = getHeightWithOffset(value, offset, container);
  return null !== minHeight ? minHeight : 0;
};
var getVerticalOffsets = function(element, withMargins) {
  if (!element) {
    return 0;
  }
  var boxParams = getElementBoxParams("height", window3.getComputedStyle(element));
  return boxParams.padding + boxParams.border + (withMargins ? boxParams.margin : 0);
};
var getVisibleHeight = function(element) {
  if (element) {
    var _element$getBoundingC;
    var boundingClientRect = null === (_element$getBoundingC = element.getBoundingClientRect) || void 0 === _element$getBoundingC ? void 0 : _element$getBoundingC.call(element);
    if (null !== boundingClientRect && void 0 !== boundingClientRect && boundingClientRect.height) {
      return boundingClientRect.height;
    }
  }
  return 0;
};
var implementationsMap = {
  getWidth: function() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    return elementSizeHelper("width", ...args);
  },
  setWidth: function() {
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }
    return elementSizeHelper("width", ...args);
  },
  getHeight: function() {
    for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }
    return elementSizeHelper("height", ...args);
  },
  setHeight: function() {
    for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }
    return elementSizeHelper("height", ...args);
  },
  getOuterWidth: function() {
    for (var _len5 = arguments.length, args = new Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
      args[_key5] = arguments[_key5];
    }
    return elementSizeHelper("outerWidth", ...args);
  },
  setOuterWidth: function() {
    for (var _len6 = arguments.length, args = new Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
      args[_key6] = arguments[_key6];
    }
    return elementSizeHelper("outerWidth", ...args);
  },
  getOuterHeight: function() {
    for (var _len7 = arguments.length, args = new Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
      args[_key7] = arguments[_key7];
    }
    return elementSizeHelper("outerHeight", ...args);
  },
  setOuterHeight: function() {
    for (var _len8 = arguments.length, args = new Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
      args[_key8] = arguments[_key8];
    }
    return elementSizeHelper("outerHeight", ...args);
  },
  getInnerWidth: function() {
    for (var _len9 = arguments.length, args = new Array(_len9), _key9 = 0; _key9 < _len9; _key9++) {
      args[_key9] = arguments[_key9];
    }
    return elementSizeHelper("innerWidth", ...args);
  },
  setInnerWidth: function() {
    for (var _len10 = arguments.length, args = new Array(_len10), _key10 = 0; _key10 < _len10; _key10++) {
      args[_key10] = arguments[_key10];
    }
    return elementSizeHelper("innerWidth", ...args);
  },
  getInnerHeight: function() {
    for (var _len11 = arguments.length, args = new Array(_len11), _key11 = 0; _key11 < _len11; _key11++) {
      args[_key11] = arguments[_key11];
    }
    return elementSizeHelper("innerHeight", ...args);
  },
  setInnerHeight: function() {
    for (var _len12 = arguments.length, args = new Array(_len12), _key12 = 0; _key12 < _len12; _key12++) {
      args[_key12] = arguments[_key12];
    }
    return elementSizeHelper("innerHeight", ...args);
  }
};
function elementSizeHelper(sizeProperty, el, value) {
  return 2 === arguments.length ? elementSize(el, sizeProperty) : elementSize(el, sizeProperty, value);
}
var getWidth = (el) => implementationsMap.getWidth(el);
var setWidth2 = (el, value) => implementationsMap.setWidth(el, value);
var getHeight = (el) => implementationsMap.getHeight(el);
var setHeight2 = (el, value) => implementationsMap.setHeight(el, value);
var getOuterWidth = (el, includeMargin) => implementationsMap.getOuterWidth(el, includeMargin || false);
var setOuterWidth = (el, value) => implementationsMap.setOuterWidth(el, value);
var getOuterHeight = (el, includeMargin) => implementationsMap.getOuterHeight(el, includeMargin || false);
var setOuterHeight = (el, value) => implementationsMap.setOuterHeight(el, value);
var getInnerWidth = (el) => implementationsMap.getInnerWidth(el);
var getInnerHeight = (el) => implementationsMap.getInnerHeight(el);
var elementSize = function elementSize2(el, sizeProperty, value) {
  var partialName = sizeProperty.toLowerCase().indexOf("width") >= 0 ? "Width" : "Height";
  var propName = partialName.toLowerCase();
  var isOuter = 0 === sizeProperty.indexOf("outer");
  var isInner = 0 === sizeProperty.indexOf("inner");
  var isGetter = 2 === arguments.length || "boolean" === typeof value;
  if (isRenderer(el)) {
    if (el.length > 1 && !isGetter) {
      for (var i = 0; i < el.length; i++) {
        elementSize2(el[i], sizeProperty, value);
      }
      return;
    }
    el = el[0];
  }
  if (!el) {
    return;
  }
  if (isWindow(el)) {
    return isOuter ? el["inner" + partialName] : dom_adapter_default.getDocumentElement()["client" + partialName];
  }
  if (dom_adapter_default.isDocument(el)) {
    var documentElement = dom_adapter_default.getDocumentElement();
    var body = dom_adapter_default.getBody();
    return Math.max(body["scroll" + partialName], body["offset" + partialName], documentElement["scroll" + partialName], documentElement["offset" + partialName], documentElement["client" + partialName]);
  }
  if (isGetter) {
    var box = "content";
    if (isOuter) {
      box = value ? "margin" : "border";
    }
    if (isInner) {
      box = "padding";
    }
    return getSize(el, propName, box);
  }
  if (isNumeric(value)) {
    var elementStyles = getElementComputedStyle(el);
    var sizeAdjustment = getElementBoxParams(propName, elementStyles);
    var isBorderBox = "border-box" === elementStyles.boxSizing;
    value = Number(value);
    if (isOuter) {
      value -= isBorderBox ? 0 : sizeAdjustment.border + sizeAdjustment.padding;
    } else if (isInner) {
      value += isBorderBox ? sizeAdjustment.border : -sizeAdjustment.padding;
    } else if (isBorderBox) {
      value += sizeAdjustment.border + sizeAdjustment.padding;
    }
  }
  value += isNumeric(value) ? "px" : "";
  dom_adapter_default.setStyle(el, propName, value);
  return null;
};
var getWindowByElement = (el) => isWindow(el) ? el : el.defaultView;
var getOffset = (el) => {
  var _el$getClientRects;
  if (!(null !== (_el$getClientRects = el.getClientRects) && void 0 !== _el$getClientRects && _el$getClientRects.call(el).length)) {
    return {
      top: 0,
      left: 0
    };
  }
  var rect = el.getBoundingClientRect();
  var win = getWindowByElement(el.ownerDocument);
  var docElem = el.ownerDocument.documentElement;
  return {
    top: rect.top + win.pageYOffset - docElem.clientTop,
    left: rect.left + win.pageXOffset - docElem.clientLeft
  };
};

// node_modules/devextreme/esm/core/utils/html_parser.js
var isTagName = /<([a-z][^/\0>\x20\t\r\n\f]+)/i;
var tagWrappers = {
  default: {
    tagsCount: 0,
    startTags: "",
    endTags: ""
  },
  thead: {
    tagsCount: 1,
    startTags: "<table>",
    endTags: "</table>"
  },
  td: {
    tagsCount: 3,
    startTags: "<table><tbody><tr>",
    endTags: "</tr></tbody></table>"
  },
  col: {
    tagsCount: 2,
    startTags: "<table><colgroup>",
    endTags: "</colgroup></table>"
  },
  tr: {
    tagsCount: 2,
    startTags: "<table><tbody>",
    endTags: "</tbody></table>"
  }
};
tagWrappers.tbody = tagWrappers.colgroup = tagWrappers.caption = tagWrappers.tfoot = tagWrappers.thead;
tagWrappers.th = tagWrappers.td;
var parseHTML = function(html) {
  if ("string" !== typeof html) {
    return null;
  }
  var fragment = dom_adapter_default.createDocumentFragment();
  var container = fragment.appendChild(dom_adapter_default.createElement("div"));
  var tags = isTagName.exec(html);
  var firstRootTag = tags && tags[1].toLowerCase();
  var tagWrapper = tagWrappers[firstRootTag] || tagWrappers.default;
  container.innerHTML = tagWrapper.startTags + html + tagWrapper.endTags;
  for (var i = 0; i < tagWrapper.tagsCount; i++) {
    container = container.lastChild;
  }
  return [...container.childNodes];
};
var isTablePart = function(html) {
  var tags = isTagName.exec(html);
  return tags && tags[1] in tagWrappers;
};

// node_modules/devextreme/esm/core/renderer_base.js
var window4 = getWindow();
var renderer;
var initRender = function(selector, context) {
  if (!selector) {
    this.length = 0;
    return this;
  }
  if ("string" === typeof selector) {
    if ("body" === selector) {
      this[0] = context ? context.body : dom_adapter_default.getBody();
      this.length = 1;
      return this;
    }
    context = context || dom_adapter_default.getDocument();
    if ("<" === selector[0]) {
      this[0] = dom_adapter_default.createElement(selector.slice(1, -1), context);
      this.length = 1;
      return this;
    }
    [].push.apply(this, dom_adapter_default.querySelectorAll(context, selector));
    return this;
  } else if (dom_adapter_default.isNode(selector) || isWindow(selector)) {
    this[0] = selector;
    this.length = 1;
    return this;
  } else if (Array.isArray(selector)) {
    [].push.apply(this, selector);
    return this;
  }
  return renderer(selector.toArray ? selector.toArray() : [selector]);
};
renderer = function(selector, context) {
  return new initRender(selector, context);
};
renderer.fn = {
  dxRenderer: true
};
initRender.prototype = renderer.fn;
var repeatMethod = function(methodName, args) {
  for (var i = 0; i < this.length; i++) {
    var item = renderer(this[i]);
    item[methodName].apply(item, args);
  }
  return this;
};
var setAttributeValue = function(element, attrName, value) {
  if (void 0 !== value && null !== value && false !== value) {
    dom_adapter_default.setAttribute(element, attrName, value);
  } else {
    dom_adapter_default.removeAttribute(element, attrName);
  }
};
initRender.prototype.show = function() {
  return this.toggle(true);
};
initRender.prototype.hide = function() {
  return this.toggle(false);
};
initRender.prototype.toggle = function(value) {
  if (this[0]) {
    this.toggleClass("dx-state-invisible", !value);
  }
  return this;
};
initRender.prototype.attr = function(attrName, value) {
  if (this.length > 1 && arguments.length > 1) {
    return repeatMethod.call(this, "attr", arguments);
  }
  if (!this[0]) {
    if (isObject(attrName) || void 0 !== value) {
      return this;
    } else {
      return;
    }
  }
  if (!this[0].getAttribute) {
    return this.prop(attrName, value);
  }
  if ("string" === typeof attrName && 1 === arguments.length) {
    var result = this[0].getAttribute(attrName);
    return null == result ? void 0 : result;
  } else if (isPlainObject(attrName)) {
    for (var key in attrName) {
      this.attr(key, attrName[key]);
    }
  } else {
    setAttributeValue(this[0], attrName, value);
  }
  return this;
};
initRender.prototype.removeAttr = function(attrName) {
  this[0] && dom_adapter_default.removeAttribute(this[0], attrName);
  return this;
};
initRender.prototype.prop = function(propName, value) {
  if (!this[0]) {
    return this;
  }
  if ("string" === typeof propName && 1 === arguments.length) {
    return this[0][propName];
  } else if (isPlainObject(propName)) {
    for (var key in propName) {
      this.prop(key, propName[key]);
    }
  } else {
    dom_adapter_default.setProperty(this[0], propName, value);
  }
  return this;
};
initRender.prototype.addClass = function(className) {
  return this.toggleClass(className, true);
};
initRender.prototype.removeClass = function(className) {
  return this.toggleClass(className, false);
};
initRender.prototype.hasClass = function(className) {
  if (!this[0] || void 0 === this[0].className) {
    return false;
  }
  var classNames = className.split(" ");
  for (var i = 0; i < classNames.length; i++) {
    if (this[0].classList) {
      if (this[0].classList.contains(classNames[i])) {
        return true;
      }
    } else {
      var _className = isString(this[0].className) ? this[0].className : dom_adapter_default.getAttribute(this[0], "class");
      if ((_className || "").split(" ").indexOf(classNames[i]) >= 0) {
        return true;
      }
    }
  }
  return false;
};
initRender.prototype.toggleClass = function(className, value) {
  if (this.length > 1) {
    return repeatMethod.call(this, "toggleClass", arguments);
  }
  if (!this[0] || !className) {
    return this;
  }
  value = void 0 === value ? !this.hasClass(className) : value;
  var classNames = className.split(" ");
  for (var i = 0; i < classNames.length; i++) {
    dom_adapter_default.setClass(this[0], classNames[i], value);
  }
  return this;
};
initRender.prototype.html = function(value) {
  if (!arguments.length) {
    return this[0].innerHTML;
  }
  this.empty();
  if ("string" === typeof value && !isTablePart(value) || "number" === typeof value) {
    this[0].innerHTML = value;
    return this;
  }
  return this.append(parseHTML(value));
};
var appendElements = function(element, nextSibling) {
  if (!this[0] || !element) {
    return;
  }
  if ("string" === typeof element) {
    element = parseHTML(element);
  } else if (element.nodeType) {
    element = [element];
  } else if (isNumeric(element)) {
    element = [dom_adapter_default.createTextNode(element)];
  }
  for (var i = 0; i < element.length; i++) {
    var item = element[i];
    var container = this[0];
    var wrapTR = "TABLE" === container.tagName && "TR" === item.tagName;
    if (wrapTR && container.tBodies && container.tBodies.length) {
      container = container.tBodies[0];
    }
    dom_adapter_default.insertElement(container, item.nodeType ? item : item[0], nextSibling);
  }
};
var setCss = function(name, value) {
  if (!this[0] || !this[0].style) {
    return;
  }
  if (null === value || "number" === typeof value && isNaN(value)) {
    return;
  }
  name = styleProp(name);
  for (var i = 0; i < this.length; i++) {
    this[i].style[name] = normalizeStyleProp(name, value);
  }
};
initRender.prototype.css = function(name, value) {
  if (isString(name)) {
    if (2 === arguments.length) {
      setCss.call(this, name, value);
    } else {
      if (!this[0]) {
        return;
      }
      name = styleProp(name);
      var result = window4.getComputedStyle(this[0])[name] || this[0].style[name];
      return isNumeric(result) ? result.toString() : result;
    }
  } else if (isPlainObject(name)) {
    for (var key in name) {
      setCss.call(this, key, name[key]);
    }
  }
  return this;
};
initRender.prototype.prepend = function(element) {
  if (arguments.length > 1) {
    for (var i = 0; i < arguments.length; i++) {
      this.prepend(arguments[i]);
    }
    return this;
  }
  appendElements.apply(this, [element, this[0].firstChild]);
  return this;
};
initRender.prototype.append = function(element) {
  if (arguments.length > 1) {
    for (var i = 0; i < arguments.length; i++) {
      this.append(arguments[i]);
    }
    return this;
  }
  appendElements.apply(this, [element]);
  return this;
};
initRender.prototype.prependTo = function(element) {
  if (this.length > 1) {
    for (var i = this.length - 1; i >= 0; i--) {
      renderer(this[i]).prependTo(element);
    }
    return this;
  }
  element = renderer(element);
  if (element[0]) {
    dom_adapter_default.insertElement(element[0], this[0], element[0].firstChild);
  }
  return this;
};
initRender.prototype.appendTo = function(element) {
  if (this.length > 1) {
    return repeatMethod.call(this, "appendTo", arguments);
  }
  dom_adapter_default.insertElement(renderer(element)[0], this[0]);
  return this;
};
initRender.prototype.insertBefore = function(element) {
  if (element && element[0]) {
    dom_adapter_default.insertElement(element[0].parentNode, this[0], element[0]);
  }
  return this;
};
initRender.prototype.insertAfter = function(element) {
  if (element && element[0]) {
    dom_adapter_default.insertElement(element[0].parentNode, this[0], element[0].nextSibling);
  }
  return this;
};
initRender.prototype.before = function(element) {
  if (this[0]) {
    dom_adapter_default.insertElement(this[0].parentNode, element[0], this[0]);
  }
  return this;
};
initRender.prototype.after = function(element) {
  if (this[0]) {
    dom_adapter_default.insertElement(this[0].parentNode, element[0], this[0].nextSibling);
  }
  return this;
};
initRender.prototype.wrap = function(wrapper) {
  if (this[0]) {
    var wrap = renderer(wrapper);
    wrap.insertBefore(this);
    wrap.append(this);
  }
  return this;
};
initRender.prototype.wrapInner = function(wrapper) {
  var contents = this.contents();
  if (contents.length) {
    contents.wrap(wrapper);
  } else {
    this.append(wrapper);
  }
  return this;
};
initRender.prototype.replaceWith = function(element) {
  if (!(element && element[0])) {
    return;
  }
  if (element.is(this)) {
    return this;
  }
  element.insertBefore(this);
  this.remove();
  return element;
};
initRender.prototype.remove = function() {
  if (this.length > 1) {
    return repeatMethod.call(this, "remove", arguments);
  }
  cleanDataRecursive(this[0], true);
  dom_adapter_default.removeElement(this[0]);
  return this;
};
initRender.prototype.detach = function() {
  if (this.length > 1) {
    return repeatMethod.call(this, "detach", arguments);
  }
  dom_adapter_default.removeElement(this[0]);
  return this;
};
initRender.prototype.empty = function() {
  if (this.length > 1) {
    return repeatMethod.call(this, "empty", arguments);
  }
  cleanDataRecursive(this[0]);
  dom_adapter_default.setText(this[0], "");
  return this;
};
initRender.prototype.clone = function() {
  var result = [];
  for (var i = 0; i < this.length; i++) {
    result.push(this[i].cloneNode(true));
  }
  return renderer(result);
};
initRender.prototype.text = function(value) {
  if (!arguments.length) {
    var result = "";
    for (var i = 0; i < this.length; i++) {
      result += this[i] && this[i].textContent || "";
    }
    return result;
  }
  var text = isFunction(value) ? value() : value;
  cleanDataRecursive(this[0], false);
  dom_adapter_default.setText(this[0], isDefined(text) ? text : "");
  return this;
};
initRender.prototype.val = function(value) {
  if (1 === arguments.length) {
    return this.prop("value", isDefined(value) ? value : "");
  }
  return this.prop("value");
};
initRender.prototype.contents = function() {
  if (!this[0]) {
    return renderer();
  }
  var result = [];
  result.push.apply(result, this[0].childNodes);
  return renderer(result);
};
initRender.prototype.find = function(selector) {
  var result = renderer();
  if (!selector) {
    return result;
  }
  var nodes = [];
  var i;
  if ("string" === typeof selector) {
    selector = selector.trim();
    for (i = 0; i < this.length; i++) {
      var element = this[i];
      if (dom_adapter_default.isElementNode(element)) {
        var elementId = element.getAttribute("id");
        var queryId = elementId || "dx-query-children";
        if (!elementId) {
          setAttributeValue(element, "id", queryId);
        }
        queryId = "[id='" + queryId + "'] ";
        var querySelector = queryId + selector.replace(/([^\\])(,)/g, "$1, " + queryId);
        nodes.push.apply(nodes, dom_adapter_default.querySelectorAll(element, querySelector));
        setAttributeValue(element, "id", elementId);
      } else if (dom_adapter_default.isDocument(element) || dom_adapter_default.isDocumentFragment(element)) {
        nodes.push.apply(nodes, dom_adapter_default.querySelectorAll(element, selector));
      }
    }
  } else {
    for (i = 0; i < this.length; i++) {
      selector = dom_adapter_default.isNode(selector) ? selector : selector[0];
      if (this[i] !== selector && this[i].contains(selector)) {
        nodes.push(selector);
      }
    }
  }
  return result.add(nodes);
};
var isVisible = function(_, element) {
  var _element$host, _element$getClientRec, _element;
  element = null !== (_element$host = element.host) && void 0 !== _element$host ? _element$host : element;
  if (!element.nodeType) {
    return true;
  }
  return !!(element.offsetWidth || element.offsetHeight || null !== (_element$getClientRec = (_element = element).getClientRects) && void 0 !== _element$getClientRec && _element$getClientRec.call(_element).length);
};
initRender.prototype.filter = function(selector) {
  if (!selector) {
    return renderer();
  }
  if (":visible" === selector) {
    return this.filter(isVisible);
  } else if (":hidden" === selector) {
    return this.filter(function(_, element) {
      return !isVisible(_, element);
    });
  }
  var result = [];
  for (var i = 0; i < this.length; i++) {
    var item = this[i];
    if (dom_adapter_default.isElementNode(item) && "string" === type(selector)) {
      dom_adapter_default.elementMatches(item, selector) && result.push(item);
    } else if (dom_adapter_default.isNode(selector) || isWindow(selector)) {
      selector === item && result.push(item);
    } else if (isFunction(selector)) {
      selector.call(item, i, item) && result.push(item);
    } else {
      for (var j = 0; j < selector.length; j++) {
        selector[j] === item && result.push(item);
      }
    }
  }
  return renderer(result);
};
initRender.prototype.not = function(selector) {
  var result = [];
  var nodes = this.filter(selector).toArray();
  for (var i = 0; i < this.length; i++) {
    if (-1 === nodes.indexOf(this[i])) {
      result.push(this[i]);
    }
  }
  return renderer(result);
};
initRender.prototype.is = function(selector) {
  return !!this.filter(selector).length;
};
initRender.prototype.children = function(selector) {
  var result = [];
  for (var i = 0; i < this.length; i++) {
    var nodes = this[i] ? this[i].childNodes : [];
    for (var j = 0; j < nodes.length; j++) {
      if (dom_adapter_default.isElementNode(nodes[j])) {
        result.push(nodes[j]);
      }
    }
  }
  result = renderer(result);
  return selector ? result.filter(selector) : result;
};
initRender.prototype.siblings = function() {
  var element = this[0];
  if (!element || !element.parentNode) {
    return renderer();
  }
  var result = [];
  var parentChildNodes = element.parentNode.childNodes || [];
  for (var i = 0; i < parentChildNodes.length; i++) {
    var node = parentChildNodes[i];
    if (dom_adapter_default.isElementNode(node) && node !== element) {
      result.push(node);
    }
  }
  return renderer(result);
};
initRender.prototype.each = function(callback) {
  for (var i = 0; i < this.length; i++) {
    if (false === callback.call(this[i], i, this[i])) {
      break;
    }
  }
};
initRender.prototype.index = function(element) {
  if (!element) {
    return this.parent().children().index(this);
  }
  element = renderer(element);
  return this.toArray().indexOf(element[0]);
};
initRender.prototype.get = function(index) {
  return this[index < 0 ? this.length + index : index];
};
initRender.prototype.eq = function(index) {
  index = index < 0 ? this.length + index : index;
  return renderer(this[index]);
};
initRender.prototype.first = function() {
  return this.eq(0);
};
initRender.prototype.last = function() {
  return this.eq(-1);
};
initRender.prototype.select = function() {
  for (var i = 0; i < this.length; i += 1) {
    this[i].select && this[i].select();
  }
  return this;
};
initRender.prototype.parent = function(selector) {
  if (!this[0]) {
    return renderer();
  }
  var result = renderer(this[0].parentNode);
  return !selector || result.is(selector) ? result : renderer();
};
initRender.prototype.parents = function(selector) {
  var result = [];
  var parent = this.parent();
  while (parent && parent[0] && !dom_adapter_default.isDocument(parent[0])) {
    if (dom_adapter_default.isElementNode(parent[0])) {
      if (!selector || parent.is(selector)) {
        result.push(parent.get(0));
      }
    }
    parent = parent.parent();
  }
  return renderer(result);
};
initRender.prototype.closest = function(selector) {
  if (this.is(selector)) {
    return this;
  }
  var parent = this.parent();
  while (parent && parent.length) {
    if (parent.is(selector)) {
      return parent;
    }
    parent = parent.parent();
  }
  return renderer();
};
initRender.prototype.next = function(selector) {
  if (!this[0]) {
    return renderer();
  }
  var next = renderer(this[0].nextSibling);
  if (!arguments.length) {
    return next;
  }
  while (next && next.length) {
    if (next.is(selector)) {
      return next;
    }
    next = next.next();
  }
  return renderer();
};
initRender.prototype.prev = function() {
  if (!this[0]) {
    return renderer();
  }
  return renderer(this[0].previousSibling);
};
initRender.prototype.add = function(selector) {
  var targets = renderer(selector);
  var result = this.toArray();
  for (var i = 0; i < targets.length; i++) {
    var target = targets[i];
    if (-1 === result.indexOf(target)) {
      result.push(target);
    }
  }
  return renderer(result);
};
var emptyArray = [];
initRender.prototype.splice = function() {
  return renderer(emptyArray.splice.apply(this, arguments));
};
initRender.prototype.slice = function() {
  return renderer(emptyArray.slice.apply(this, arguments));
};
initRender.prototype.toArray = function() {
  return emptyArray.slice.call(this);
};
initRender.prototype.offset = function() {
  if (!this[0]) {
    return;
  }
  return getOffset(this[0]);
};
initRender.prototype.offsetParent = function() {
  if (!this[0]) {
    return renderer();
  }
  var offsetParent = renderer(this[0].offsetParent);
  while (offsetParent[0] && "static" === offsetParent.css("position")) {
    offsetParent = renderer(offsetParent[0].offsetParent);
  }
  offsetParent = offsetParent[0] ? offsetParent : renderer(dom_adapter_default.getDocumentElement());
  return offsetParent;
};
initRender.prototype.position = function() {
  if (!this[0]) {
    return;
  }
  var offset;
  var marginTop = parseFloat(this.css("marginTop"));
  var marginLeft = parseFloat(this.css("marginLeft"));
  if ("fixed" === this.css("position")) {
    offset = this[0].getBoundingClientRect();
    return {
      top: offset.top - marginTop,
      left: offset.left - marginLeft
    };
  }
  offset = this.offset();
  var offsetParent = this.offsetParent();
  var parentOffset = {
    top: 0,
    left: 0
  };
  if ("HTML" !== offsetParent[0].nodeName) {
    parentOffset = offsetParent.offset();
  }
  parentOffset = {
    top: parentOffset.top + parseFloat(offsetParent.css("borderTopWidth")),
    left: parentOffset.left + parseFloat(offsetParent.css("borderLeftWidth"))
  };
  return {
    top: offset.top - parentOffset.top - marginTop,
    left: offset.left - parentOffset.left - marginLeft
  };
};
[{
  name: "scrollLeft",
  offsetProp: "pageXOffset",
  scrollWindow: function(win, value) {
    win.scrollTo(value, win.pageYOffset);
  }
}, {
  name: "scrollTop",
  offsetProp: "pageYOffset",
  scrollWindow: function(win, value) {
    win.scrollTo(win.pageXOffset, value);
  }
}].forEach(function(directionStrategy) {
  var propName = directionStrategy.name;
  initRender.prototype[propName] = function(value) {
    if (!this[0]) {
      return;
    }
    var window7 = getWindowByElement(this[0]);
    if (void 0 === value) {
      return window7 ? window7[directionStrategy.offsetProp] : this[0][propName];
    }
    if (window7) {
      directionStrategy.scrollWindow(window7, value);
    } else {
      this[0][propName] = value;
    }
    return this;
  };
});
initRender.prototype.data = function(key, value) {
  if (!this[0]) {
    return;
  }
  if (arguments.length < 2) {
    return data.call(renderer, this[0], key);
  }
  data.call(renderer, this[0], key, value);
  return this;
};
initRender.prototype.removeData = function(key) {
  this[0] && removeData(this[0], key);
  return this;
};
var rendererWrapper = function() {
  return renderer.apply(this, arguments);
};
Object.defineProperty(rendererWrapper, "fn", {
  enumerable: true,
  configurable: true,
  get: function() {
    return renderer.fn;
  },
  set: function(value) {
    renderer.fn = value;
  }
});
var renderer_base_default = {
  set: function(strategy2) {
    renderer = strategy2;
  },
  get: function() {
    return rendererWrapper;
  }
};

// node_modules/devextreme/esm/core/renderer.js
var renderer_default = renderer_base_default.get();

// node_modules/devextreme/esm/core/http_request.js
init_dependency_injector();
var window5 = getWindow();
var nativeXMLHttpRequest = {
  getXhr: function() {
    return new window5.XMLHttpRequest();
  }
};
var http_request_default = dependency_injector_default(nativeXMLHttpRequest);

// node_modules/devextreme/esm/core/utils/ready_callbacks.js
init_dependency_injector();
var callbacks = [];
var subscribeReady = call_once_default(() => {
  var removeListener = dom_adapter_default.listen(dom_adapter_default.getDocument(), "DOMContentLoaded", () => {
    readyCallbacks.fire();
    removeListener();
  });
});
var readyCallbacks = {
  add: (callback) => {
    var windowExists = hasWindow();
    if (windowExists && "loading" !== dom_adapter_default.getReadyState()) {
      callback();
    } else {
      callbacks.push(callback);
      windowExists && subscribeReady();
    }
  },
  fire: () => {
    callbacks.forEach((callback) => callback());
    callbacks = [];
  }
};
var ready_callbacks_default = dependency_injector_default(readyCallbacks);

// node_modules/devextreme/esm/core/utils/ajax.js
init_deferred();
init_extend();
init_type();
init_dependency_injector();
var window6 = getWindow();
var SUCCESS = "success";
var ERROR = "error";
var TIMEOUT = "timeout";
var NO_CONTENT = "nocontent";
var PARSER_ERROR = "parsererror";
var isStatusSuccess = function(status) {
  return 200 <= status && status < 300;
};
var hasContent = function(status) {
  return 204 !== status;
};
var paramsConvert = function(params) {
  var result = [];
  for (var name in params) {
    var value = params[name];
    if (void 0 === value) {
      continue;
    }
    if (null === value) {
      value = "";
    }
    if ("function" === typeof value) {
      value = value();
    }
    result.push(encodeURIComponent(name) + "=" + encodeURIComponent(value));
  }
  return result.join("&");
};
var createScript = function(options) {
  var script = dom_adapter_default.createElement("script");
  for (var name in options) {
    script[name] = options[name];
  }
  return script;
};
var removeScript = function(scriptNode) {
  scriptNode.parentNode.removeChild(scriptNode);
};
var appendToHead = function(element) {
  return dom_adapter_default.getHead().appendChild(element);
};
var evalScript = function(code) {
  var script = createScript({
    text: code
  });
  appendToHead(script);
  removeScript(script);
};
var evalCrossDomainScript = function(url) {
  var script = createScript({
    src: url
  });
  return new Promise(function(resolve, reject) {
    var events = {
      load: resolve,
      error: reject
    };
    var loadHandler = function(e) {
      events[e.type]();
      removeScript(script);
    };
    for (var event in events) {
      dom_adapter_default.listen(script, event, loadHandler);
    }
    appendToHead(script);
  });
};
var getAcceptHeader = function(options) {
  var dataType = options.dataType || "*";
  var scriptAccept = "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript";
  var accepts = {
    "*": "*/*",
    text: "text/plain",
    html: "text/html",
    xml: "application/xml, text/xml",
    json: "application/json, text/javascript",
    jsonp: scriptAccept,
    script: scriptAccept
  };
  extendFromObject(accepts, options.accepts, true);
  return accepts[dataType] ? accepts[dataType] + ("*" !== dataType ? ", */*; q=0.01" : "") : accepts["*"];
};
var getContentTypeHeader = function(options) {
  var defaultContentType;
  if (options.data && !options.upload && "GET" !== getMethod(options)) {
    defaultContentType = "application/x-www-form-urlencoded;charset=utf-8";
  }
  return options.contentType || defaultContentType;
};
var getDataFromResponse = function(xhr) {
  return xhr.responseType && "text" !== xhr.responseType || "string" !== typeof xhr.responseText ? xhr.response : xhr.responseText;
};
var postProcess = function(deferred, xhr, dataType) {
  var data2 = getDataFromResponse(xhr);
  switch (dataType) {
    case "jsonp":
      evalScript(data2);
      break;
    case "script":
      evalScript(data2);
      deferred.resolve(data2, SUCCESS, xhr);
      break;
    case "json":
      try {
        deferred.resolve(JSON.parse(data2), SUCCESS, xhr);
      } catch (e) {
        deferred.reject(xhr, PARSER_ERROR, e);
      }
      break;
    default:
      deferred.resolve(data2, SUCCESS, xhr);
  }
};
var isCrossDomain = function(url) {
  if (!hasWindow()) {
    return true;
  }
  var crossDomain = false;
  var originAnchor = dom_adapter_default.createElement("a");
  var urlAnchor = dom_adapter_default.createElement("a");
  originAnchor.href = window6.location.href;
  try {
    urlAnchor.href = url;
    urlAnchor.href = urlAnchor.href;
    crossDomain = originAnchor.protocol + "//" + originAnchor.host !== urlAnchor.protocol + "//" + urlAnchor.host;
  } catch (e) {
    crossDomain = true;
  }
  return crossDomain;
};
var setHttpTimeout = function(timeout, xhr) {
  return timeout && setTimeout(function() {
    xhr.customStatus = TIMEOUT;
    xhr.abort();
  }, timeout);
};
var getJsonpOptions = function(options) {
  if ("jsonp" === options.dataType) {
    var random = Math.random().toString().replace(/\D/g, "");
    var callbackName = options.jsonpCallback || "dxCallback" + Date.now() + "_" + random;
    var callbackParameter = options.jsonp || "callback";
    options.data = options.data || {};
    options.data[callbackParameter] = callbackName;
    return callbackName;
  }
};
var getRequestOptions = function(options, headers) {
  var params = options.data;
  var paramsAlreadyString = "string" === typeof params;
  var url = options.url || window6.location.href;
  if (!paramsAlreadyString && !options.cache) {
    params = params || {};
    params._ = Date.now();
  }
  if (params && !options.upload) {
    if (!paramsAlreadyString) {
      params = paramsConvert(params);
    }
    if ("GET" === getMethod(options)) {
      if ("" !== params) {
        url += (url.indexOf("?") > -1 ? "&" : "?") + params;
      }
      params = null;
    } else if (headers["Content-Type"] && headers["Content-Type"].indexOf("application/x-www-form-urlencoded") > -1) {
      params = params.replace(/%20/g, "+");
    }
  }
  return {
    url,
    parameters: params
  };
};
function getMethod(options) {
  return (options.method || "GET").toUpperCase();
}
var getRequestHeaders = function(options) {
  var headers = options.headers || {};
  headers["Content-Type"] = headers["Content-Type"] || getContentTypeHeader(options);
  headers.Accept = headers.Accept || getAcceptHeader(options);
  if (!options.crossDomain && !headers["X-Requested-With"]) {
    headers["X-Requested-With"] = "XMLHttpRequest";
  }
  return headers;
};
var sendRequest = function(options) {
  var xhr = http_request_default.getXhr();
  var d = new Deferred();
  var result = d.promise();
  var async = isDefined(options.async) ? options.async : true;
  var dataType = options.dataType;
  var timeout = options.timeout || 0;
  var timeoutId;
  options.crossDomain = isCrossDomain(options.url);
  var needScriptEvaluation = "jsonp" === dataType || "script" === dataType;
  if (void 0 === options.cache) {
    options.cache = !needScriptEvaluation;
  }
  var callbackName = getJsonpOptions(options);
  var headers = getRequestHeaders(options);
  var requestOptions = getRequestOptions(options, headers);
  var url = requestOptions.url;
  var parameters = requestOptions.parameters;
  if (callbackName) {
    window6[callbackName] = function(data2) {
      d.resolve(data2, SUCCESS, xhr);
    };
  }
  if (options.crossDomain && needScriptEvaluation) {
    evalCrossDomainScript(url).then(function() {
      if ("jsonp" === dataType) {
        return;
      }
      d.resolve(null, SUCCESS, xhr);
    }, function() {
      d.reject(xhr, ERROR);
    });
    return result;
  }
  if (options.crossDomain && !("withCredentials" in xhr)) {
    d.reject(xhr, ERROR);
    return result;
  }
  xhr.open(getMethod(options), url, async, options.username, options.password);
  if (async) {
    xhr.timeout = timeout;
    timeoutId = setHttpTimeout(timeout, xhr);
  }
  xhr.onreadystatechange = function(e) {
    if (4 === xhr.readyState) {
      clearTimeout(timeoutId);
      if (isStatusSuccess(xhr.status)) {
        if (hasContent(xhr.status)) {
          postProcess(d, xhr, dataType);
        } else {
          d.resolve(null, NO_CONTENT, xhr);
        }
      } else {
        d.reject(xhr, xhr.customStatus || ERROR);
      }
    }
  };
  if (options.upload) {
    xhr.upload.onprogress = options.upload.onprogress;
    xhr.upload.onloadstart = options.upload.onloadstart;
    xhr.upload.onabort = options.upload.onabort;
  }
  if (options.xhrFields) {
    for (var field in options.xhrFields) {
      xhr[field] = options.xhrFields[field];
    }
  }
  if ("arraybuffer" === options.responseType) {
    xhr.responseType = options.responseType;
  }
  for (var name in headers) {
    if (Object.prototype.hasOwnProperty.call(headers, name) && isDefined(headers[name])) {
      xhr.setRequestHeader(name, headers[name]);
    }
  }
  if (options.beforeSend) {
    options.beforeSend(xhr);
  }
  xhr.send(parameters);
  result.abort = function() {
    xhr.abort();
  };
  return result;
};
var ajax_default = dependency_injector_default({
  sendRequest
});

// node_modules/devextreme-angular/fesm2015/devextreme-angular-core.js
init_deferred();
var DxTemplateHost = class {
  setHost(host) {
    this.host = host;
  }
  setTemplate(template) {
    this.host.setTemplate(template);
  }
};
var NgEventsStrategy = class {
  constructor(instance, zone) {
    this.instance = instance;
    this.zone = zone;
    this.subscriptions = {};
    this.events = {};
  }
  hasEvent(name) {
    return this.getEmitter(name).observers.length !== 0;
  }
  fireEvent(name, args) {
    const emitter = this.getEmitter(name);
    if (emitter.observers.length) {
      const internalSubs = this.subscriptions[name] || [];
      if (internalSubs.length === emitter.observers.length) {
        emitter.next(args && args[0]);
      } else {
        this.zone.run(() => emitter.next(args && args[0]));
      }
    }
  }
  on(name, handler) {
    if (typeof name === "string") {
      const eventSubscriptions = this.subscriptions[name] || [];
      const subcription = this.getEmitter(name).subscribe(handler === null || handler === void 0 ? void 0 : handler.bind(this.instance));
      const unsubscribe = subcription.unsubscribe.bind(subcription);
      eventSubscriptions.push({ handler, unsubscribe });
      this.subscriptions[name] = eventSubscriptions;
    } else {
      const handlersObj = name;
      Object.keys(handlersObj).forEach((event) => this.on(event, handlersObj[event]));
    }
  }
  off(name, handler) {
    const eventSubscriptions = this.subscriptions[name] || [];
    if (handler) {
      eventSubscriptions.some((subscription, i) => {
        if (subscription.handler === handler) {
          subscription.unsubscribe();
          eventSubscriptions.splice(i, 1);
          return true;
        }
        return false;
      });
    } else {
      eventSubscriptions.forEach((subscription) => {
        subscription.unsubscribe();
      });
      eventSubscriptions.splice(0, eventSubscriptions.length);
    }
  }
  dispose() {
  }
  addEmitter(eventName, emitter) {
    this.events[eventName] = emitter;
  }
  getEmitter(eventName) {
    if (!this.events[eventName]) {
      this.events[eventName] = new EventEmitter();
    }
    return this.events[eventName];
  }
};
var EmitterHelper = class {
  constructor(zone, component) {
    this.zone = zone;
    this.component = component;
    this.lockedValueChangeEvent = false;
  }
  fireNgEvent(eventName, eventArgs) {
    if (this.lockedValueChangeEvent && eventName === "valueChange") {
      return;
    }
    const emitter = this.component[eventName];
    if (emitter && emitter.observers.length) {
      this.zone.run(() => {
        emitter.next(eventArgs && eventArgs[0]);
      });
    }
  }
  createEmitters(events) {
    events.forEach((event) => {
      this.component[event.emit] = new EventEmitter();
    });
  }
};
var WatcherHelper = class {
  constructor() {
    this._watchers = [];
  }
  getWatchMethod() {
    const watchMethod = (valueGetter, valueChangeCallback, options) => {
      let oldValue = valueGetter();
      options = options || {};
      if (!options.skipImmediate) {
        valueChangeCallback(oldValue);
      }
      const watcher = () => {
        const newValue = valueGetter();
        if (this._isDifferentValues(oldValue, newValue, options.deep)) {
          valueChangeCallback(newValue);
          oldValue = newValue;
        }
      };
      this._watchers.push(watcher);
      return () => {
        const index = this._watchers.indexOf(watcher);
        if (index !== -1) {
          this._watchers.splice(index, 1);
        }
      };
    };
    return watchMethod;
  }
  _isDifferentValues(oldValue, newValue, deepCheck) {
    const comparableNewValue = this._toComparable(newValue);
    const comparableOldValue = this._toComparable(oldValue);
    const isObjectValues = comparableNewValue instanceof Object && comparableOldValue instanceof Object;
    if (deepCheck && isObjectValues) {
      return this._checkObjectsFields(newValue, oldValue);
    }
    return comparableNewValue !== comparableOldValue;
  }
  _toComparable(value) {
    if (value instanceof Date) {
      return value.getTime();
    }
    return value;
  }
  _checkObjectsFields(checkingFromObject, checkingToObject) {
    for (const field in checkingFromObject) {
      const oldValue = this._toComparable(checkingFromObject[field]);
      const newValue = this._toComparable(checkingToObject[field]);
      let isEqualObjects = false;
      if (typeof oldValue === "object" && typeof newValue === "object") {
        isEqualObjects = equalByValue(oldValue, newValue);
      }
      if (oldValue !== newValue && !isEqualObjects) {
        return true;
      }
    }
  }
  checkWatchers() {
    for (const watcher of this._watchers) {
      watcher();
    }
  }
};
WatcherHelper.ɵfac = function WatcherHelper_Factory(t) {
  return new (t || WatcherHelper)();
};
WatcherHelper.ɵprov = /** @pureOrBreakMyCode */
ɵɵdefineInjectable({ token: WatcherHelper, factory: WatcherHelper.ɵfac });
(function() {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(WatcherHelper, [{
    type: Injectable
  }], null, null);
})();
function getElement(element) {
  return element.get ? element.get(0) : element;
}
var DX_TEMPLATE_WRAPPER_CLASS = "dx-template-wrapper";
var RenderData = class {
};
var DxTemplateDirective = class {
  constructor(templateRef, viewContainerRef, templateHost, renderer2, zone) {
    this.templateRef = templateRef;
    this.viewContainerRef = viewContainerRef;
    this.renderer = renderer2;
    this.zone = zone;
    templateHost.setTemplate(this);
  }
  set dxTemplateOf(value) {
    this.name = value;
  }
  renderTemplate(renderData) {
    const childView = this.viewContainerRef.createEmbeddedView(this.templateRef, {
      $implicit: renderData.model,
      index: renderData.index
    });
    const container = getElement(renderData.container);
    if (renderData.container) {
      childView.rootNodes.forEach((element) => {
        this.renderer.appendChild(container, element);
      });
    }
    return childView;
  }
  render(renderData) {
    let childView;
    if (this.zone.isStable) {
      childView = this.zone.run(() => this.renderTemplate(renderData));
    } else {
      childView = this.renderTemplate(renderData);
    }
    childView.detectChanges();
    childView.rootNodes.forEach((element) => {
      if (element.nodeType === 1) {
        dom_adapter_default.setClass(element, DX_TEMPLATE_WRAPPER_CLASS, true);
      }
      one(element, "dxremove", ({}, params) => {
        if (!params || !params._angularIntegration) {
          childView.destroy();
        }
      });
    });
    return childView.rootNodes;
  }
};
DxTemplateDirective.ɵfac = function DxTemplateDirective_Factory(t) {
  return new (t || DxTemplateDirective)(ɵɵdirectiveInject(TemplateRef), ɵɵdirectiveInject(ViewContainerRef), ɵɵdirectiveInject(DxTemplateHost), ɵɵdirectiveInject(Renderer2), ɵɵdirectiveInject(NgZone));
};
DxTemplateDirective.ɵdir = /** @pureOrBreakMyCode */
ɵɵdefineDirective({ type: DxTemplateDirective, selectors: [["", "dxTemplate", ""]], inputs: { dxTemplateOf: "dxTemplateOf" } });
(function() {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DxTemplateDirective, [{
    type: Directive,
    args: [{
      selector: "[dxTemplate]"
    }]
  }], function() {
    return [{ type: TemplateRef }, { type: ViewContainerRef }, { type: DxTemplateHost }, { type: Renderer2 }, { type: NgZone }];
  }, { dxTemplateOf: [{
    type: Input
  }] });
})();
var DxTemplateModule = class {
};
DxTemplateModule.ɵfac = function DxTemplateModule_Factory(t) {
  return new (t || DxTemplateModule)();
};
DxTemplateModule.ɵmod = /** @pureOrBreakMyCode */
ɵɵdefineNgModule({ type: DxTemplateModule });
DxTemplateModule.ɵinj = /** @pureOrBreakMyCode */
ɵɵdefineInjector({});
(function() {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DxTemplateModule, [{
    type: NgModule,
    args: [{
      declarations: [DxTemplateDirective],
      exports: [DxTemplateDirective]
    }]
  }], null, null);
})();
(function() {
  (typeof ngJitMode === "undefined" || ngJitMode) && ɵɵsetNgModuleScope(DxTemplateModule, { declarations: [DxTemplateDirective], exports: [DxTemplateDirective] });
})();
var VISIBILITY_CHANGE_SELECTOR = "dx-visibility-change-handler";
var BaseNestedOption = class {
  constructor() {
    this._initialOptions = {};
    this._collectionContainerImpl = new CollectionNestedOptionContainerImpl(this._setOption.bind(this), this._filterItems.bind(this));
  }
  _optionChangedHandler(e) {
    const fullOptionPath = this._fullOptionPath();
    if (e.fullName.indexOf(fullOptionPath) === 0) {
      const optionName = e.fullName.slice(fullOptionPath.length);
      const emitter = this[`${optionName}Change`];
      if (emitter) {
        emitter.next(e.value);
      }
    }
  }
  _createEventEmitters(events) {
    events.forEach((event) => {
      this[event.emit] = new EventEmitter();
    });
  }
  _getOption(name) {
    if (this.isLinked) {
      return this.instance.option(this._fullOptionPath() + name);
    }
    return this._initialOptions[name];
  }
  _setOption(name, value) {
    if (this.isLinked) {
      const fullPath = this._fullOptionPath() + name;
      this.instance.option(fullPath, value);
    } else {
      this._initialOptions[name] = value;
    }
  }
  _addRemovedOption(name) {
    if (this.instance && this.removedNestedComponents) {
      this.removedNestedComponents.push(name);
    }
  }
  _deleteRemovedOptions(name) {
    if (this.instance && this.removedNestedComponents) {
      this.removedNestedComponents = this.removedNestedComponents.filter((x) => !x.startsWith(name));
    }
  }
  _addRecreatedComponent() {
    if (this.instance && this.recreatedNestedComponents) {
      this.recreatedNestedComponents.push({ getOptionPath: () => this._getOptionPath() });
    }
  }
  _getOptionPath() {
    return this._hostOptionPath() + this._optionPath;
  }
  setHost(host, optionPath) {
    this._host = host;
    this._hostOptionPath = optionPath;
    this.optionChangedHandlers.subscribe(this._optionChangedHandler.bind(this));
  }
  setChildren(propertyName, items) {
    this.resetOptions(propertyName);
    return this._collectionContainerImpl.setChildren(propertyName, items);
  }
  _filterItems(items) {
    return items.filter((item) => item !== this);
  }
  get instance() {
    return this._host && this._host.instance;
  }
  get resetOptions() {
    return this._host && this._host.resetOptions;
  }
  get isRecreated() {
    return this._host && this._host.isRecreated;
  }
  get removedNestedComponents() {
    return this._host && this._host.removedNestedComponents;
  }
  set removedNestedComponents(value) {
    this._host.removedNestedComponents = value;
  }
  get recreatedNestedComponents() {
    return this._host && this._host.recreatedNestedComponents;
  }
  set recreatedNestedComponents(value) {
    this._host.recreatedNestedComponents = value;
  }
  get isLinked() {
    return !!this.instance && this._host.isLinked;
  }
  get optionChangedHandlers() {
    return this._host && this._host.optionChangedHandlers;
  }
};
BaseNestedOption.ɵfac = function BaseNestedOption_Factory(t) {
  return new (t || BaseNestedOption)();
};
BaseNestedOption.ɵcmp = /** @pureOrBreakMyCode */
ɵɵdefineComponent({ type: BaseNestedOption, selectors: [["ng-component"]], decls: 0, vars: 0, template: function BaseNestedOption_Template(rf, ctx) {
}, encapsulation: 2 });
(function() {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BaseNestedOption, [{
    type: Component,
    args: [{
      template: ""
    }]
  }], function() {
    return [];
  }, null);
})();
var CollectionNestedOptionContainerImpl = class {
  constructor(_setOption, _filterItems) {
    this._setOption = _setOption;
    this._filterItems = _filterItems;
    this._activatedQueries = {};
  }
  setChildren(propertyName, items) {
    if (this._filterItems) {
      items = this._filterItems(items);
    }
    if (items.length) {
      this._activatedQueries[propertyName] = true;
    }
    if (this._activatedQueries[propertyName]) {
      const widgetItems = items.map((item, index) => {
        item._index = index;
        return item._value;
      });
      this._setOption(propertyName, widgetItems);
    }
  }
};
var NestedOption = class extends BaseNestedOption {
  setHost(host, optionPath) {
    super.setHost(host, optionPath);
    this._host[this._optionPath] = this._initialOptions;
  }
  _fullOptionPath() {
    return `${this._getOptionPath()}.`;
  }
};
NestedOption.ɵfac = /** @pureOrBreakMyCode */
/* @__PURE__ */ function() {
  let ɵNestedOption_BaseFactory;
  return function NestedOption_Factory(t) {
    return (ɵNestedOption_BaseFactory || (ɵNestedOption_BaseFactory = ɵɵgetInheritedFactory(NestedOption)))(t || NestedOption);
  };
}();
NestedOption.ɵcmp = /** @pureOrBreakMyCode */
ɵɵdefineComponent({ type: NestedOption, selectors: [["ng-component"]], features: [ɵɵInheritDefinitionFeature], decls: 0, vars: 0, template: function NestedOption_Template(rf, ctx) {
}, encapsulation: 2 });
(function() {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(NestedOption, [{
    type: Component,
    args: [{
      template: ""
    }]
  }], null, null);
})();
var CollectionNestedOption = class extends BaseNestedOption {
  _fullOptionPath() {
    return `${this._getOptionPath()}[${this._index}].`;
  }
  get _value() {
    return this._initialOptions;
  }
  get isLinked() {
    return this._index !== void 0 && !!this.instance && this._host.isLinked;
  }
};
CollectionNestedOption.ɵfac = /** @pureOrBreakMyCode */
/* @__PURE__ */ function() {
  let ɵCollectionNestedOption_BaseFactory;
  return function CollectionNestedOption_Factory(t) {
    return (ɵCollectionNestedOption_BaseFactory || (ɵCollectionNestedOption_BaseFactory = ɵɵgetInheritedFactory(CollectionNestedOption)))(t || CollectionNestedOption);
  };
}();
CollectionNestedOption.ɵcmp = /** @pureOrBreakMyCode */
ɵɵdefineComponent({ type: CollectionNestedOption, selectors: [["ng-component"]], features: [ɵɵInheritDefinitionFeature], decls: 0, vars: 0, template: function CollectionNestedOption_Template(rf, ctx) {
}, encapsulation: 2 });
(function() {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CollectionNestedOption, [{
    type: Component,
    args: [{
      template: ""
    }]
  }], null, null);
})();
var triggerShownEvent = function(element) {
  const changeHandlers = [];
  if (!renderer_default(element).hasClass(VISIBILITY_CHANGE_SELECTOR)) {
    changeHandlers.push(element);
  }
  changeHandlers.push.apply(changeHandlers, element.querySelectorAll(`.${VISIBILITY_CHANGE_SELECTOR}`));
  for (let i = 0; i < changeHandlers.length; i++) {
    triggerHandler(changeHandlers[i], "dxshown");
  }
};
function extractTemplate(option, element, renderer2, document2) {
  if (!option.template === void 0 || !element.nativeElement.hasChildNodes()) {
    return;
  }
  const childNodes = [].slice.call(element.nativeElement.childNodes);
  const userContent = childNodes.filter((n) => {
    if (n.tagName) {
      const tagNamePrefix = n.tagName.toLowerCase().substr(0, 3);
      return !(tagNamePrefix === "dxi" || tagNamePrefix === "dxo");
    }
    return n.nodeName !== "#comment" && n.textContent.replace(/\s/g, "").length;
  });
  if (!userContent.length) {
    return;
  }
  option.template = {
    render: (renderData) => {
      const result = element.nativeElement;
      dom_adapter_default.setClass(result, DX_TEMPLATE_WRAPPER_CLASS, true);
      if (renderData.container) {
        const container = getElement(renderData.container);
        const resultInContainer = container.contains(element.nativeElement);
        renderer2.appendChild(container, element.nativeElement);
        if (!resultInContainer) {
          const resultInBody = document2.body.contains(container);
          if (resultInBody) {
            triggerShownEvent(result);
          }
        }
      }
      return result;
    }
  };
}
var NestedOptionHost = class {
  getHost() {
    return this._host;
  }
  setHost(host, optionPath) {
    this._host = host;
    this._optionPath = optionPath || (() => "");
  }
  setNestedOption(nestedOption) {
    nestedOption.setHost(this._host, this._optionPath);
  }
};
var serverStateKey;
var getServerStateKey = () => {
  if (!serverStateKey) {
    serverStateKey = makeStateKey("DX_isPlatformServer");
  }
  return serverStateKey;
};
var DxComponent = class {
  constructor(element, ngZone, templateHost, watcherHelper, transferState, platformId) {
    this.element = element;
    this.ngZone = ngZone;
    this.watcherHelper = watcherHelper;
    this.transferState = transferState;
    this.platformId = platformId;
    this._initialOptions = {};
    this._optionsToUpdate = {};
    this.optionChangedHandlers = new EventEmitter();
    this.isLinked = true;
    this.changedOptions = {};
    this.removedNestedComponents = [];
    this.widgetUpdateLocked = false;
    this.templateUpdateRequired = false;
    this.templates = [];
    templateHost.setHost(this);
    this._collectionContainerImpl = new CollectionNestedOptionContainerImpl(this._setOption.bind(this));
    this.eventHelper = new EmitterHelper(ngZone, this);
  }
  _updateTemplates() {
    if (this.templates.length && this.templateUpdateRequired) {
      const updatedTemplates = {};
      this.templates.forEach((template) => {
        updatedTemplates[template.name] = template;
      });
      this.instance.option("integrationOptions.templates", updatedTemplates);
      this.templates = Object.values(updatedTemplates);
      this.templateUpdateRequired = false;
    }
  }
  _initEvents() {
    this.instance.on("optionChanged", (e) => {
      this.changedOptions[e.name] = e.value;
      const value = e.name === e.fullName ? e.value : e.component.option(e.name);
      this.eventHelper.fireNgEvent(`${e.name}Change`, [value]);
      this.optionChangedHandlers.emit(e);
    });
  }
  _initOptions() {
    this._initialOptions.integrationOptions.watchMethod = this.watcherHelper.getWatchMethod();
  }
  _initPlatform() {
    if (this.transferState.hasKey(getServerStateKey())) {
      this._initialOptions.integrationOptions.renderedOnServer = this.transferState.get(getServerStateKey(), null);
    } else if (isPlatformServer(this.platformId)) {
      this.transferState.set(getServerStateKey(), true);
    }
  }
  _createEventEmitters(events) {
    const zone = this.ngZone;
    this.eventHelper.createEmitters(events);
    this._initialOptions.eventsStrategy = (instance) => {
      const strategy2 = new NgEventsStrategy(instance, zone);
      events.filter((event) => event.subscribe).forEach((event) => {
        strategy2.addEmitter(event.subscribe, this[event.emit]);
      });
      return strategy2;
    };
    this._initialOptions.nestedComponentOptions = function(component) {
      return {
        eventsStrategy: (instance) => new NgEventsStrategy(instance, zone),
        nestedComponentOptions: component.option("nestedComponentOptions")
      };
    };
  }
  _shouldOptionChange(name, value) {
    if (this.changedOptions.hasOwnProperty(name)) {
      const prevValue = this.changedOptions[name];
      delete this.changedOptions[name];
      return value !== prevValue;
    }
    return true;
  }
  clearChangedOptions() {
    this.changedOptions = {};
  }
  _getOption(name) {
    return this.instance ? this.instance.option(name) : this._initialOptions[name];
  }
  lockWidgetUpdate() {
    if (!this.widgetUpdateLocked && this.instance) {
      this.instance.beginUpdate();
      this.widgetUpdateLocked = true;
    }
  }
  unlockWidgetUpdate() {
    if (this.widgetUpdateLocked) {
      this.widgetUpdateLocked = false;
      this.instance.endUpdate();
    }
  }
  _setOption(name, value) {
    this.lockWidgetUpdate();
    if (!this._shouldOptionChange(name, value)) {
      return;
    }
    if (this.instance) {
      this.instance.option(name, value);
    } else {
      this._initialOptions[name] = value;
    }
  }
  _createWidget(element) {
    this._initialOptions.integrationOptions = {};
    this._initPlatform();
    this._initOptions();
    this._initialOptions.onInitializing = function() {
      this.beginUpdate();
    };
    this.instance = this._createInstance(element, this._initialOptions);
    this._initEvents();
    this._initialOptions = {};
  }
  _destroyWidget() {
    this.removedNestedComponents = [];
    if (this.instance) {
      const element = this.instance.element();
      triggerHandler(element, "dxremove", { _angularIntegration: true });
      this.instance.dispose();
      dom_adapter_default.removeElement(element);
    }
  }
  ngOnChanges(changes) {
    for (const key in changes) {
      const change = changes[key];
      if (change.currentValue !== this[key]) {
        this._optionsToUpdate[key] = changes[key].currentValue;
      }
    }
  }
  ngOnInit() {
    this._createWidget(this.element.nativeElement);
  }
  ngDoCheck() {
    this.applyOptions();
  }
  ngAfterContentChecked() {
    this.applyOptions();
    this.resetOptions();
    this.unlockWidgetUpdate();
  }
  ngAfterViewInit() {
    this._updateTemplates();
    this.instance.endUpdate();
    this.recreatedNestedComponents = [];
  }
  ngAfterViewChecked() {
    this._updateTemplates();
  }
  applyOptions() {
    if (Object.keys(this._optionsToUpdate).length) {
      if (this.instance) {
        this.instance.option(this._optionsToUpdate);
      }
      this._optionsToUpdate = {};
    }
  }
  resetOptions(collectionName) {
    if (this.instance) {
      this.removedNestedComponents.filter((option) => option && !this.isRecreated(option) && collectionName ? option.startsWith(collectionName) : true).forEach((option) => {
        this.instance.resetOption(option);
      });
      this.removedNestedComponents = [];
      this.recreatedNestedComponents = [];
    }
  }
  isRecreated(name) {
    return this.recreatedNestedComponents && this.recreatedNestedComponents.some((nestedComponent) => nestedComponent.getOptionPath() === name);
  }
  setTemplate(template) {
    this.templates.push(template);
    this.templateUpdateRequired = true;
  }
  setChildren(propertyName, items) {
    this.resetOptions(propertyName);
    return this._collectionContainerImpl.setChildren(propertyName, items);
  }
};
DxComponent.ɵfac = function DxComponent_Factory(t) {
  return new (t || DxComponent)(ɵɵdirectiveInject(ElementRef), ɵɵdirectiveInject(NgZone), ɵɵdirectiveInject(DxTemplateHost), ɵɵdirectiveInject(WatcherHelper), ɵɵdirectiveInject(TransferState), ɵɵdirectiveInject(PLATFORM_ID));
};
DxComponent.ɵcmp = /** @pureOrBreakMyCode */
ɵɵdefineComponent({ type: DxComponent, selectors: [["ng-component"]], features: [ɵɵNgOnChangesFeature], decls: 0, vars: 0, template: function DxComponent_Template(rf, ctx) {
}, encapsulation: 2 });
(function() {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DxComponent, [{
    type: Component,
    args: [{
      template: ""
    }]
  }], function() {
    return [{ type: ElementRef }, { type: NgZone }, { type: DxTemplateHost }, { type: WatcherHelper }, { type: TransferState }, { type: void 0, decorators: [{
      type: Inject,
      args: [PLATFORM_ID]
    }] }];
  }, null);
})();
var DxComponentExtension = class extends DxComponent {
  createInstance(element) {
    this._createWidget(element);
  }
  ngOnInit() {
  }
  ngAfterViewInit() {
    this._createWidget(this.element.nativeElement);
    this.instance.endUpdate();
  }
};
DxComponentExtension.ɵfac = /** @pureOrBreakMyCode */
/* @__PURE__ */ function() {
  let ɵDxComponentExtension_BaseFactory;
  return function DxComponentExtension_Factory(t) {
    return (ɵDxComponentExtension_BaseFactory || (ɵDxComponentExtension_BaseFactory = ɵɵgetInheritedFactory(DxComponentExtension)))(t || DxComponentExtension);
  };
}();
DxComponentExtension.ɵcmp = /** @pureOrBreakMyCode */
ɵɵdefineComponent({ type: DxComponentExtension, selectors: [["ng-component"]], features: [ɵɵInheritDefinitionFeature], decls: 0, vars: 0, template: function DxComponentExtension_Template(rf, ctx) {
}, encapsulation: 2 });
(function() {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DxComponentExtension, [{
    type: Component,
    args: [{
      template: ""
    }]
  }], null, null);
})();
var outsideZoneEvents = ["mousemove", "mouseover", "mouseout"];
var insideZoneEvents = ["mouseup", "click", "mousedown", "transitionend", "wheel"];
var originalAdd;
var callbacks2 = [];
var readyCallbackAdd = function(callback) {
  if (!originalAdd) {
    originalAdd = this.callBase.bind(this);
  }
  callbacks2.push(callback);
};
ready_callbacks_default.inject({
  add(callback) {
    return readyCallbackAdd.call(this, callback);
  }
});
var doInjections = (document2, ngZone, xhrFactory) => {
  if (Number(VERSION.major) < 12) {
    console.warn("Your version of Angular is not supported. Please update your project to version 12 or later. Please refer to the Angular Update Guide for more information: https://update.angular.io");
  }
  dom_adapter_default.inject({
    _document: document2,
    listen(...args) {
      const eventName = args[1];
      if (outsideZoneEvents.includes(eventName)) {
        return ngZone.runOutsideAngular(() => this.callBase.apply(this, args));
      }
      if (ngZone.isStable && insideZoneEvents.includes(eventName)) {
        return ngZone.run(() => this.callBase.apply(this, args));
      }
      return this.callBase.apply(this, args);
    },
    isElementNode(element) {
      return element && element.nodeType === 1;
    },
    isTextNode(element) {
      return element && element.nodeType === 3;
    },
    isDocument(element) {
      return element && element.nodeType === 9;
    }
  });
  http_request_default.inject({
    getXhr() {
      if (!xhrFactory) {
        return this.callBase.apply(this);
      }
      const _xhr = xhrFactory.build();
      if (!("withCredentials" in _xhr)) {
        _xhr.withCredentials = false;
      }
      return _xhr;
    }
  });
  const runReadyCallbacksInZone = () => {
    ngZone.run(() => {
      events_engine_default.set({});
      callbacks2.forEach((callback) => originalAdd.call(null, callback));
      callbacks2 = [];
      ready_callbacks_default.fire();
    });
  };
  runReadyCallbacksInZone();
  readyCallbackAdd = (callback) => ngZone.run(() => callback());
  doInjections = runReadyCallbacksInZone;
};
var DxIntegrationModule = class {
  constructor(document2, ngZone, xhrFactory) {
    doInjections(document2, ngZone, xhrFactory);
  }
};
DxIntegrationModule.ɵfac = function DxIntegrationModule_Factory(t) {
  return new (t || DxIntegrationModule)(ɵɵinject(DOCUMENT), ɵɵinject(NgZone), ɵɵinject(XhrFactory, 8));
};
DxIntegrationModule.ɵmod = /** @pureOrBreakMyCode */
ɵɵdefineNgModule({ type: DxIntegrationModule });
DxIntegrationModule.ɵinj = /** @pureOrBreakMyCode */
ɵɵdefineInjector({});
(function() {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DxIntegrationModule, [{
    type: NgModule,
    args: [{}]
  }], function() {
    return [{ type: void 0, decorators: [{
      type: Inject,
      args: [DOCUMENT]
    }] }, { type: NgZone }, { type: XhrFactory, decorators: [{
      type: Optional
    }] }];
  }, null);
})();
function isIterable(value) {
  return value && typeof value[Symbol.iterator] === "function";
}
var IterableDifferHelper = class {
  constructor(_differs) {
    this._differs = _differs;
    this._propertyDiffers = {};
  }
  setHost(host) {
    this._host = host;
  }
  setup(prop, changes) {
    if (prop in changes) {
      const value = changes[prop].currentValue;
      this.setupSingle(prop, value);
    }
  }
  setupSingle(prop, value) {
    if (value && Array.isArray(value)) {
      if (!this._propertyDiffers[prop]) {
        try {
          this._propertyDiffers[prop] = this._differs.find(value).create(null);
          return true;
        } catch (e) {
        }
      }
    } else {
      delete this._propertyDiffers[prop];
    }
    return false;
  }
  getChanges(prop, value) {
    if (this._propertyDiffers[prop]) {
      return this._propertyDiffers[prop].diff(value);
    }
  }
  checkChangedOptions(propName, hostValue) {
    return this._host.changedOptions[propName] === hostValue;
  }
  doCheck(prop) {
    if (this._propertyDiffers[prop] && this._host.instance) {
      const hostValue = this._host[prop];
      const changes = isIterable(hostValue) && this.getChanges(prop, hostValue);
      if (changes && !this.checkChangedOptions(prop, hostValue)) {
        this._host.lockWidgetUpdate();
        this._host.instance.option(prop, hostValue);
      }
    }
  }
};
IterableDifferHelper.ɵfac = function IterableDifferHelper_Factory(t) {
  return new (t || IterableDifferHelper)(ɵɵinject(IterableDiffers));
};
IterableDifferHelper.ɵprov = /** @pureOrBreakMyCode */
ɵɵdefineInjectable({ token: IterableDifferHelper, factory: IterableDifferHelper.ɵfac });
(function() {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(IterableDifferHelper, [{
    type: Injectable
  }], function() {
    return [{ type: IterableDiffers }];
  }, null);
})();
var DxServerTransferStateModule = class {
  constructor(state, platformId) {
    this.state = state;
    this.platformId = platformId;
    const that = this;
    ajax_default.inject({
      sendRequest(...args) {
        const key = makeStateKey(that.generateKey(args));
        const cachedData = that.state.get(key, null);
        if (isPlatformServer(that.platformId)) {
          const result = this.callBase.apply(this, args);
          result.always((data2, status) => {
            const dataForCache = {
              data: data2,
              status
            };
            that.state.set(key, dataForCache);
          });
          return result;
        }
        if (cachedData) {
          const d = Deferred();
          d.resolve(cachedData.data, cachedData.status);
          that.state.set(key, null);
          return d.promise();
        }
        return this.callBase.apply(this, args);
      }
    });
  }
  generateKey(args) {
    let keyValue = "";
    for (const key in args) {
      if (typeof args[key] === "object") {
        const objKey = this.generateKey(args[key]);
        keyValue += key + objKey;
      } else {
        keyValue += key + args[key];
      }
    }
    return keyValue;
  }
};
DxServerTransferStateModule.ɵfac = function DxServerTransferStateModule_Factory(t) {
  return new (t || DxServerTransferStateModule)(ɵɵinject(TransferState), ɵɵinject(PLATFORM_ID));
};
DxServerTransferStateModule.ɵmod = /** @pureOrBreakMyCode */
ɵɵdefineNgModule({ type: DxServerTransferStateModule });
DxServerTransferStateModule.ɵinj = /** @pureOrBreakMyCode */
ɵɵdefineInjector({});
(function() {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(DxServerTransferStateModule, [{
    type: NgModule,
    args: [{}]
  }], function() {
    return [{ type: TransferState }, { type: void 0, decorators: [{
      type: Inject,
      args: [PLATFORM_ID]
    }] }];
  }, null);
})();

export {
  addShadowDomStyles,
  dom_adapter_default,
  MemorizedCallbacks,
  event_registrator_callbacks_default,
  hasWindow,
  getWindow,
  hasProperty,
  defaultScreenFactorFunc,
  getCurrentScreenFactor,
  getNavigator,
  call_once_default,
  events_engine_default,
  Event,
  data,
  beforeCleanData,
  removeData,
  cleanDataRecursive,
  styleProp,
  stylePropPrefix,
  normalizeStyleProp,
  setWidth,
  setHeight,
  setStyle,
  getElementBoxParams,
  parseHeight,
  addOffsetToMaxHeight,
  addOffsetToMinHeight,
  getVerticalOffsets,
  getVisibleHeight,
  getWidth,
  setWidth2,
  getHeight,
  setHeight2,
  getOuterWidth,
  setOuterWidth,
  getOuterHeight,
  setOuterHeight,
  getInnerWidth,
  getInnerHeight,
  getOffset,
  parseHTML,
  renderer_default,
  ready_callbacks_default,
  ajax_default,
  DxTemplateHost,
  NgEventsStrategy,
  EmitterHelper,
  WatcherHelper,
  getElement,
  DX_TEMPLATE_WRAPPER_CLASS,
  RenderData,
  DxTemplateDirective,
  DxTemplateModule,
  BaseNestedOption,
  CollectionNestedOptionContainerImpl,
  NestedOption,
  CollectionNestedOption,
  extractTemplate,
  NestedOptionHost,
  getServerStateKey,
  DxComponent,
  DxComponentExtension,
  DxIntegrationModule,
  IterableDifferHelper,
  DxServerTransferStateModule
};
/*! Bundled license information:

devextreme-angular/fesm2015/devextreme-angular-core.js:
  (*!
   * devextreme-angular
   * Version: 23.2.15
   * Build date: Mon Nov 10 2025
   *
   * Copyright (c) 2012 - 2025 Developer Express Inc. ALL RIGHTS RESERVED
   *
   * This software may be modified and distributed under the terms
   * of the MIT license. See the LICENSE file in the root of the project for details.
   *
   * https://github.com/DevExpress/devextreme-angular
   *)
*/
//# sourceMappingURL=chunk-E3L2KCM5.js.map
