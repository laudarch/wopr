var blessed = require('blessed')
  , contrib = require('blessed-contrib')

function DocumentViewer(document, screen) {
   this.document = document
   this.screen = screen || blessed.screen()
   //console.log(JSON.stringify(document, null, 2))
}

DocumentViewer.prototype.renderPage = function(pageId, msg) {
   
   var self = this

   if (typeof(msg)=="undefined") msg = "press Return to continue"
   
   this.clear()

   var page = this.document.page[pageId]

   var grid = new contrib.grid({rows: 12, cols: 12, hideBorder: true, screen: this.screen, dashboardMargin: 5})

   for (var i in page.item) {
      var item = page.item[i]
      var className = Object.keys(item)[1]
      var ctor = contrib[className] || blessed[className]
      if (!ctor) {
        return "no such widget: " + className
      }
      var opts = this.readOptions(item[className][0], ctor)
      
      //workaround
      if (className=="picture") {
        opts.onReady = function() { self.screen.render() }
      }
      
      //workaround
      if (classname="bigtext" && !opts.font) {
        opts.font = __dirname + "/../lib/ter-u12n.json"
      }
      
      //console.log(JSON.stringify(opts, null, 2))
      grid.set(item.$.row, item.$.col, item.$.rowSpan, item.$.colSpan, ctor, opts)
   }

   var next = blessed.box({top: "90%", content: msg})
   this.screen.append(next)

   this.screen.render()
   return null
}

DocumentViewer.prototype.clear = function(node) {
   var i = this.screen.children.length
   while (i--) this.screen.children[i].detach()
}

DocumentViewer.prototype.readOptions = function(node, ctor) {
   
   var optionsMethod = ctor.prototype["getOptionsPrototype"]
   var optionsMainProto = optionsMethod==null ? null : optionsMethod()
   //console.log(optionsMainProto)
   return this.readOptionsInner(node, optionsMainProto)
}

DocumentViewer.prototype.readOptionsInner = function(node, optionsMainProto) {
   var res = {}
  
   var items = []
   for (var attr in node.$) {
     items.push({name: attr, value: node.$[attr]})
   }
   
   for (var n in node) {
     if (n!='$') items.push( { name: n, value: node[n] } )
   }
   
   for (var i=0; i<items.length; i++) {
      
      var item = items[i]
      
      var proto = optionsMainProto
      var tokens = item.name.split('-')
      
      res[tokens[0]] = res[tokens[0]] || {}
      if (proto!=null) proto=proto[tokens[0]]
      var last = res
      for (var j=1; j<tokens.length; j++) {
         last[tokens[j-1]][tokens[j]] = last[tokens[j-1]][tokens[j]] || {}
         last = last[tokens[j-1]]
         if (proto!=null) proto=proto[tokens[j]]
      }
      
      var val = this.convert(item.value, proto)
      
      last[tokens[tokens.length-1]] = val
   }
  

   return res
}

DocumentViewer.prototype.convert = function(val, type) {

  var self = this
  
  if (type==null) return val
  
  if (Array.isArray(type)) {
    
    if (Array.isArray(type[0])) {
      var lines = val[0].split("\n")
      var res = []
      for (var i=0; i<lines.length; i++) {
        var s = lines[i].trim()
        if (s.length>0) res.push(self.convertArray(s, type[0][0]))
      }
      return res
    }
    else if (typeof(type[0])=="object") {
      var res = []
      for (var i=0; i<val[0].m.length; i++) {
        res.push(this.readOptionsInner(val[0].m[i], type[0]))
      }
      return res
    }
    
    return this.convertArray(val, type)
  }
  
  if (typeof(type)=="number") return parseFloat(val)
  
  if (typeof(type)=="string") {
    if (Array.isArray(val)) return val.join('').trim()
  }
  
  if (typeof(type)=="boolean") {
    return val==="true"
  }
  
  
  
  return val
}

DocumentViewer.prototype.convertArray = function(str, type) {
    var res = str.split(",")
    if (typeof(type[0])=="number") {
      res = res.map(function (x) {
        return parseFloat(x);
      });
    }
    
    return res
}

module.exports = DocumentViewer

