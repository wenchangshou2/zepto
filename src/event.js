//     Zepto.js
//     (c) 2010-2016 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;
(function ($) {
  var _zid = 1, //事件的序号
    undefined,
    slice = Array.prototype.slice,
    isFunction = $.isFunction,
    isString = function (obj) {
      return typeof obj == 'string'
    },
    handlers = {},
    specialEvents = {},
    focusinSupported = 'onfocusin' in window,
    focus = { //传统的focus和blur不支持事件的冒泡，新的浏览器添加两个替代的方法 focusin和focusout
      focus: 'focusin',
      blur: 'focusout'
    },
    hover = { //不支持事件的冒泡，新的浏览器添加两个替代的方法,mouseover和mouseout
      mouseenter: 'mouseover',
      mouseleave: 'mouseout'
    }

  specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents'

  /**
   * 元素上的事件编号
   * 
   * @param {any} element 事件编号，每添加一个事件的绑定会自动+1
   * @returns 返回当前元素的事件编号
   **/
  function zid(element) {
    return element._zid || (element._zid = _zid++)
  }
/**
 * 查找缓冲的句柄
 * 
 * @param {any} element 
 * @param {any} event 
 * @param {any} fn 
 * @param {any} selector 
 * @returns 
 */
function findHandlers(element, event, fn, selector) {
    event = parse(event)
    if (event.ns) var matcher = matcherFor(event.ns)//如果存在着命名空间
    return (handlers[zid(element)] || []).filter(function (handler) {
      return handler &&
        (!event.e || handler.e == event.e) &&
        (!event.ns || matcher.test(handler.ns)) &&//如果指定ns,命令空间也需要一致
        (!fn || zid(handler.fn) === zid(fn)) &&如果指定了fn,那么handler.fn和fn的zid需要一致
        (!selector || handler.sel == selector)//句柄中的选择器必须与指定的选择器一致
    })
  }
/**
 * 事件解析
 * 
 * @param {any} event 事件名称
 * @returns 返回{e:'',ns:''}格式 
 */
function parse(event) {
    var parts = ('' + event).split('.')
    return {
      e: parts[0],
      ns: parts.slice(1).sort().join(' ')
    }
  }

  function matcherFor(ns) {
    return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)')
  }
/** 
 * 是否进行事件冒泡
 * 
 * @param {any} handler 
 * @param {any} captureSetting 
 * @returns 
 */
function eventCapture(handler, captureSetting) {
    return handler.del &&
      (!focusinSupported && (handler.e in focus)) ||
      !!captureSetting
  }
/** 
 * 返回事件的类型
 * 
 * @param {any} type event名称
 * @returns 返回对象的事件名称，对hover和focus进行特殊处理 
 */
function realEvent(type) {
    return hover[type] || (focusinSupported && focus[type]) || type
  }
  /**
   * 给元素添加事件 
   * 
   * @param {any} element 元素
   * @param {any} events 事件名称
   * @param {any} fn events对应执行的函数
   * @param {any} data 
   * @param {any} selector 选择器
   * @param {any} delegator 
   * @param {any} capture 
   */
  function add(element, events, fn, data, selector, delegator, capture) {
    var id = zid(element),//当前元素的事件编号
      set = (handlers[id] || (handlers[id] = []))//handlers维护当前全局的事件
    events.split(/\s/).forEach(function (event) {
      if (event == 'ready') return $(document).ready(fn)//如果当前的事件 是ready，直接绑定到document.ready方法中
      //将事件转换成
      //{
        // e:eventName,
        // ns:""
      //}
      var handler = parse(event)
      handler.fn = fn
      handler.sel = selector
      // 模拟mouseenter, mouseleave
      if (handler.e in hover) fn = function (e) {
        var related = e.relatedTarget
        if (!related || (related !== this && !$.contains(this, related)))
          return handler.fn.apply(this, arguments)
      }
      handler.del = delegator
      var callback = delegator || fn//autoRemove以及delegator的优先级更高
      handler.proxy = function (e) {//触发事件执行的操作
        e = compatible(e)
        if (e.isImmediatePropagationStopped()) return
        e.data = data
        //执行回调事件，并且绑定上下文
        var result = callback.apply(element, e._args == undefined ? [e] : [e].concat(e._args))
        //如果返回false,取消事件的默认行为以及停止事件的传播
        if (result === false) e.preventDefault(), e.stopPropagation()
        return result
      }
      handler.i = set.length//i保存事件的数量 
      set.push(handler)//将当前的事件追加到对应的handler[id]中
      if ('addEventListener' in element)//如果当前元素存在着addEventListener事件 
      
        element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
    })
  }
/**
 * 删除事件
 * 
 * @param {any} element 元素结点
 * @param {any} events 事件名称
 * @param {any} fn 事件调用的函数
 * @param {any} selector 选择器
 * @param {any} capture 
 */
function remove(element, events, fn, selector, capture) {
    var id = zid(element);//当前元素上的事件id
    (events || '').split(/\s/).forEach(function (event) {//按空格进行拆分,并且进行遍历
      findHandlers(element, event, fn, selector).forEach(function (handler) {
        delete handlers[id][handler.i]
        if ('removeEventListener' in element)//如果element原型上存在着removeEventListener方法
        //调用 removeEventListener进行事件删除
          element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
      })
    })
  }

  $.event = {
    add: add,
    remove: remove
  }

  $.proxy = function (fn, context) {
    var args = (2 in arguments) && slice.call(arguments, 2)
    if (isFunction(fn)) {
      var proxyFn = function () {
        return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments)
      }
      proxyFn._zid = zid(fn)
      return proxyFn
    } else if (isString(context)) {
      if (args) {
        args.unshift(fn[context], fn)
        return $.proxy.apply(null, args)
      } else {
        return $.proxy(fn[context], fn)
      }
    } else {
      throw new TypeError("expected function")
    }
  }

  $.fn.bind = function (event, data, callback) {
    return this.on(event, data, callback)
  }
  $.fn.unbind = function (event, callback) {
    return this.off(event, callback)
  }
  //仅会调用一次
  $.fn.one = function (event, selector, data, callback) {
    return this.on(event, selector, data, callback, 1)
  }

  var returnTrue = function () {
      return true
    },
    returnFalse = function () {
      return false
    },
    // 用来排除 A-Z 开头，即所有大写字母开头的属性，还有以returnValue 结尾，layerX/layerY ，webkitMovementX/webkitMovementY 结尾的非标准属性。
    ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$|webkitMovement[XY]$)/,
    eventMethods = {
      preventDefault: 'isDefaultPrevented',
      stopImmediatePropagation: 'isImmediatePropagationStopped',
      stopPropagation: 'isPropagationStopped'
    }
    //做兼容处理
  function compatible(event, source) {
    if (source || !event.isDefaultPrevented) {//如果source存在
      source || (source = event)
      $.each(eventMethods, function (name, predicate) {
        var sourceMethod = source[name]
        event[name] = function () {
          this[predicate] = returnTrue
          return sourceMethod && sourceMethod.apply(source, arguments)
        }
        event[predicate] = returnFalse
      })

      try {
        event.timeStamp || (event.timeStamp = Date.now())
      } catch (ignored) {}

      if (source.defaultPrevented !== undefined ? source.defaultPrevented :
        'returnValue' in source ? source.returnValue === false :
        source.getPreventDefault && source.getPreventDefault())
        event.isDefaultPrevented = returnTrue
    }
    return event
  }

  function createProxy(event) {
    var key, proxy = {
      originalEvent: event
    }
    for (key in event)
      if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key]

    return compatible(proxy, event)
  }

  $.fn.delegate = function (selector, event, callback) {
    return this.on(event, selector, callback)
  }
  $.fn.undelegate = function (selector, event, callback) {
    return this.off(event, selector, callback)
  }

  $.fn.live = function (event, callback) {
    $(document.body).delegate(this.selector, event, callback)
    return this
  }
  $.fn.die = function (event, callback) {
    $(document.body).undelegate(this.selector, event, callback)
    return this
  }
  /** 
   * 给元素绑定事件
   * 
   * @param {any} event //事件名称
   * @param {any} selector //选择器
   * @param {any} data 
   * @param {any} callback //事件的回调事件 
   * @param {any} one //是否只执行一次
   * @returns 
   */
  $.fn.on = function (event, selector, data, callback, one) {
    var autoRemove, delegator, $this = this
    //惹event为数组的时候，进行遍历调用 
    if (event && !isString(event)) {
      $.each(event, function (type, fn) {//若当前event是数组类型，进行遍历再进行调用 
        $this.on(type, selector, data, fn, one)
      })
      return $this
    }

    if (!isString(selector) && !isFunction(callback) && callback !== false)
      callback = data, data = selector, selector = undefined
    if (callback === undefined || data === false)
      callback = data, data = undefined

    if (callback === false) callback = returnFalse
    //因为selector,data是可选项，为了做兼容调用处理
    //on(type, [selector], function(e){ ... })  ⇒ self
    //on(type, [selector], [data], function(e){ ... })  ⇒ self v1.1+
    //on({ type: handler, type2: handler2, ... }, [selector])  ⇒ self
    //on({ type: handler, type2: handler2, ... }, [selector], [data])  ⇒ self v1.1+
    return $this.each(function (_, element) {
      if (one) autoRemove = function (e) {//如果当前只触发一次，触发后自动解决事件的绑定
        remove(element, e.type, callback)//
        return callback.apply(this, arguments)
      }

      if (selector) delegator = function (e) {
        //通过selector查询对应的父结点对应的元素，并且返回匹配的第一个对象
        var evt, match = $(e.target).closest(selector, element).get(0)
        if (match && match !== element) {//如果存在着该 元素并且，不为element结点
          evt = $.extend(createProxy(e), {
            currentTarget: match,
            liveFired: element
          })//扩展对象，添加currentTarget和liveFired
          return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)))
        }
      }

      add(element, event, callback, data, selector, delegator || autoRemove)
    })
  }
  //解除事件的绑定
  $.fn.off = function (event, selector, callback) {
    var $this = this
    //如果当前event为数组，遍历调用 
    if (event && !isString(event)) {
      $.each(event, function (type, fn) {
        $this.off(type, selector, fn)
      })
      return $this
    }
    //如果选择器不为字符串类型，并且callback不为函数类型，callback不为false
    if (!isString(selector) && !isFunction(callback) && callback !== false)
      callback = selector, selector = undefined//将selector赋值给callback，并且 清空 

    if (callback === false) callback = returnFalse//如果callback为空，直接返回false,没有绑定任何事件，不需要做任何处理

    return $this.each(function () {//遍历删除
      remove(this, event, callback, selector)
    })
  }

  $.fn.trigger = function (event, args) {
    event = (isString(event) || $.isPlainObject(event)) ? $.Event(event) : compatible(event)
    event._args = args
    return this.each(function () {
      // handle focus(), blur() by calling them directly
      //如果focus和blur，直接调用 
      if (event.type in focus && typeof this[event.type] == "function") this[event.type]()
      // items in the collection might not be DOM elements
      else if ('dispatchEvent' in this) this.dispatchEvent(event)//dispatchEvent进行触发 
      else $(this).triggerHandler(event, args)
    })
  }

  // triggers event handlers on current element just as if an event occurred,
  // doesn't trigger an actual event, doesn't bubble
  $.fn.triggerHandler = function (event, args) {
    var e, result
    this.each(function (i, element) {
      e = createProxy(isString(event) ? $.Event(event) : event)
      e._args = args
      e.target = element
      $.each(findHandlers(element, event.type || event), function (i, handler) {
        result = handler.proxy(e)
        if (e.isImmediatePropagationStopped()) return false
      })
    })
    return result
  }

  // shortcut methods for `.bind(event, fn)` for each event type
  ;
  ('focusin focusout focus blur load resize scroll unload click dblclick ' +
    'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave ' +
    'change select keydown keypress keyup error').split(' ').forEach(function (event) {
    $.fn[event] = function (callback) {
      return (0 in arguments) ?
        this.bind(event, callback) :
        this.trigger(event)
    }
  })

  $.Event = function (type, props) {
    // 当type是个对象时,比如{type: 'click', data: 'test'}
    if (!isString(type)) props = type, type = props.type
    var event = document.createEvent(specialEvents[type] || 'Events'),
      bubbles = true
    if (props)
      for (var name in props)(name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name])
    event.initEvent(type, bubbles, true)
    return compatible(event)
  }

})(Zepto)