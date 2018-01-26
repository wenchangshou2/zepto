//     Zepto.js
//     (c) 2010-2017 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

var Zepto = (function () {
  var undefined, key, $, classList, emptyArray = [],
    concat = emptyArray.concat,
    filter = emptyArray.filter,
    slice = emptyArray.slice,
    document = window.document,
    elementDisplay = {},
    classCache = {},
    cssNumber = {
      'column-count': 1,
      'columns': 1,
      'font-weight': 1,
      'line-height': 1,
      'opacity': 1,
      'z-index': 1,
      'zoom': 1
    },
    fragmentRE = /^\s*<(\w+|!)[^>]*>/,
    singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
    tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
    rootNodeRE = /^(?:body|html)$/i,
    capitalRE = /([A-Z])/g,

    // special attributes that should be get/set via method calls
    methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],

    adjacencyOperators = ['after', 'prepend', 'before', 'append'],
    table = document.createElement('table'),
    tableRow = document.createElement('tr'),
    containers = {
      'tr': document.createElement('tbody'),
      'tbody': table,
      'thead': table,
      'tfoot': table,
      'td': tableRow,
      'th': tableRow,
      '*': document.createElement('div')
    },
    simpleSelectorRE = /^[\w-]*$/,
    class2type = {},
    toString = class2type.toString,
    zepto = {},
    camelize, uniq,
    tempParent = document.createElement('div'),
    propMap = {
      'tabindex': 'tabIndex',
      'readonly': 'readOnly',
      'for': 'htmlFor',
      'class': 'className',
      'maxlength': 'maxLength',
      'cellspacing': 'cellSpacing',
      'cellpadding': 'cellPadding',
      'rowspan': 'rowSpan',
      'colspan': 'colSpan',
      'usemap': 'useMap',
      'frameborder': 'frameBorder',
      'contenteditable': 'contentEditable'
    },
    isArray = Array.isArray ||//判断是否是一个数组对象
    function (object) {
      return object instanceof Array
    }

  zepto.matches = function (element, selector) {
    //判断element或selector为空，返回false
    //如果element的元素类型不为element返回false
    if (!selector || !element || element.nodeType !== 1) return false
    //为了兼容不同的浏览器
    var matchesSelector = element.matches || element.webkitMatchesSelector ||
      element.mozMatchesSelector || element.oMatchesSelector ||
      element.matchesSelector
    //如果当前存在着matchesSelector,直接调用
    if (matchesSelector) return matchesSelector.call(element, selector)
    // fall back to performing a selector:
    //
    var match, parent = element.parentNode,
      temp = !parent //是否存在父结点
    //如果没有存在element的父结点，将就element添加到刚才创建的div当中
    if (temp)(parent = tempParent).appendChild(element)
    match = ~zepto.qsa(parent, selector).indexOf(element)
    temp && tempParent.removeChild(element) //将element删除
    return match
  }
  //获取对象的数据类型
  function type(obj) {
    return obj == null ? String(obj) :
      class2type[toString.call(obj)] || "object"
  }
  /** 
   * 判断对象是否是函数类型
   * 
   * @param {any} value 将要判断的对象
   * @returns 布尔类型，是否为函数类型
   */
  function isFunction(value) {
    return type(value) == "function"
  }

  function isWindow(obj) {
    return obj != null && obj == obj.window
  }

  function isDocument(obj) {
    return obj != null && obj.nodeType == obj.DOCUMENT_NODE
  }

  function isObject(obj) {
    return type(obj) == "object"
  }
  //判断是否是一个普通的对象
  //{},new Object
  function isPlainObject(obj) {
    return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
  }

  function likeArray(obj) {
    var length = !!obj && 'length' in obj && obj.length,//是否含有length属性
      type = $.type(obj)//获取对象的类型

    return 'function' != type && !isWindow(obj) && (
      'array' == type || length === 0 ||
      (typeof length == 'number' && length > 0 && (length - 1) in obj)
    )
  }

  function compact(array) {
    return filter.call(array, function (item) {
      return item != null
    })
  }

  function flatten(array) {
    return array.length > 0 ? $.fn.concat.apply([], array) : array
  }
  //将字符串转转成驼峰的命令方式，如get-url转换成getUrl
  camelize = function (str) {
    return str.replace(/-+(.)?/g, function (match, chr) {
      console.log(chr)
      return chr ? chr.toUpperCase() : ''
    })
  }

  function dasherize(str) {
    return str.replace(/::/g, '/')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
      .replace(/([a-z\d])([A-Z])/g, '$1_$2')
      .replace(/_/g, '-')
      .toLowerCase()
  }
  uniq = function (array) {
    return filter.call(array, function (item, idx) {
      return array.indexOf(item) == idx
    })
  }

  function classRE(name) {
    return name in classCache ?
      classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
  }

  function maybeAddPx(name, value) {
    return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
  }

  function defaultDisplay(nodeName) {
    var element, display
    if (!elementDisplay[nodeName]) {
      element = document.createElement(nodeName)
      document.body.appendChild(element)
      display = getComputedStyle(element, '').getPropertyValue("display")
      element.parentNode.removeChild(element)
      display == "none" && (display = "block")
      elementDisplay[nodeName] = display
    }
    return elementDisplay[nodeName]
  }

  function children(element) {
    return 'children' in element ?
      slice.call(element.children) :
      $.map(element.childNodes, function (node) {
        if (node.nodeType == 1) return node
      })
  }

  function Z(dom, selector) {
    var i, len = dom ? dom.length : 0
    for (i = 0; i < len; i++) this[i] = dom[i]
    this.length = len
    this.selector = selector || ''
  }

  // `$.zepto.fragment` takes a html string and an optional tag name
  // to generate DOM nodes from the given html string.
  // The generated DOM nodes are returned as an array.
  // This function can be overridden in plugins for example to make
  // it compatible with browsers that don't support the DOM fully.
  zepto.fragment = function (html, name, properties) {
    console.log('fragment',html,name,properties)
    var dom, nodes, container

    // A special case optimization for a single tag
    //针对单个标签的特殊化处理，如<br/>
    if (singleTagRE.test(html)) dom = $(document.createElement(RegExp.$1))

    if (!dom) {
      if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>")
      if (name === undefined) name = fragmentRE.test(html) && RegExp.$1
      if (!(name in containers)) name = '*'

      container = containers[name]
      container.innerHTML = '' + html
      console.log('container.childNodes',container)
      console.log('11',slice.call(container.childNodes))
      console.log('22',slice,emptyArray,container,container.childNodes)
      dom = $.each(slice.call(container.childNodes), function () {
        console.log('33',this)
        container.removeChild(this)
      })
    }

    if (isPlainObject(properties)) {
      nodes = $(dom)
      $.each(properties, function (key, value) {
        if (methodAttributes.indexOf(key) > -1) nodes[key](value)
        else nodes.attr(key, value)
      })
    }

    return dom
  }

  // `$.zepto.Z` swaps out the prototype of the given `dom` array
  // of nodes with `$.fn` and thus supplying all the Zepto functions
  // to the array. This method can be overridden in plugins.
  zepto.Z = function (dom, selector) {
    return new Z(dom, selector)
  }

  // `$.zepto.isZ` should return `true` if the given object is a Zepto
  // collection. This method can be overridden in plugins.
  zepto.isZ = function (object) {
    return object instanceof zepto.Z
  }

  // `$.zepto.init` is Zepto's counterpart to jQuery's `$.fn.init` and
  // takes a CSS selector and an optional context (and handles various
  // special cases).
  // This method can be overridden in plugins.
  zepto.init = function (selector, context) {
    var dom
    //如果没有提供任何选择器，直接返回一个空的Zepto集合
    if (!selector) return zepto.Z()
    //如果当前是一个字符串的选择器
    else if (typeof selector == 'string') {
      selector = selector.trim()
      // If it's a html fragment, create nodes from it
      // Note: In both Chrome 21 and Firefox 15, DOM error 12
      // is thrown if the fragment doesn't begin with <
      //如果它是一个html片断,我们通过它进行创建
      if (selector[0] == '<' && fragmentRE.test(selector))
        dom = zepto.fragment(selector, RegExp.$1, context), selector = null
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // If it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector)
    }
    //当前选择器的类型为函数，等待页面加载完成后调用
    else if (isFunction(selector)) return $(document).ready(selector)
    // If a Zepto collection is given, just return it
    else if (zepto.isZ(selector)) return selector
    else {
      // normalize array if an array of nodes is given
      if (isArray(selector)) dom = compact(selector)
      // Wrap DOM nodes.
      else if (isObject(selector))
        dom = [selector], selector = null
      // If it's a html fragment, create nodes from it
      else if (fragmentRE.test(selector))
        dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // And last but no least, if it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector)
    }
    //通过查找到的节点来创建一个新的Zepto集合
    return zepto.Z(dom, selector)
  }

  // `$` will be the base `Zepto` object. When calling this
  // function just call `$.zepto.init, which makes the implementation
  // details of selecting nodes and creating Zepto collections
  // patchable in plugins.
  $ = function (selector, context) {
    return zepto.init(selector, context)
  }
  //复制对象
  function extend(target, source, deep) {
    for (key in source)//遍历将要复制的对象
      //判断是否是深度复制，并且是一个对象或数组类型
      if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
        if (isPlainObject(source[key]) && !isPlainObject(target[key]))//如果是对象类型
          target[key] = {}//初始化空对象
        if (isArray(source[key]) && !isArray(target[key]))//如果数组类型
          target[key] = []//初始化空数组
        extend(target[key], source[key], deep)//递归调用 
      }
    else if (source[key] !== undefined) target[key] = source[key]
    //如果是简单对象或浅度复制，直接进行赋值操作
  }

  // Copy all but undefined properties from one or more
  // objects to the `target` object.
  //进行对象拷贝
  //target若为布尔类型，true深度复制
  $.extend = function (target) {
    var deep, args = slice.call(arguments, 1)
    if (typeof target == 'boolean') {
      deep = target
      target = args.shift()//因为target被状态位占用，取第二位
    }
    args.forEach(function (arg) {//进行复制
      extend(target, arg, deep)
    })
    return target
  }
  //如果传入的选择器，来获取文档的对象
  zepto.qsa = function (element, selector) {
    var found,
      maybeID = selector[0] == '#', //当前是否是id选择
      maybeClass = !maybeID && selector[0] == '.', //当前是否是class选择
      //如果当前是class或者id选择，删除第一个字符
      nameOnly = maybeID || maybeClass ? selector.slice(1) : selector, // Ensure that a 1 char tag name still gets checked
      isSimple = simpleSelectorRE.test(nameOnly) //当前的name，是否只包含_和字母或数字
    return (element.getElementById && isSimple && maybeID) ? // Safari DocumentFragment doesn't have getElementById
      //element.getElementById存在并且是采用id选择方式
      ((found = element.getElementById(nameOnly)) ? [found] : []) :
      //如果当前的element的类型不为element或者document或DocumentFragment节点，返回一个空数组
      (element.nodeType !== 1 && element.nodeType !== 9 && element.nodeType !== 11) ? [] :
      slice.call(
        isSimple && !maybeID && element.getElementsByClassName ? // DocumentFragment doesn't have getElementsByClassName/TagName
        maybeClass ? element.getElementsByClassName(nameOnly) : // If it's simple, it could be a class
        element.getElementsByTagName(selector) : // Or a tag
        element.querySelectorAll(selector) // Or it's not simple, and we need to query all
      )
  }

  function filtered(nodes, selector) {
    return selector == null ? $(nodes) : $(nodes).filter(selector)
  }
  //parent是否包含node
  $.contains = document.documentElement.contains ?//contains在手机端的支持不太好
    function (parent, node) {
      //判断parent是否相等，node是否为parent的后代节点
      return parent !== node && parent.contains(node)
    } :
    //不断的向上搜索，判断是否存在的类与parent一致
    function (parent, node) {
      while (node && (node = node.parentNode))//不断的获取你结点，直到为null为止
        if (node === parent) return true
      return false
    }

  function funcArg(context, arg, idx, payload) {
    return isFunction(arg) ? arg.call(context, idx, payload) : arg
  }

  function setAttribute(node, name, value) {
    value == null ? node.removeAttribute(name) : node.setAttribute(name, value)
  }

  // access className property while respecting SVGAnimatedString
  function className(node, value) {
    var klass = node.className || '',
      svg = klass && klass.baseVal !== undefined

    if (value === undefined) return svg ? klass.baseVal : klass
    svg ? (klass.baseVal = value) : (node.className = value)
  }

  // "true"  => true
  // "false" => false
  // "null"  => null
  // "42"    => 42
  // "42.5"  => 42.5
  // "08"    => "08"
  // JSON    => parse if valid
  // String  => self
  function deserializeValue(value) {
    try {
      return value ?
        value == "true" ||
        (value == "false" ? false :
          value == "null" ? null :
          +value + "" == value ? +value :
          /^[\[\{]/.test(value) ? $.parseJSON(value) :
          value) :
        value
    } catch (e) {
      return value
    }
  }

  $.type = type
  $.isFunction = isFunction
  $.isWindow = isWindow
  $.isArray = isArray
  $.isPlainObject = isPlainObject

  $.isEmptyObject = function (obj) {
    var name
    for (name in obj) return false
    return true
  }
  //是否是一个有效数字
  $.isNumeric = function (val) {
    var num = Number(val),
      type = typeof val
    return val != null && type != 'boolean' &&
      (type != 'string' || val.length) &&
      !isNaN(num) && isFinite(num) || false
  }
  //判断array是否含有elem元素
  //i表示可选项，表示从第几个元素进行搜索
  $.inArray = function (elem, array, i) {
    return emptyArray.indexOf.call(array, elem, i)
  }

  $.camelCase = camelize
  //去两边空格，只是多加了一个判空操作
  $.trim = function (str) {
    return str == null ? "" : String.prototype.trim.call(str)
  }

  // plugin compatibility
  $.uuid = 0
  $.support = {}
  $.expr = {}
  $.noop = function () {}//一个空函数

  $.map = function (elements, callback) {
    var value, values = [],
      i, key
    if (likeArray(elements))//是否是一个有效的数组
      for (i = 0; i < elements.length; i++) {
        value = callback(elements[i], i)
        if (value != null) values.push(value)
      }
    else
      for (key in elements) {
        value = callback(elements[key], key)
        if (value != null) values.push(value)
      }
    return flatten(values)
  }
  //遍历元素
  $.each = function (elements, callback) {
    var i, key
    if (likeArray(elements)) {//判断是否是类数组的格式，{"a","b","c"}
      for (i = 0; i < elements.length; i++)
        if (callback.call(elements[i], i, elements[i]) === false) return elements
    } else {
      for (key in elements)//{"a":1,"b":2}
        if (callback.call(elements[key], key, elements[key]) === false) return elements
    }

    return elements
  }
  //通过filter进行元素过滤,返回过滤后新的数组
  $.grep = function (elements, callback) {
    return filter.call(elements, callback)
  }

  if (window.JSON) $.parseJSON = JSON.parse

  // Populate the class2type map
  $.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function (i, name) {
    class2type["[object " + name + "]"] = name.toLowerCase()
  })

  // Define methods that will be available on all
  // Zepto collections
  $.fn = {
    constructor: zepto.Z,
    length: 0,

    // Because a collection acts like an array
    // copy over these useful array functions.
    forEach: emptyArray.forEach,
    reduce: emptyArray.reduce,
    push: emptyArray.push,
    sort: emptyArray.sort,
    splice: emptyArray.splice,
    indexOf: emptyArray.indexOf,
    concat: function () {
      var i, value, args = []
      for (i = 0; i < arguments.length; i++) {
        value = arguments[i]
        args[i] = zepto.isZ(value) ? value.toArray() : value
      }
      return concat.apply(zepto.isZ(this) ? this.toArray() : this, args)
    },

    // `map` and `slice` in the jQuery API work differently
    // from their array counterparts
    map: function (fn) {
      return $($.map(this, function (el, i) {
        return fn.call(el, i, el)
      }))
    },
    slice: function () {
      return $(slice.apply(this, arguments))
    },

    ready: function (callback) {
      // don't use "interactive" on IE <= 10 (it can fired premature)
      if (document.readyState === "complete" ||
        (document.readyState !== "loading" && !document.documentElement.doScroll))
        setTimeout(function () {
          callback($)
        }, 0)
      else {
        var handler = function () {
          document.removeEventListener("DOMContentLoaded", handler, false)
          window.removeEventListener("load", handler, false)
          callback($)
        }
        document.addEventListener("DOMContentLoaded", handler, false)
        window.addEventListener("load", handler, false)
      }
      return this
    },
    get: function (idx) {
      return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
    },
    toArray: function () {
      return this.get()
    },
    size: function () {
      return this.length
    },
    remove: function () {
      return this.each(function () {
        if (this.parentNode != null)
          this.parentNode.removeChild(this)
      })
    },
    each: function (callback) {
      emptyArray.every.call(this, function (el, idx) {
        return callback.call(el, idx, el) !== false
      })
      return this
    },
    filter: function (selector) {
      if (isFunction(selector)) return this.not(this.not(selector))
      return $(filter.call(this, function (element) {
        return zepto.matches(element, selector)
      }))
    },
    add: function (selector, context) {
      return $(uniq(this.concat($(selector, context))))
    },
    is: function (selector) {
      return typeof selector == 'string' ? this.length > 0 && zepto.matches(this[0], selector) :
        selector && this.selector == selector.selector
    },
    not: function (selector) {
      var nodes = []
      if (isFunction(selector) && selector.call !== undefined)
        this.each(function (idx) {
          if (!selector.call(this, idx)) nodes.push(this)
        })
      else {
        var excludes = typeof selector == 'string' ? this.filter(selector) :
          (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector)
        this.forEach(function (el) {
          if (excludes.indexOf(el) < 0) nodes.push(el)
        })
      }
      return $(nodes)
    },
    has: function (selector) {
      return this.filter(function () {
        return isObject(selector) ?
          $.contains(this, selector) :
          $(this).find(selector).size()
      })
    },
    eq: function (idx) {
      return idx === -1 ? this.slice(idx) : this.slice(idx, +idx + 1)
    },
    first: function () {
      var el = this[0]
      return el && !isObject(el) ? el : $(el)
    },
    last: function () {
      var el = this[this.length - 1]
      return el && !isObject(el) ? el : $(el)
    },
    find: function (selector) {
      var result, $this = this
      if (!selector) result = $()
      else if (typeof selector == 'object')
        result = $(selector).filter(function () {
          var node = this
          return emptyArray.some.call($this, function (parent) {
            return $.contains(parent, node)
          })
        })
      else if (this.length == 1) result = $(zepto.qsa(this[0], selector))
      else result = this.map(function () {
        return zepto.qsa(this, selector)
      })
      return result
    },
    closest: function (selector, context) {
      var nodes = [],
        collection = typeof selector == 'object' && $(selector)
      this.each(function (_, node) {
        while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector)))
          node = node !== context && !isDocument(node) && node.parentNode
        if (node && nodes.indexOf(node) < 0) nodes.push(node)
      })
      return $(nodes)
    },
    parents: function (selector) {
      var ancestors = [],
        nodes = this
      while (nodes.length > 0)
        nodes = $.map(nodes, function (node) {
          if ((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
            ancestors.push(node)
            return node
          }
        })
      return filtered(ancestors, selector)
    },
    parent: function (selector) {
      return filtered(uniq(this.pluck('parentNode')), selector)
    },
    children: function (selector) {
      return filtered(this.map(function () {
        return children(this)
      }), selector)
    },
    contents: function () {
      return this.map(function () {
        return this.contentDocument || slice.call(this.childNodes)
      })
    },
    siblings: function (selector) {
      return filtered(this.map(function (i, el) {
        return filter.call(children(el.parentNode), function (child) {
          return child !== el
        })
      }), selector)
    },
    empty: function () {
      return this.each(function () {
        this.innerHTML = ''
      })
    },
    // `pluck` is borrowed from Prototype.js
    pluck: function (property) {
      return $.map(this, function (el) {
        return el[property]
      })
    },
    show: function () {
      return this.each(function () {
        this.style.display == "none" && (this.style.display = '')
        if (getComputedStyle(this, '').getPropertyValue("display") == "none")
          this.style.display = defaultDisplay(this.nodeName)
      })
    },
    replaceWith: function (newContent) {
      return this.before(newContent).remove()
    },
    wrap: function (structure) {
      var func = isFunction(structure)
      if (this[0] && !func)
        var dom = $(structure).get(0),
          clone = dom.parentNode || this.length > 1

      return this.each(function (index) {
        $(this).wrapAll(
          func ? structure.call(this, index) :
          clone ? dom.cloneNode(true) : dom
        )
      })
    },
    wrapAll: function (structure) {
      if (this[0]) {
        $(this[0]).before(structure = $(structure))
        var children
        // drill down to the inmost element
        while ((children = structure.children()).length) structure = children.first()
        $(structure).append(this)
      }
      return this
    },
    wrapInner: function (structure) {
      var func = isFunction(structure)
      return this.each(function (index) {
        var self = $(this),
          contents = self.contents(),
          dom = func ? structure.call(this, index) : structure
        contents.length ? contents.wrapAll(dom) : self.append(dom)
      })
    },
    unwrap: function () {
      this.parent().each(function () {
        $(this).replaceWith($(this).children())
      })
      return this
    },
    clone: function () {
      return this.map(function () {
        return this.cloneNode(true)
      })
    },
    hide: function () {
      return this.css("display", "none")
    },
    toggle: function (setting) {
      return this.each(function () {
        var el = $(this);
        (setting === undefined ? el.css("display") == "none" : setting) ? el.show(): el.hide()
      })
    },
    prev: function (selector) {
      return $(this.pluck('previousElementSibling')).filter(selector || '*')
    },
    next: function (selector) {
      return $(this.pluck('nextElementSibling')).filter(selector || '*')
    },
    html: function (html) {
      return 0 in arguments ?
        this.each(function (idx) {
          var originHtml = this.innerHTML
          $(this).empty().append(funcArg(this, html, idx, originHtml))
        }) :
        (0 in this ? this[0].innerHTML : null)
    },
    text: function (text) {
      return 0 in arguments ?
        this.each(function (idx) {
          var newText = funcArg(this, text, idx, this.textContent)
          this.textContent = newText == null ? '' : '' + newText
        }) :
        (0 in this ? this.pluck('textContent').join("") : null)
    },
    attr: function (name, value) {
      var result
      return (typeof name == 'string' && !(1 in arguments)) ?
        (0 in this && this[0].nodeType == 1 && (result = this[0].getAttribute(name)) != null ? result : undefined) :
        this.each(function (idx) {
          if (this.nodeType !== 1) return
          if (isObject(name))
            for (key in name) setAttribute(this, key, name[key])
          else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)))
        })
    },
    removeAttr: function (name) {
      return this.each(function () {
        this.nodeType === 1 && name.split(' ').forEach(function (attribute) {
          setAttribute(this, attribute)
        }, this)
      })
    },
    prop: function (name, value) {
      name = propMap[name] || name
      return (typeof name == 'string' && !(1 in arguments)) ?
        (this[0] && this[0][name]) :
        this.each(function (idx) {
          if (isObject(name))
            for (key in name) this[propMap[key] || key] = name[key]
          else this[name] = funcArg(this, value, idx, this[name])
        })
    },
    removeProp: function (name) {
      name = propMap[name] || name
      return this.each(function () {
        delete this[name]
      })
    },
    data: function (name, value) {
      var attrName = 'data-' + name.replace(capitalRE, '-$1').toLowerCase()

      var data = (1 in arguments) ?
        this.attr(attrName, value) :
        this.attr(attrName)

      return data !== null ? deserializeValue(data) : undefined
    },
    val: function (value) {
      if (0 in arguments) {
        if (value == null) value = ""
        return this.each(function (idx) {
          this.value = funcArg(this, value, idx, this.value)
        })
      } else {
        return this[0] && (this[0].multiple ?
          $(this[0]).find('option').filter(function () {
            return this.selected
          }).pluck('value') :
          this[0].value)
      }
    },
    offset: function (coordinates) {
      if (coordinates) return this.each(function (index) {
        var $this = $(this),
          coords = funcArg(this, coordinates, index, $this.offset()),
          parentOffset = $this.offsetParent().offset(),
          props = {
            top: coords.top - parentOffset.top,
            left: coords.left - parentOffset.left
          }

        if ($this.css('position') == 'static') props['position'] = 'relative'
        $this.css(props)
      })
      if (!this.length) return null
      if (document.documentElement !== this[0] && !$.contains(document.documentElement, this[0]))
        return {
          top: 0,
          left: 0
        }
      var obj = this[0].getBoundingClientRect()
      return {
        left: obj.left + window.pageXOffset,
        top: obj.top + window.pageYOffset,
        width: Math.round(obj.width),
        height: Math.round(obj.height)
      }
    },
    css: function (property, value) {
      if (arguments.length < 2) {
        var element = this[0]
        if (typeof property == 'string') {
          if (!element) return
          return element.style[camelize(property)] || getComputedStyle(element, '').getPropertyValue(property)
        } else if (isArray(property)) {
          if (!element) return
          var props = {}
          var computedStyle = getComputedStyle(element, '')
          $.each(property, function (_, prop) {
            props[prop] = (element.style[camelize(prop)] || computedStyle.getPropertyValue(prop))
          })
          return props
        }
      }

      var css = ''
      if (type(property) == 'string') {
        if (!value && value !== 0)
          this.each(function () {
            this.style.removeProperty(dasherize(property))
          })
        else
          css = dasherize(property) + ":" + maybeAddPx(property, value)
      } else {
        for (key in property)
          if (!property[key] && property[key] !== 0)
            this.each(function () {
              this.style.removeProperty(dasherize(key))
            })
        else
          css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'
      }

      return this.each(function () {
        this.style.cssText += ';' + css
      })
    },
    index: function (element) {
      return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
    },
    hasClass: function (name) {
      if (!name) return false
      return emptyArray.some.call(this, function (el) {
        return this.test(className(el))
      }, classRE(name))
    },
    addClass: function (name) {
      console.log('this',this)
      if (!name) return this
      return this.each(function (idx) {
        if (!('className' in this)) return
        classList = []
        var cls = className(this),
          newName = funcArg(this, name, idx, cls)
        newName.split(/\s+/g).forEach(function (klass) {
          if (!$(this).hasClass(klass)) classList.push(klass)
        }, this)
        classList.length && className(this, cls + (cls ? " " : "") + classList.join(" "))
      })
    },
    removeClass: function (name) {
      return this.each(function (idx) {
        if (!('className' in this)) return
        if (name === undefined) return className(this, '')
        classList = className(this)
        funcArg(this, name, idx, classList).split(/\s+/g).forEach(function (klass) {
          classList = classList.replace(classRE(klass), " ")
        })
        className(this, classList.trim())
      })
    },
    toggleClass: function (name, when) {
      if (!name) return this
      return this.each(function (idx) {
        var $this = $(this),
          names = funcArg(this, name, idx, className(this))
        names.split(/\s+/g).forEach(function (klass) {
          (when === undefined ? !$this.hasClass(klass) : when) ?
          $this.addClass(klass): $this.removeClass(klass)
        })
      })
    },
    scrollTop: function (value) {
      if (!this.length) return
      var hasScrollTop = 'scrollTop' in this[0]
      if (value === undefined) return hasScrollTop ? this[0].scrollTop : this[0].pageYOffset
      return this.each(hasScrollTop ?
        function () {
          this.scrollTop = value
        } :
        function () {
          this.scrollTo(this.scrollX, value)
        })
    },
    scrollLeft: function (value) {
      if (!this.length) return
      var hasScrollLeft = 'scrollLeft' in this[0]
      if (value === undefined) return hasScrollLeft ? this[0].scrollLeft : this[0].pageXOffset
      return this.each(hasScrollLeft ?
        function () {
          this.scrollLeft = value
        } :
        function () {
          this.scrollTo(value, this.scrollY)
        })
    },
    position: function () {
      if (!this.length) return

      var elem = this[0],
        // Get *real* offsetParent
        offsetParent = this.offsetParent(),
        // Get correct offsets
        offset = this.offset(),
        parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? {
          top: 0,
          left: 0
        } : offsetParent.offset()

      // Subtract element margins
      // note: when an element has margin: auto the offsetLeft and marginLeft
      // are the same in Safari causing offset.left to incorrectly be 0
      offset.top -= parseFloat($(elem).css('margin-top')) || 0
      offset.left -= parseFloat($(elem).css('margin-left')) || 0

      // Add offsetParent borders
      parentOffset.top += parseFloat($(offsetParent[0]).css('border-top-width')) || 0
      parentOffset.left += parseFloat($(offsetParent[0]).css('border-left-width')) || 0

      // Subtract the two offsets
      return {
        top: offset.top - parentOffset.top,
        left: offset.left - parentOffset.left
      }
    },
    offsetParent: function () {
      return this.map(function () {
        var parent = this.offsetParent || document.body
        while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static")
          parent = parent.offsetParent
        return parent
      })
    }
  }

  // for now
  $.fn.detach = $.fn.remove

  // Generate the `width` and `height` functions
  ;
  ['width', 'height'].forEach(function (dimension) {
    var dimensionProperty =
      dimension.replace(/./, function (m) {
        return m[0].toUpperCase()
      })

    $.fn[dimension] = function (value) {
      var offset, el = this[0]
      if (value === undefined) return isWindow(el) ? el['inner' + dimensionProperty] :
        isDocument(el) ? el.documentElement['scroll' + dimensionProperty] :
        (offset = this.offset()) && offset[dimension]
      else return this.each(function (idx) {
        el = $(this)
        el.css(dimension, funcArg(this, value, idx, el[dimension]()))
      })
    }
  })

  function traverseNode(node, fun) {
    fun(node)
    for (var i = 0, len = node.childNodes.length; i < len; i++)
      traverseNode(node.childNodes[i], fun)
  }

  // Generate the `after`, `prepend`, `before`, `append`,
  // `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
  //zepto.Z.prototype = Z.prototype = $.fn
  //自动生成'after','prepend','before','append','insertAfter','insertBefore','appendTo','prependTo'方法挂载到zepto的原型上
  adjacencyOperators.forEach(function (operator, operatorIndex) {
    var inside = operatorIndex % 2 //=> prepend, append

    $.fn[operator] = function () {
      //arguments可以是nodes，结点数组，Zpeoto对象和HTML字符串
      var argType, nodes = $.map(arguments, function (arg) {//遍历所有的元素
          var arr = []
          argType = type(arg)//获取参数类型
          if (argType == "array") {//如果参数是数组
            arg.forEach(function (el) {
              if (el.nodeType !== undefined) return arr.push(el)
              else if ($.zepto.isZ(el)) return arr = arr.concat(el.get())
              arr = arr.concat(zepto.fragment(el))
            })
            return arr
          }
          return argType == "object" || arg == null ?
            arg : zepto.fragment(arg)//如果当前是一个html字符串
        }),
        parent, copyByClone = this.length > 1
      if (nodes.length < 1) return this

      return this.each(function (_, target) {
        parent = inside ? target : target.parentNode//如果是向后追回的返回target,否则返回父节点

        // convert all methods to a "before" operation
        target = operatorIndex == 0 ? target.nextSibling :
          operatorIndex == 1 ? target.firstChild :
          operatorIndex == 2 ? target :
          null

        var parentInDocument = $.contains(document.documentElement, parent)

        nodes.forEach(function (node) {
          if (copyByClone) node = node.cloneNode(true)
          else if (!parent) return $(node).remove()

          parent.insertBefore(node, target)
          if (parentInDocument) traverseNode(node, function (el) {
            if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' &&
              (!el.type || el.type === 'text/javascript') && !el.src) {
              var target = el.ownerDocument ? el.ownerDocument.defaultView : window
              target['eval'].call(target, el.innerHTML)
            }
          })
        })
      })
    }

    // after    => insertAfter
    // prepend  => prependTo
    // before   => insertBefore
    // append   => appendTo
    $.fn[inside ? operator + 'To' : 'insert' + (operatorIndex ? 'Before' : 'After')] = function (html) {
      $(html)[operator](this)
      return this
    }
  })

  zepto.Z.prototype = Z.prototype = $.fn

  // Export internal API functions in the `$.zepto` namespace
  zepto.uniq = uniq
  zepto.deserializeValue = deserializeValue
  $.zepto = zepto

  return $
})()

// If `$` is not yet defined, point it to `Zepto`
window.Zepto = Zepto
window.$ === undefined && (window.$ = Zepto)