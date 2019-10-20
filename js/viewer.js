// koffee 1.4.0

/*
000   000  000  00000000  000   000  00000000  00000000 
000   000  000  000       000 0 000  000       000   000
 000 000   000  0000000   000000000  0000000   0000000  
   000     000  000       000   000  000       000   000
    0      000  00000000  00     00  00000000  000   000
 */
var $, File, Viewer, dirlist, elem, empty, keyinfo, klog, open, ref, slash, stopEvent,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), slash = ref.slash, empty = ref.empty, open = ref.open, elem = ref.elem, stopEvent = ref.stopEvent, keyinfo = ref.keyinfo, klog = ref.klog, $ = ref.$;

dirlist = require('./tools/dirlist');

File = require('./tools/file');

Viewer = (function() {
    function Viewer(dir) {
        this.dir = dir;
        this.close = bind(this.close, this);
        this.onKey = bind(this.onKey, this);
        dirlist(this.dir, (function(_this) {
            return function(items) {
                var cnt, file, i, images, img, len, main;
                images = items.filter(function(item) {
                    return File.isImage(item.file);
                });
                if (empty(images)) {
                    return;
                }
                _this.div = elem({
                    "class": 'viewer',
                    tabindex: 1
                });
                _this.focus = document.activeElement;
                for (i = 0, len = images.length; i < len; i++) {
                    file = images[i].file;
                    img = elem('img', {
                        "class": 'viewerImage',
                        src: slash.fileUrl(file)
                    });
                    cnt = elem({
                        "class": 'viewerImageContainer',
                        child: img
                    });
                    cnt.addEventListener('dblclick', (function(file) {
                        return function() {
                            return open(file);
                        };
                    })(file));
                    _this.div.appendChild(cnt);
                    main = $('#main');
                }
                main.appendChild(_this.div);
                _this.div.addEventListener('keydown', _this.onKey);
                return _this.div.focus();
            };
        })(this));
    }

    Viewer.prototype.onKey = function(event) {
        var char, combo, key, mod, ref1;
        ref1 = keyinfo.forEvent(event), mod = ref1.mod, key = ref1.key, combo = ref1.combo, char = ref1.char;
        switch (combo) {
            case 'esc':
            case 'space':
                this.close();
        }
        return typeof event.stopPropagation === "function" ? event.stopPropagation() : void 0;
    };

    Viewer.prototype.close = function() {
        this.div.remove();
        return this.focus.focus();
    };

    return Viewer;

})();

