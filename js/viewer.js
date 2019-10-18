// koffee 1.3.0

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
                this.close();
        }
        return typeof event.stopPropagation === "function" ? event.stopPropagation() : void 0;
    };

    Viewer.prototype.close = function() {
        klog('close');
        this.div.remove();
        return this.focus.focus();
    };

    return Viewer;

})();

module.exports = Viewer;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlld2VyLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSxpRkFBQTtJQUFBOztBQVFBLE1BQTRELE9BQUEsQ0FBUSxLQUFSLENBQTVELEVBQUUsaUJBQUYsRUFBUyxpQkFBVCxFQUFnQixlQUFoQixFQUFzQixlQUF0QixFQUE0Qix5QkFBNUIsRUFBdUMscUJBQXZDLEVBQWdELGVBQWhELEVBQXNEOztBQUV0RCxPQUFBLEdBQVUsT0FBQSxDQUFRLGlCQUFSOztBQUNWLElBQUEsR0FBVSxPQUFBLENBQVEsY0FBUjs7QUFFSjtJQUVDLGdCQUFDLEdBQUQ7UUFBQyxJQUFDLENBQUEsTUFBRDs7O1FBRUEsT0FBQSxDQUFRLElBQUMsQ0FBQSxHQUFULEVBQWMsQ0FBQSxTQUFBLEtBQUE7bUJBQUEsU0FBQyxLQUFEO0FBRVYsb0JBQUE7Z0JBQUEsTUFBQSxHQUFTLEtBQUssQ0FBQyxNQUFOLENBQWEsU0FBQyxJQUFEOzJCQUFVLElBQUksQ0FBQyxPQUFMLENBQWEsSUFBSSxDQUFDLElBQWxCO2dCQUFWLENBQWI7Z0JBRVQsSUFBVSxLQUFBLENBQU0sTUFBTixDQUFWO0FBQUEsMkJBQUE7O2dCQUVBLEtBQUMsQ0FBQSxHQUFELEdBQU8sSUFBQSxDQUFLO29CQUFBLENBQUEsS0FBQSxDQUFBLEVBQU0sUUFBTjtvQkFBZSxRQUFBLEVBQVMsQ0FBeEI7aUJBQUw7Z0JBRVAsS0FBQyxDQUFBLEtBQUQsR0FBUyxRQUFRLENBQUM7QUFFbEIscUJBQUEsd0NBQUE7b0JBQUs7b0JBRUQsR0FBQSxHQUFNLElBQUEsQ0FBSyxLQUFMLEVBQVc7d0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTSxhQUFOO3dCQUFvQixHQUFBLEVBQUksS0FBSyxDQUFDLE9BQU4sQ0FBYyxJQUFkLENBQXhCO3FCQUFYO29CQUNOLEdBQUEsR0FBTSxJQUFBLENBQUs7d0JBQUEsQ0FBQSxLQUFBLENBQUEsRUFBTSxzQkFBTjt3QkFBNkIsS0FBQSxFQUFNLEdBQW5DO3FCQUFMO29CQUNOLEdBQUcsQ0FBQyxnQkFBSixDQUFxQixVQUFyQixFQUFnQyxDQUFDLFNBQUMsSUFBRDsrQkFBVSxTQUFBO21DQUFHLElBQUEsQ0FBSyxJQUFMO3dCQUFIO29CQUFWLENBQUQsQ0FBQSxDQUF5QixJQUF6QixDQUFoQztvQkFDQSxLQUFDLENBQUEsR0FBRyxDQUFDLFdBQUwsQ0FBaUIsR0FBakI7b0JBRUEsSUFBQSxHQUFNLENBQUEsQ0FBRSxPQUFGO0FBUFY7Z0JBU0EsSUFBSSxDQUFDLFdBQUwsQ0FBaUIsS0FBQyxDQUFBLEdBQWxCO2dCQUVBLEtBQUMsQ0FBQSxHQUFHLENBQUMsZ0JBQUwsQ0FBc0IsU0FBdEIsRUFBZ0MsS0FBQyxDQUFBLEtBQWpDO3VCQUNBLEtBQUMsQ0FBQSxHQUFHLENBQUMsS0FBTCxDQUFBO1lBdEJVO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFkO0lBRkQ7O3FCQTBCSCxLQUFBLEdBQU8sU0FBQyxLQUFEO0FBRUgsWUFBQTtRQUFBLE9BQTRCLE9BQU8sQ0FBQyxRQUFSLENBQWlCLEtBQWpCLENBQTVCLEVBQUUsY0FBRixFQUFPLGNBQVAsRUFBWSxrQkFBWixFQUFtQjtBQUVuQixnQkFBTyxLQUFQO0FBQUEsaUJBQ1MsS0FEVDtnQkFDb0IsSUFBQyxDQUFBLEtBQUQsQ0FBQTtBQURwQjs2REFJQSxLQUFLLENBQUM7SUFSSDs7cUJBVVAsS0FBQSxHQUFPLFNBQUE7UUFDSCxJQUFBLENBQUssT0FBTDtRQUNBLElBQUMsQ0FBQSxHQUFHLENBQUMsTUFBTCxDQUFBO2VBQ0EsSUFBQyxDQUFBLEtBQUssQ0FBQyxLQUFQLENBQUE7SUFIRzs7Ozs7O0FBS1gsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMCAgIDAwMCAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAgXG4wMDAgICAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMFxuIDAwMCAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICBcbiAgIDAwMCAgICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgMCAgICAgIDAwMCAgMDAwMDAwMDAgIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMFxuIyMjXG5cbnsgc2xhc2gsIGVtcHR5LCBvcGVuLCBlbGVtLCBzdG9wRXZlbnQsIGtleWluZm8sIGtsb2csICQgfSA9IHJlcXVpcmUgJ2t4aydcblxuZGlybGlzdCA9IHJlcXVpcmUgJy4vdG9vbHMvZGlybGlzdCdcbkZpbGUgICAgPSByZXF1aXJlICcuL3Rvb2xzL2ZpbGUnXG5cbmNsYXNzIFZpZXdlclxuXG4gICAgQDogKEBkaXIpIC0+XG4gICAgICAgIFxuICAgICAgICBkaXJsaXN0IEBkaXIsIChpdGVtcykgPT5cblxuICAgICAgICAgICAgaW1hZ2VzID0gaXRlbXMuZmlsdGVyIChpdGVtKSAtPiBGaWxlLmlzSW1hZ2UgaXRlbS5maWxlXG5cbiAgICAgICAgICAgIHJldHVybiBpZiBlbXB0eSBpbWFnZXNcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgQGRpdiA9IGVsZW0gY2xhc3M6J3ZpZXdlcicgdGFiaW5kZXg6MVxuICAgICAgICAgICAgXG4gICAgICAgICAgICBAZm9jdXMgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGZvciB7ZmlsZX0gaW4gaW1hZ2VzXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaW1nID0gZWxlbSAnaW1nJyBjbGFzczondmlld2VySW1hZ2UnIHNyYzpzbGFzaC5maWxlVXJsIGZpbGVcbiAgICAgICAgICAgICAgICBjbnQgPSBlbGVtIGNsYXNzOid2aWV3ZXJJbWFnZUNvbnRhaW5lcicgY2hpbGQ6aW1nXG4gICAgICAgICAgICAgICAgY250LmFkZEV2ZW50TGlzdGVuZXIgJ2RibGNsaWNrJyAoKGZpbGUpIC0+IC0+IG9wZW4gZmlsZSkoZmlsZSlcbiAgICAgICAgICAgICAgICBAZGl2LmFwcGVuZENoaWxkIGNudFxuICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgbWFpbiA9JCAnI21haW4nXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBtYWluLmFwcGVuZENoaWxkIEBkaXZcblxuICAgICAgICAgICAgQGRpdi5hZGRFdmVudExpc3RlbmVyICdrZXlkb3duJyBAb25LZXlcbiAgICAgICAgICAgIEBkaXYuZm9jdXMoKVxuICAgICAgICAgICAgXG4gICAgb25LZXk6IChldmVudCkgPT5cblxuICAgICAgICB7IG1vZCwga2V5LCBjb21ibywgY2hhciB9ID0ga2V5aW5mby5mb3JFdmVudCBldmVudFxuXG4gICAgICAgIHN3aXRjaCBjb21ib1xuICAgICAgICAgICAgd2hlbiAnZXNjJyB0aGVuIEBjbG9zZSgpXG4gICAgICAgICAgICAjIGVsc2Uga2xvZyAnY29tYm8nIGNvbWJvXG4gICAgICAgICAgICBcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uPygpXG4gICAgICAgICAgICBcbiAgICBjbG9zZTogPT5cbiAgICAgICAga2xvZyAnY2xvc2UnXG4gICAgICAgIEBkaXYucmVtb3ZlKClcbiAgICAgICAgQGZvY3VzLmZvY3VzKClcblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3ZXJcbiJdfQ==
//# sourceURL=../coffee/viewer.coffee