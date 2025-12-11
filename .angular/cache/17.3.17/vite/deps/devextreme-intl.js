import {
  init_localization,
  localization_exports
} from "./chunk-IQXVETD3.js";
import {
  config_exports,
  init_config,
  init_version,
  version_exports
} from "./chunk-6XC77YAX.js";
import {
  __commonJS,
  __require,
  __toCommonJS
} from "./chunk-WOR4A3D2.js";

// node_modules/devextreme-intl/dist/devextreme-intl.js
var require_devextreme_intl = __commonJS({
  "node_modules/devextreme-intl/dist/devextreme-intl.js"(exports, module) {
    (function webpackUniversalModuleDefinition(root, factory) {
      if (typeof exports === "object" && typeof module === "object")
        module.exports = factory((init_config(), __toCommonJS(config_exports)), (init_localization(), __toCommonJS(localization_exports)), (init_version(), __toCommonJS(version_exports)));
      else if (typeof define === "function" && define.amd)
        define(["devextreme/core/config", "devextreme/localization", "devextreme/core/version"], factory);
      else {
        var a = typeof exports === "object" ? factory(__require(void 0), __require(void 0), __require(void 0)) : factory(root["DevExpress"]["config"], root["DevExpress"]["localization"], root["DevExpress"]["VERSION"]);
        for (var i in a) (typeof exports === "object" ? exports : root)[i] = a[i];
      }
    })(exports, function(__WEBPACK_EXTERNAL_MODULE_3__, __WEBPACK_EXTERNAL_MODULE_4__, __WEBPACK_EXTERNAL_MODULE_5__) {
      return (
        /******/
        function(modules) {
          var installedModules = {};
          function __webpack_require__(moduleId) {
            if (installedModules[moduleId])
              return installedModules[moduleId].exports;
            var module2 = installedModules[moduleId] = {
              /******/
              exports: {},
              /******/
              id: moduleId,
              /******/
              loaded: false
              /******/
            };
            modules[moduleId].call(module2.exports, module2, module2.exports, __webpack_require__);
            module2.loaded = true;
            return module2.exports;
          }
          __webpack_require__.m = modules;
          __webpack_require__.c = installedModules;
          __webpack_require__.p = "";
          return __webpack_require__(0);
        }([
          /* 0 */
          /***/
          function(module2, exports2, __webpack_require__) {
            __webpack_require__(1);
            __webpack_require__(8);
          },
          /* 1 */
          /***/
          function(module2, exports2, __webpack_require__) {
            var objectAssign = __webpack_require__(2);
            var dxConfig = __webpack_require__(3);
            var locale = __webpack_require__(4).locale;
            var numberLocalization = __webpack_require__(4).number;
            var dxVersion = __webpack_require__(5);
            var compareVersions = __webpack_require__(6).compare;
            var deprecationWarning = __webpack_require__(7);
            var currencyOptionsCache = {}, detectCurrencySymbolRegex = /([^\s0]+)?(\s*)0*[.,]*0*(\s*)([^\s0]+)?/, formattersCache = {}, getFormatter = function(format) {
              var key = locale() + "/" + JSON.stringify(format);
              if (!formattersCache[key]) {
                formattersCache[key] = new Intl.NumberFormat(locale(), format).format;
              }
              return formattersCache[key];
            }, getCurrencyFormatter = function(currency) {
              return new Intl.NumberFormat(locale(), { style: "currency", currency });
            };
            var intlNumberLocalization = {
              _formatNumberCore: function(value, format, formatConfig) {
                if (format === "exponential") {
                  return this.callBase.apply(this, arguments);
                }
                return getFormatter(this._normalizeFormatConfig(format, formatConfig))(value);
              },
              _normalizeFormatConfig: function(format, formatConfig, value) {
                var config;
                if (format === "decimal") {
                  config = {
                    minimumIntegerDigits: formatConfig.precision || 1,
                    useGrouping: false,
                    maximumFractionDigits: 0,
                    round: value < 0 ? "ceil" : "floor"
                  };
                } else {
                  config = this._getPrecisionConfig(formatConfig.precision);
                }
                if (format === "percent") {
                  config.style = "percent";
                } else if (format === "currency") {
                  config.style = "currency";
                  config.currency = formatConfig.currency || dxConfig().defaultCurrency;
                }
                return config;
              },
              _getPrecisionConfig: function(precision) {
                var config;
                if (precision === null) {
                  config = {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 20
                  };
                } else {
                  config = {
                    minimumFractionDigits: precision || 0,
                    maximumFractionDigits: precision || 0
                  };
                }
                return config;
              },
              format: function(value, format) {
                if ("number" !== typeof value) {
                  return value;
                }
                format = this._normalizeFormat(format);
                if (!format || "function" !== typeof format && !format.type && !format.formatter) {
                  return getFormatter(format)(value);
                }
                return this.callBase.apply(this, arguments);
              },
              parse: function(text, format) {
                if (compareVersions(dxVersion, "17.2.8") >= 0) {
                  return this.callBase.apply(this, arguments);
                }
                if (!text) {
                  return;
                }
                if (format && format.parser) {
                  return format.parser(text);
                }
                text = this._normalizeNumber(text, format);
                if (text.length > 15) {
                  return NaN;
                }
                return parseFloat(text);
              },
              _normalizeNumber: function(text, format) {
                var isExponentialRegexp = /^[-+]?[0-9]*.?[0-9]+([eE][-+]?[0-9]+)+$/, legitDecimalSeparator = ".";
                if (this.convertDigits) {
                  text = this.convertDigits(text, true);
                }
                if (isExponentialRegexp.test(text)) {
                  return text;
                }
                var decimalSeparator = this._getDecimalSeparator(format);
                var cleanUpRegexp = new RegExp("[^0-9-\\" + decimalSeparator + "]", "g");
                return text.replace(cleanUpRegexp, "").replace(decimalSeparator, legitDecimalSeparator);
              },
              _getDecimalSeparator: function(format) {
                return getFormatter(format)(0.1)[1];
              },
              _getCurrencySymbolInfo: function(currency) {
                var formatter = getCurrencyFormatter(currency);
                return this._extractCurrencySymbolInfo(formatter.format(0));
              },
              _extractCurrencySymbolInfo: function(currencyValueString) {
                var match = detectCurrencySymbolRegex.exec(currencyValueString) || [], position = match[1] ? "before" : "after", symbol = match[1] || match[4] || "", delimiter = match[2] || match[3] || "";
                return {
                  position,
                  symbol,
                  delimiter
                };
              },
              _getCurrencyOptions: function(currency) {
                var byCurrencyCache = currencyOptionsCache[locale()];
                if (!byCurrencyCache) {
                  byCurrencyCache = currencyOptionsCache[locale()] = {};
                }
                var result = byCurrencyCache[currency];
                if (!result) {
                  var formatter = getCurrencyFormatter(currency), options = formatter.resolvedOptions(), symbolInfo = this._getCurrencySymbolInfo(currency);
                  result = byCurrencyCache[currency] = objectAssign(options, {
                    currencySymbol: symbolInfo.symbol,
                    currencyPosition: symbolInfo.position,
                    currencyDelimiter: symbolInfo.delimiter
                  });
                }
                return result;
              },
              _repeatCharacter: function(character, times) {
                return Array(times + 1).join(character);
              },
              _createOpenXmlCurrencyFormat: function(options) {
                var result = this._repeatCharacter("0", options.minimumIntegerDigits);
                result += "{0}";
                if (options.useGrouping) {
                  result = "#," + this._repeatCharacter("#", 3 - options.minimumIntegerDigits) + result;
                }
                if (options.currencySymbol) {
                  if (options.currencyPosition === "before") {
                    result = options.currencySymbol + options.currencyDelimiter + result;
                  } else {
                    result += options.currencyDelimiter + options.currencySymbol;
                  }
                }
                return result;
              },
              getOpenXmlCurrencyFormat: function(currency) {
                var currencyValue = currency || dxConfig().defaultCurrency, options = this._getCurrencyOptions(currencyValue);
                return this._createOpenXmlCurrencyFormat(options);
              }
            };
            var intlIsEmbedded = compareVersions(dxVersion, "19.2.1") > -1;
            var intlIsActive = numberLocalization.engine && numberLocalization.engine() === "intl";
            if (intlIsEmbedded) {
              deprecationWarning();
            }
            if (!intlIsEmbedded || !intlIsActive) {
              numberLocalization.resetInjection();
              numberLocalization.inject(intlNumberLocalization);
            }
          },
          /* 2 */
          /***/
          function(module2, exports2) {
            "use strict";
            var getOwnPropertySymbols = Object.getOwnPropertySymbols;
            var hasOwnProperty = Object.prototype.hasOwnProperty;
            var propIsEnumerable = Object.prototype.propertyIsEnumerable;
            function toObject(val) {
              if (val === null || val === void 0) {
                throw new TypeError("Object.assign cannot be called with null or undefined");
              }
              return Object(val);
            }
            function shouldUseNative() {
              try {
                if (!Object.assign) {
                  return false;
                }
                var test1 = new String("abc");
                test1[5] = "de";
                if (Object.getOwnPropertyNames(test1)[0] === "5") {
                  return false;
                }
                var test2 = {};
                for (var i = 0; i < 10; i++) {
                  test2["_" + String.fromCharCode(i)] = i;
                }
                var order2 = Object.getOwnPropertyNames(test2).map(function(n) {
                  return test2[n];
                });
                if (order2.join("") !== "0123456789") {
                  return false;
                }
                var test3 = {};
                "abcdefghijklmnopqrst".split("").forEach(function(letter) {
                  test3[letter] = letter;
                });
                if (Object.keys(Object.assign({}, test3)).join("") !== "abcdefghijklmnopqrst") {
                  return false;
                }
                return true;
              } catch (err) {
                return false;
              }
            }
            module2.exports = shouldUseNative() ? Object.assign : function(target, source) {
              var from;
              var to = toObject(target);
              var symbols;
              for (var s = 1; s < arguments.length; s++) {
                from = Object(arguments[s]);
                for (var key in from) {
                  if (hasOwnProperty.call(from, key)) {
                    to[key] = from[key];
                  }
                }
                if (getOwnPropertySymbols) {
                  symbols = getOwnPropertySymbols(from);
                  for (var i = 0; i < symbols.length; i++) {
                    if (propIsEnumerable.call(from, symbols[i])) {
                      to[symbols[i]] = from[symbols[i]];
                    }
                  }
                }
              }
              return to;
            };
          },
          /* 3 */
          /***/
          function(module2, exports2) {
            module2.exports = __WEBPACK_EXTERNAL_MODULE_3__;
          },
          /* 4 */
          /***/
          function(module2, exports2) {
            module2.exports = __WEBPACK_EXTERNAL_MODULE_4__;
          },
          /* 5 */
          /***/
          function(module2, exports2) {
            module2.exports = __WEBPACK_EXTERNAL_MODULE_5__;
          },
          /* 6 */
          /***/
          function(module2, exports2) {
            "use strict";
            exports2.compare = function(x, y, maxLevel) {
              function normalizeArg(value) {
                if ("string" === typeof value) {
                  return value.split(".");
                }
                if ("number" === typeof value) {
                  return [value];
                }
                return value;
              }
              x = normalizeArg(x);
              y = normalizeArg(y);
              var length = Math.max(x.length, y.length);
              if (isFinite(maxLevel)) {
                length = Math.min(length, maxLevel);
              }
              for (var i = 0; i < length; i++) {
                var xItem = parseInt(x[i] || 0, 10), yItem = parseInt(y[i] || 0, 10);
                if (xItem < yItem) {
                  return -1;
                }
                if (xItem > yItem) {
                  return 1;
                }
              }
              return 0;
            };
          },
          /* 7 */
          /***/
          function(module2, exports2) {
            var displayed = false;
            function isAspNetCompatMode() {
              return typeof Globalize !== "undefined" && typeof DevExpress === "object" && "aspnet" in DevExpress;
            }
            module2.exports = function() {
              if (!displayed) {
                if (!isAspNetCompatMode()) {
                  console.log("Since v19.2, Intl localization utilities are included in DevExtreme. Do not use the separate devextreme-intl module.");
                }
                displayed = true;
              }
            };
          },
          /* 8 */
          /***/
          function(module2, exports2, __webpack_require__) {
            var objectAssign = __webpack_require__(2);
            var locale = __webpack_require__(4).locale;
            var dateLocalization = __webpack_require__(4).date;
            var firstDayOfWeekData = __webpack_require__(9);
            var dxVersion = __webpack_require__(5);
            var compareVersions = __webpack_require__(6).compare;
            var deprecationWarning = __webpack_require__(7);
            var SYMBOLS_TO_REMOVE_REGEX = /[\u200E\u200F]/g;
            var getIntlFormatter = function(format) {
              return function(date) {
                if (!format.timeZoneName) {
                  var utcDate = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()), utcFormat = objectAssign({ timeZone: "UTC" }, format);
                  return formatDateTime(utcDate, utcFormat);
                }
                return formatDateTime(date, format);
              };
            };
            var formattersCache = {};
            var getFormatter = function(format) {
              var key = locale() + "/" + JSON.stringify(format);
              if (!formattersCache[key]) {
                formattersCache[key] = new Intl.DateTimeFormat(locale(), format).format;
              }
              return formattersCache[key];
            };
            var formatDateTime = function(date, format) {
              return getFormatter(format)(date).replace(SYMBOLS_TO_REMOVE_REGEX, "");
            };
            var formatNumber = function(number) {
              return new Intl.NumberFormat(locale()).format(number);
            };
            var getAlternativeNumeralsMap = /* @__PURE__ */ function() {
              var numeralsMapCache = {};
              return function(locale2) {
                if (!(locale2 in numeralsMapCache)) {
                  if (formatNumber(0) === "0") {
                    numeralsMapCache[locale2] = false;
                    return false;
                  }
                  numeralsMapCache[locale2] = {};
                  for (var i = 0; i < 10; ++i) {
                    numeralsMapCache[locale2][formatNumber(i)] = i;
                  }
                }
                return numeralsMapCache[locale2];
              };
            }();
            var normalizeNumerals = function(dateString) {
              var alternativeNumeralsMap = getAlternativeNumeralsMap(locale());
              if (!alternativeNumeralsMap) {
                return dateString;
              }
              return dateString.split("").map(function(sign) {
                return sign in alternativeNumeralsMap ? String(alternativeNumeralsMap[sign]) : sign;
              }).join("");
            };
            var removeLeadingZeroes = function(str) {
              return str.replace(/(\D)0+(\d)/g, "$1$2");
            };
            var dateStringEquals = function(actual, expected) {
              return removeLeadingZeroes(actual) === removeLeadingZeroes(expected);
            };
            var normalizeMonth = function(text) {
              return text.replace("d’", "de ");
            };
            var intlFormats = {
              day: { day: "numeric" },
              dayofweek: { weekday: "long" },
              longdate: { weekday: "long", year: "numeric", month: "long", day: "numeric" },
              longdatelongtime: { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" },
              longtime: { hour: "numeric", minute: "numeric", second: "numeric" },
              month: { month: "long" },
              monthandday: { month: "long", day: "numeric" },
              monthandyear: { year: "numeric", month: "long" },
              shortdate: {},
              shorttime: { hour: "numeric", minute: "numeric" },
              shortyear: { year: "2-digit" },
              year: { year: "numeric" }
            };
            Object.defineProperty(intlFormats, "shortdateshorttime", {
              get: function() {
                var defaultOptions = Intl.DateTimeFormat(locale()).resolvedOptions();
                return { year: defaultOptions.year, month: defaultOptions.month, day: defaultOptions.day, hour: "numeric", minute: "numeric" };
              }
            });
            var getIntlFormat = function(format) {
              return typeof format === "string" && intlFormats[format.toLowerCase()];
            };
            var monthNameStrategies = {
              standalone: function(monthIndex, monthFormat) {
                var date = new Date(1999, monthIndex, 13, 1);
                var dateString = getIntlFormatter({ month: monthFormat })(date);
                return dateString;
              },
              format: function(monthIndex, monthFormat) {
                var date = new Date(0, monthIndex, 13, 1);
                var dateString = normalizeMonth(getIntlFormatter({ day: "numeric", month: monthFormat })(date));
                var parts = dateString.split(" ").filter(function(part) {
                  return part.indexOf("13") < 0;
                });
                if (parts.length === 1) {
                  return parts[0];
                } else if (parts.length === 2) {
                  return parts[0].length > parts[1].length ? parts[0] : parts[1];
                }
                return monthNameStrategies.standalone(monthIndex, monthFormat);
              }
            };
            var intlDateLocalization = {
              getMonthNames: function(format, type) {
                var intlFormats2 = {
                  wide: "long",
                  abbreviated: "short",
                  narrow: "narrow"
                };
                var monthFormat = intlFormats2[format || "wide"];
                type = type || "standalone";
                return Array.apply(null, new Array(12)).map(function(_, monthIndex) {
                  return monthNameStrategies[type](monthIndex, monthFormat);
                });
              },
              getDayNames: function(format) {
                var intlFormats2 = {
                  wide: "long",
                  abbreviated: "short",
                  short: "narrow",
                  narrow: "narrow"
                };
                var getIntlDayNames = function(format2) {
                  return Array.apply(null, new Array(7)).map(function(_, dayIndex) {
                    return getIntlFormatter({ weekday: format2 })(new Date(0, 0, dayIndex));
                  });
                };
                var result = getIntlDayNames(intlFormats2[format || "wide"]);
                return result;
              },
              getPeriodNames: function() {
                var hour12Formatter = getIntlFormatter({ hour: "numeric", hour12: true });
                return [1, 13].map(function(hours) {
                  var hourNumberText = formatNumber(1);
                  var timeParts = hour12Formatter(new Date(0, 0, 1, hours)).split(hourNumberText);
                  if (timeParts.length !== 2) {
                    return "";
                  }
                  var biggerPart = timeParts[0].length > timeParts[1].length ? timeParts[0] : timeParts[1];
                  return biggerPart.trim();
                });
              },
              format: function(date, format) {
                if (!date) {
                  return;
                }
                if (!format) {
                  return date;
                }
                format = format.type || format;
                var intlFormat = getIntlFormat(format);
                if (intlFormat) {
                  return getIntlFormatter(intlFormat)(date);
                }
                var formatType = typeof format;
                if (format.formatter || formatType === "function" || formatType === "string") {
                  return this.callBase.apply(this, arguments);
                }
                return getIntlFormatter(format)(date);
              },
              parse: function(dateString, format) {
                var SIMPLE_FORMATS = ["shortdate", "shorttime", "shortdateshorttime", "longtime"];
                if (compareVersions(dxVersion, "17.2.4") === -1 && dateString && typeof format === "string" && SIMPLE_FORMATS.indexOf(format.toLowerCase()) > -1) {
                  return this._parseDateBySimpleFormat(dateString, format.toLowerCase());
                }
                var formatter;
                if (compareVersions(dxVersion, "17.2.4") >= 0 && format && !format.parser && typeof dateString === "string") {
                  dateString = normalizeMonth(dateString);
                  formatter = function(date) {
                    return normalizeMonth(dateLocalization.format(date, format));
                  };
                }
                return this.callBase(dateString, formatter || format);
              },
              _parseDateBySimpleFormat: function(dateString, format) {
                dateString = normalizeNumerals(dateString);
                var formatParts = this.getFormatParts(format);
                var dateParts = dateString.split(/\D+/).filter(function(part) {
                  return part.length > 0;
                });
                if (formatParts.length !== dateParts.length) {
                  return;
                }
                var dateArgs = this._generateDateArgs(formatParts, dateParts);
                var constructDate = function(dateArgs2, ampmShift) {
                  var hoursShift = ampmShift ? 12 : 0;
                  return new Date(dateArgs2.year, dateArgs2.month, dateArgs2.day, (dateArgs2.hours + hoursShift) % 24, dateArgs2.minutes, dateArgs2.seconds);
                };
                var constructValidDate = function(ampmShift) {
                  var parsedDate = constructDate(dateArgs, ampmShift);
                  if (dateStringEquals(normalizeNumerals(this.format(parsedDate, format)), dateString)) {
                    return parsedDate;
                  }
                }.bind(this);
                return constructValidDate(false) || constructValidDate(true);
              },
              _generateDateArgs: function(formatParts, dateParts) {
                var currentDate = /* @__PURE__ */ new Date();
                var dateArgs = {
                  year: currentDate.getFullYear(),
                  month: currentDate.getMonth(),
                  day: currentDate.getDate(),
                  hours: 0,
                  minutes: 0,
                  seconds: 0
                };
                formatParts.forEach(function(formatPart, index) {
                  var datePart = dateParts[index];
                  var parsed = parseInt(datePart, 10);
                  if (formatPart === "month") {
                    parsed = parsed - 1;
                  }
                  dateArgs[formatPart] = parsed;
                });
                return dateArgs;
              },
              formatUsesMonthName: function(format) {
                if (typeof format === "object" && !(format.type || format.format)) {
                  return format.month === "long";
                }
                return this.callBase.apply(this, arguments);
              },
              formatUsesDayName: function(format) {
                if (typeof format === "object" && !(format.type || format.format)) {
                  return format.weekday === "long";
                }
                return this.callBase.apply(this, arguments);
              },
              getFormatParts: function(format) {
                var intlFormat = objectAssign({}, intlFormats[format.toLowerCase()]);
                var date = new Date(2001, 2, 4, 5, 6, 7);
                var formattedDate = getIntlFormatter(intlFormat)(date);
                formattedDate = normalizeNumerals(formattedDate);
                var formatParts = [
                  { name: "year", value: 1 },
                  { name: "month", value: 3 },
                  { name: "day", value: 4 },
                  { name: "hours", value: 5 },
                  { name: "minutes", value: 6 },
                  { name: "seconds", value: 7 }
                ];
                return formatParts.map(function(part) {
                  return {
                    name: part.name,
                    index: formattedDate.indexOf(part.value)
                  };
                }).filter(function(part) {
                  return part.index > -1;
                }).sort(function(a, b) {
                  return a.index - b.index;
                }).map(function(part) {
                  return part.name;
                });
              },
              firstDayOfWeekIndex: function() {
                var index = firstDayOfWeekData[locale()];
                return index === void 0 ? 1 : index;
              }
            };
            var intlIsEmbedded = compareVersions(dxVersion, "19.2.1") > -1;
            var intlIsActive = dateLocalization.engine && dateLocalization.engine() === "intl";
            if (intlIsEmbedded) {
              deprecationWarning();
            }
            if (!intlIsEmbedded || !intlIsActive) {
              dateLocalization.resetInjection();
              dateLocalization.inject(intlDateLocalization);
            }
          },
          /* 9 */
          /***/
          function(module2, exports2) {
            module2.exports = {
              "af": 0,
              "am": 0,
              "ar": 6,
              "ar-AE": 6,
              "ar-BH": 6,
              "ar-DJ": 6,
              "ar-DZ": 6,
              "ar-EG": 6,
              "ar-IL": 0,
              "ar-IQ": 6,
              "ar-JO": 6,
              "ar-KW": 6,
              "ar-LY": 6,
              "ar-OM": 6,
              "ar-QA": 6,
              "ar-SA": 0,
              "ar-SD": 6,
              "ar-SY": 6,
              "ar-YE": 0,
              "as": 0,
              "bn": 0,
              "bn-IN": 0,
              "bo": 0,
              "bo-IN": 0,
              "brx": 0,
              "ccp": 0,
              "ccp-IN": 0,
              "ceb": 0,
              "chr": 0,
              "ckb": 6,
              "ckb-IR": 6,
              "dav": 0,
              "dz": 0,
              "ebu": 0,
              "en": 0,
              "en-AE": 6,
              "en-AG": 0,
              "en-AS": 0,
              "en-AU": 0,
              "en-BS": 0,
              "en-BW": 0,
              "en-BZ": 0,
              "en-CA": 0,
              "en-DM": 0,
              "en-GU": 0,
              "en-HK": 0,
              "en-IL": 0,
              "en-IN": 0,
              "en-JM": 0,
              "en-KE": 0,
              "en-MH": 0,
              "en-MO": 0,
              "en-MT": 0,
              "en-PH": 0,
              "en-PK": 0,
              "en-PR": 0,
              "en-SD": 6,
              "en-SG": 0,
              "en-TT": 0,
              "en-UM": 0,
              "en-US-POSIX": 0,
              "en-VI": 0,
              "en-WS": 0,
              "en-ZA": 0,
              "en-ZW": 0,
              "es-BR": 0,
              "es-BZ": 0,
              "es-CO": 0,
              "es-DO": 0,
              "es-GT": 0,
              "es-HN": 0,
              "es-MX": 0,
              "es-NI": 0,
              "es-PA": 0,
              "es-PE": 0,
              "es-PH": 0,
              "es-PR": 0,
              "es-PY": 0,
              "es-SV": 0,
              "es-US": 0,
              "es-VE": 0,
              "fa": 6,
              "fa-AF": 6,
              "fil": 0,
              "fr-CA": 0,
              "fr-DJ": 6,
              "fr-DZ": 6,
              "fr-SY": 6,
              "gu": 0,
              "guz": 0,
              "haw": 0,
              "he": 0,
              "hi": 0,
              "id": 0,
              "ii": 0,
              "ja": 0,
              "jv": 0,
              "kab": 6,
              "kam": 0,
              "ki": 0,
              "kln": 0,
              "km": 0,
              "kn": 0,
              "ko": 0,
              "kok": 0,
              "ks": 0,
              "lkt": 0,
              "lo": 0,
              "lrc": 6,
              "lrc-IQ": 6,
              "luo": 0,
              "luy": 0,
              "mas": 0,
              "mer": 0,
              "mgh": 0,
              "ml": 0,
              "mr": 0,
              "ms-SG": 0,
              "mt": 0,
              "my": 0,
              "mzn": 6,
              "nd": 0,
              "ne": 0,
              "ne-IN": 0,
              "om": 0,
              "om-KE": 0,
              "or": 0,
              "pa": 0,
              "pa-Arab": 0,
              "pa-Guru": 0,
              "ps": 6,
              "ps-PK": 0,
              "pt": 0,
              "pt-MO": 0,
              "pt-MZ": 0,
              "pt-PT": 0,
              "qu": 0,
              "root": 0,
              "saq": 0,
              "sd": 0,
              "seh": 0,
              "sn": 0,
              "so-DJ": 6,
              "so-ET": 0,
              "so-KE": 0,
              "sw-KE": 0,
              "ta": 0,
              "ta-SG": 0,
              "te": 0,
              "teo-KE": 0,
              "th": 0,
              "ti": 0,
              "ug": 0,
              "ur": 0,
              "ur-IN": 0,
              "uz-Arab": 6,
              "xh": 0,
              "yue": 0,
              "yue-Hans": 0,
              "yue-Hant": 0,
              "zh": 0,
              "zh-Hans": 0,
              "zh-Hans-HK": 0,
              "zh-Hans-MO": 0,
              "zh-Hans-SG": 0,
              "zh-Hant": 0,
              "zh-Hant-HK": 0,
              "zh-Hant-MO": 0,
              "zu": 0
            };
          }
          /******/
        ])
      );
    });
  }
});
export default require_devextreme_intl();
/*! Bundled license information:

devextreme-intl/dist/devextreme-intl.js:
  (*! DevExtreme-Intl v19.1.8 *)
  (*
  object-assign
  (c) Sindre Sorhus
  @license MIT
  *)
*/
//# sourceMappingURL=devextreme-intl.js.map