module.exports = Viewer;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld2VyLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxpRkFBQTtJQUFBOztBQVFBLE1BQTRELE9BQUEsQ0FBUSxLQUFSLENBQTVELEVBQUUsaUJBQUYsRUFBUyxpQkFBVCxFQUFnQixlQUFoQixFQUFzQixlQUF0QixFQUE0Qix5QkFBNUIsRUFBdUMscUJBQXZDLEVBQWdELGVBQWhELEVBQXNEOztBQUV0RCxPQUFBLEdBQVUsT0FBQSxDQUFRLGlCQUFSOztBQUNWLElBQUEsR0FBVSxPQUFBLENBQVEsY0FBUjs7QUFFSjtJQUVDLGdCQUFDLEdBQUQ7UUFBQyxJQUFDLENBQUEsTUFBRDs7O1FBRUEsT0FBQSxDQUFRLElBQUMsQ0FBQSxHQUFULEVBQWMsQ0FBQSxTQUFBLEtBQUE7bUJBQUEsU0FBQyxLQUFEO0FBRVYsb0JBQUE7Z0JBQUEsTUFBQSxHQUFTLEtBQUssQ0FBQyxNQUFOLENBQWEsU0FBQyxJQUFEOzJCQUFVLElBQUksQ0FBQyxPQUFMLENBQWEsSUFBSSxDQUFDLElBQWxCO2dCQUFWLENBQWI7Z0JBRVQsSUFBVSxLQUFBLENBQU0sTUFBTixDQUFWO0FBQUEsMkJBQUE7O2dCQUVBLEtBQUMsQ0FBQSxHQUFELEdBQU8sSUFBQSxDQUFLO29CQUFBLENBQUEsS0FBQSxDQUFBLEVBQU0sUUFBTjtvQkFBZSxRQUFBLEVBQVMsQ0FBeEI7aUJBQUw7Z0JBRVAsS0FBQyxDQUFBLEtBQUQsR0FBUyxRQUFRLENBQUM7QUFFbEIscUJBQUEsd0NBQUE7b0JBQUs7b0JBRUQsR0FBQSxHQUFNLElBQUEsQ0FBSyxLQUFMLEVBQVc7d0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTSxhQUFOO3dCQUFvQixHQUFBLEVBQUksS0FBSyxDQUFDLE9BQU4sQ0FBYyxJQUFkLENBQXhCO3FCQUFYO29CQUNOLEdBQUEsR0FBTSxJQUFBLENBQUs7d0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTSxzQkFBTjt3QkFBNkIsS0FBQSxFQUFNLEdBQW5DO3FCQUFMO29CQUNOLEdBQUcsQ0FBQyxnQkFBSixDQUFxQixVQUFyQixFQUFnQyxDQUFDLFNBQUMsSUFBRDsrQkFBVSxTQUFBO21DQUFHLElBQUEsQ0FBSyxJQUFMO3dCQUFIO29CQUFWLENBQUQsQ0FBQSxDQUF5QixJQUF6QixDQUFoQztvQkFDQSxLQUFDLENBQUEsR0FBRyxDQUFDLFdBQUwsQ0FBaUIsR0FBakI7b0JBRUEsSUFBQSxHQUFNLENBQUEsQ0FBRSxPQUFGO0FBUFY7Z0JBU0EsSUFBSSxDQUFDLFdBQUwsQ0FBaUIsS0FBQyxDQUFBLEdBQWxCO2dCQUVBLEtBQUMsQ0FBQSxHQUFHLENBQUMsZ0JBQUwsQ0FBc0IsU0FBdEIsRUFBZ0MsS0FBQyxDQUFBLEtBQWpDO3VCQUNBLEtBQUMsQ0FBQSxHQUFHLENBQUMsS0FBTCxDQUFBO1lBdEJVO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFkO0lBRkQ7O3FCQWdDSCxLQUFBLEdBQU8sU0FBQyxLQUFEO0FBRUgsWUFBQTtRQUFBLE9BQTRCLE9BQU8sQ0FBQyxRQUFSLENBQWlCLEtBQWpCLENBQTVCLEVBQUUsY0FBRixFQUFPLGNBQVAsRUFBWSxrQkFBWixFQUFtQjtBQUVuQixnQkFBTyxLQUFQO0FBQUEsaUJBQ1MsS0FEVDtBQUFBLGlCQUNlLE9BRGY7Z0JBQzRCLElBQUMsQ0FBQSxLQUFELENBQUE7QUFENUI7NkRBSUEsS0FBSyxDQUFDO0lBUkg7O3FCQVVQLEtBQUEsR0FBTyxTQUFBO1FBRUgsSUFBQyxDQUFBLEdBQUcsQ0FBQyxNQUFMLENBQUE7ZUFDQSxJQUFDLENBQUEsS0FBSyxDQUFDLEtBQVAsQ0FBQTtJQUhHOzs7Ozs7QUFLWCxNQUFNLENBQUMsT0FBUCxHQUFpQiIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAwICAgMDAwICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCBcbjAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gMDAwIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgIFxuICAgMDAwICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDBcbiAgICAwICAgICAgMDAwICAwMDAwMDAwMCAgMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyBzbGFzaCwgZW1wdHksIG9wZW4sIGVsZW0sIHN0b3BFdmVudCwga2V5aW5mbywga2xvZywgJCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5kaXJsaXN0ID0gcmVxdWlyZSAnLi90b29scy9kaXJsaXN0J1xuRmlsZSAgICA9IHJlcXVpcmUgJy4vdG9vbHMvZmlsZSdcblxuY2xhc3MgVmlld2VyXG5cbiAgICBAOiAoQGRpcikgLT5cbiAgICAgICAgXG4gICAgICAgIGRpcmxpc3QgQGRpciwgKGl0ZW1zKSA9PlxuXG4gICAgICAgICAgICBpbWFnZXMgPSBpdGVtcy5maWx0ZXIgKGl0ZW0pIC0+IEZpbGUuaXNJbWFnZSBpdGVtLmZpbGVcblxuICAgICAgICAgICAgcmV0dXJuIGlmIGVtcHR5IGltYWdlc1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBAZGl2ID0gZWxlbSBjbGFzczondmlld2VyJyB0YWJpbmRleDoxXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIEBmb2N1cyA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnRcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIHtmaWxlfSBpbiBpbWFnZXNcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpbWcgPSBlbGVtICdpbWcnIGNsYXNzOid2aWV3ZXJJbWFnZScgc3JjOnNsYXNoLmZpbGVVcmwgZmlsZVxuICAgICAgICAgICAgICAgIGNudCA9IGVsZW0gY2xhc3M6J3ZpZXdlckltYWdlQ29udGFpbmVyJyBjaGlsZDppbWdcbiAgICAgICAgICAgICAgICBjbnQuYWRkRXZlbnRMaXN0ZW5lciAnZGJsY2xpY2snICgoZmlsZSkgLT4gLT4gb3BlbiBmaWxlKShmaWxlKVxuICAgICAgICAgICAgICAgIEBkaXYuYXBwZW5kQ2hpbGQgY250XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBtYWluID0kICcjbWFpbidcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIG1haW4uYXBwZW5kQ2hpbGQgQGRpdlxuXG4gICAgICAgICAgICBAZGl2LmFkZEV2ZW50TGlzdGVuZXIgJ2tleWRvd24nIEBvbktleVxuICAgICAgICAgICAgQGRpdi5mb2N1cygpXG4gICAgICAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgICAwMDAwMCAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIG9uS2V5OiAoZXZlbnQpID0+XG5cbiAgICAgICAgeyBtb2QsIGtleSwgY29tYm8sIGNoYXIgfSA9IGtleWluZm8uZm9yRXZlbnQgZXZlbnRcblxuICAgICAgICBzd2l0Y2ggY29tYm9cbiAgICAgICAgICAgIHdoZW4gJ2VzYycgJ3NwYWNlJyB0aGVuIEBjbG9zZSgpXG4gICAgICAgICAgICAjIGVsc2Uga2xvZyAnY29tYm8nIGNvbWJvXG4gICAgICAgICAgICBcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uPygpXG4gICAgICAgICAgICBcbiAgICBjbG9zZTogPT5cblxuICAgICAgICBAZGl2LnJlbW92ZSgpXG4gICAgICAgIEBmb2N1cy5mb2N1cygpXG5cbm1vZHVsZS5leHBvcnRzID0gVmlld2VyXG4iXX0=
//# sourceURL=../coffee/viewer.coffee