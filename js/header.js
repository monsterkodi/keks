// koffee 1.4.0

/*
000   000  00000000   0000000   0000000    00000000  00000000   
000   000  000       000   000  000   000  000       000   000  
000000000  0000000   000000000  000   000  0000000   0000000    
000   000  000       000   000  000   000  000       000   000  
000   000  00000000  000   000  0000000    00000000  000   000
 */
var $, File, Header, elem, klog, kpos, ref, slash,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), slash = ref.slash, elem = ref.elem, kpos = ref.kpos, klog = ref.klog, $ = ref.$;

File = require('./tools/file');

Header = (function() {
    function Header(browser) {
        this.browser = browser;
        this.onMouseUp = bind(this.onMouseUp, this);
        this.onMouseDown = bind(this.onMouseDown, this);
        this.elem = elem({
            id: 'header'
        });
        this.elem.addEventListener('mousedown', this.onMouseDown);
        this.elem.addEventListener('mouseup', this.onMouseUp);
        $('crumbs').appendChild(this.elem);
        this.crumb = elem({
            "class": 'crumb'
        });
        this.elem.appendChild(this.crumb);
    }

    Header.prototype.del = function() {
        return this.elem.remove();
    };

    Header.prototype.setDirty = function(dirty) {
        this.dirty = dirty;
        if (this.dirty) {
            if (this.crumb.firstChild.className !== 'dot') {
                this.crumb.appendChild(elem('span', {
                    "class": 'dot',
                    text: '●'
                }));
                return this.crumb.insertBefore(elem('span', {
                    "class": 'dot',
                    text: '●'
                }), this.crumb.firstChild);
            }
        } else {
            if (this.crumb.lastChild.className === 'dot') {
                this.crumb.lastChild.remove();
                return this.crumb.firstChild.remove();
            }
        }
    };

    Header.prototype.onMouseDown = function(event) {
        return this.downPos = kpos(window.win.getBounds());
    };

    Header.prototype.onMouseUp = function(event) {
        var br, root, upPos;
        if (!this.downPos) {
            return;
        }
        upPos = kpos(window.win.getBounds());
        if (upPos.to(this.downPos).length() > 0) {
            delete this.downPos;
            return;
        }
        if (event.target.id) {
            this.browser.browse(event.target.id);
        } else {
            root = this.crumb.firstChild;
            if (root.className === 'dot') {
                root = root.nextSibling;
            }
            br = root.getBoundingClientRect();
            if (kpos(event).x < br.left) {
                this.browser.browse(root.id);
            } else {
                this.browser.browse(this.file);
            }
        }
        return delete this.downPos;
    };

    Header.prototype.setFile = function(file) {
        this.file = file;
        return this.crumb.innerHTML = File.crumbSpan(slash.tilde(this.file));
    };

    return Header;

})();

module.exports = Header;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVhZGVyLmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSw2Q0FBQTtJQUFBOztBQVFBLE1BQWlDLE9BQUEsQ0FBUSxLQUFSLENBQWpDLEVBQUUsaUJBQUYsRUFBUyxlQUFULEVBQWUsZUFBZixFQUFxQixlQUFyQixFQUEyQjs7QUFFM0IsSUFBQSxHQUFPLE9BQUEsQ0FBUSxjQUFSOztBQUVEO0lBRUMsZ0JBQUMsT0FBRDtRQUFDLElBQUMsQ0FBQSxVQUFEOzs7UUFFQSxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUEsQ0FBSztZQUFBLEVBQUEsRUFBRyxRQUFIO1NBQUw7UUFDUixJQUFDLENBQUEsSUFBSSxDQUFDLGdCQUFOLENBQXVCLFdBQXZCLEVBQW1DLElBQUMsQ0FBQSxXQUFwQztRQUNBLElBQUMsQ0FBQSxJQUFJLENBQUMsZ0JBQU4sQ0FBdUIsU0FBdkIsRUFBbUMsSUFBQyxDQUFBLFNBQXBDO1FBQ0EsQ0FBQSxDQUFFLFFBQUYsQ0FBVyxDQUFDLFdBQVosQ0FBd0IsSUFBQyxDQUFBLElBQXpCO1FBRUEsSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFBLENBQUs7WUFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFNLE9BQU47U0FBTDtRQUNULElBQUMsQ0FBQSxJQUFJLENBQUMsV0FBTixDQUFrQixJQUFDLENBQUEsS0FBbkI7SUFSRDs7cUJBVUgsR0FBQSxHQUFLLFNBQUE7ZUFBRyxJQUFDLENBQUEsSUFBSSxDQUFDLE1BQU4sQ0FBQTtJQUFIOztxQkFFTCxRQUFBLEdBQVUsU0FBQyxLQUFEO1FBQUMsSUFBQyxDQUFBLFFBQUQ7UUFFUCxJQUFHLElBQUMsQ0FBQSxLQUFKO1lBQ0ksSUFBRyxJQUFDLENBQUEsS0FBSyxDQUFDLFVBQVUsQ0FBQyxTQUFsQixLQUErQixLQUFsQztnQkFDSSxJQUFDLENBQUEsS0FBSyxDQUFDLFdBQVAsQ0FBb0IsSUFBQSxDQUFLLE1BQUwsRUFBWTtvQkFBQSxDQUFBLEtBQUEsQ0FBQSxFQUFNLEtBQU47b0JBQVksSUFBQSxFQUFLLEdBQWpCO2lCQUFaLENBQXBCO3VCQUNBLElBQUMsQ0FBQSxLQUFLLENBQUMsWUFBUCxDQUFvQixJQUFBLENBQUssTUFBTCxFQUFZO29CQUFBLENBQUEsS0FBQSxDQUFBLEVBQU0sS0FBTjtvQkFBWSxJQUFBLEVBQUssR0FBakI7aUJBQVosQ0FBcEIsRUFBdUQsSUFBQyxDQUFBLEtBQUssQ0FBQyxVQUE5RCxFQUZKO2FBREo7U0FBQSxNQUFBO1lBS0ksSUFBRyxJQUFDLENBQUEsS0FBSyxDQUFDLFNBQVMsQ0FBQyxTQUFqQixLQUE4QixLQUFqQztnQkFDSSxJQUFDLENBQUEsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFqQixDQUFBO3VCQUNBLElBQUMsQ0FBQSxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQWxCLENBQUEsRUFGSjthQUxKOztJQUZNOztxQkFXVixXQUFBLEdBQWEsU0FBQyxLQUFEO2VBRVQsSUFBQyxDQUFBLE9BQUQsR0FBVyxJQUFBLENBQUssTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFYLENBQUEsQ0FBTDtJQUZGOztxQkFJYixTQUFBLEdBQVcsU0FBQyxLQUFEO0FBRVAsWUFBQTtRQUFBLElBQVUsQ0FBSSxJQUFDLENBQUEsT0FBZjtBQUFBLG1CQUFBOztRQUVBLEtBQUEsR0FBUSxJQUFBLENBQUssTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFYLENBQUEsQ0FBTDtRQUVSLElBQUcsS0FBSyxDQUFDLEVBQU4sQ0FBUyxJQUFDLENBQUEsT0FBVixDQUFrQixDQUFDLE1BQW5CLENBQUEsQ0FBQSxHQUE4QixDQUFqQztZQUNJLE9BQU8sSUFBQyxDQUFBO0FBQ1IsbUJBRko7O1FBSUEsSUFBRyxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQWhCO1lBQ0ksSUFBQyxDQUFBLE9BQU8sQ0FBQyxNQUFULENBQWdCLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBN0IsRUFESjtTQUFBLE1BQUE7WUFHSSxJQUFBLEdBQU8sSUFBQyxDQUFBLEtBQUssQ0FBQztZQUNkLElBQTJCLElBQUksQ0FBQyxTQUFMLEtBQWtCLEtBQTdDO2dCQUFBLElBQUEsR0FBTyxJQUFJLENBQUMsWUFBWjs7WUFDQSxFQUFBLEdBQUssSUFBSSxDQUFDLHFCQUFMLENBQUE7WUFDTCxJQUFHLElBQUEsQ0FBSyxLQUFMLENBQVcsQ0FBQyxDQUFaLEdBQWdCLEVBQUUsQ0FBQyxJQUF0QjtnQkFDSSxJQUFDLENBQUEsT0FBTyxDQUFDLE1BQVQsQ0FBZ0IsSUFBSSxDQUFDLEVBQXJCLEVBREo7YUFBQSxNQUFBO2dCQUdJLElBQUMsQ0FBQSxPQUFPLENBQUMsTUFBVCxDQUFnQixJQUFDLENBQUEsSUFBakIsRUFISjthQU5KOztlQVdBLE9BQU8sSUFBQyxDQUFBO0lBckJEOztxQkF1QlgsT0FBQSxHQUFTLFNBQUMsSUFBRDtRQUFDLElBQUMsQ0FBQSxPQUFEO2VBRU4sSUFBQyxDQUFBLEtBQUssQ0FBQyxTQUFQLEdBQW1CLElBQUksQ0FBQyxTQUFMLENBQWUsS0FBSyxDQUFDLEtBQU4sQ0FBWSxJQUFDLENBQUEsSUFBYixDQUFmO0lBRmQ7Ozs7OztBQUliLE1BQU0sQ0FBQyxPQUFQLEdBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiIyMjXG4wMDAgICAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMDAwMDAwICAgXG4wMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4wMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAgXG4wMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgXG4wMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4jIyNcblxueyBzbGFzaCwgZWxlbSwga3Bvcywga2xvZywgJCB9ID0gcmVxdWlyZSAna3hrJ1xuXG5GaWxlID0gcmVxdWlyZSAnLi90b29scy9maWxlJ1xuXG5jbGFzcyBIZWFkZXJcblxuICAgIEA6IChAYnJvd3NlcikgLT5cbiAgICAgICAgXG4gICAgICAgIEBlbGVtID0gZWxlbSBpZDonaGVhZGVyJ1xuICAgICAgICBAZWxlbS5hZGRFdmVudExpc3RlbmVyICdtb3VzZWRvd24nIEBvbk1vdXNlRG93blxuICAgICAgICBAZWxlbS5hZGRFdmVudExpc3RlbmVyICdtb3VzZXVwJyAgIEBvbk1vdXNlVXBcbiAgICAgICAgJCgnY3J1bWJzJykuYXBwZW5kQ2hpbGQgQGVsZW1cbiAgICAgICAgXG4gICAgICAgIEBjcnVtYiA9IGVsZW0gY2xhc3M6J2NydW1iJ1xuICAgICAgICBAZWxlbS5hcHBlbmRDaGlsZCBAY3J1bWJcblxuICAgIGRlbDogLT4gQGVsZW0ucmVtb3ZlKClcbiAgICBcbiAgICBzZXREaXJ0eTogKEBkaXJ0eSkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBkaXJ0eVxuICAgICAgICAgICAgaWYgQGNydW1iLmZpcnN0Q2hpbGQuY2xhc3NOYW1lICE9ICdkb3QnXG4gICAgICAgICAgICAgICAgQGNydW1iLmFwcGVuZENoaWxkICBlbGVtICdzcGFuJyBjbGFzczonZG90JyB0ZXh0Oifil48nIFxuICAgICAgICAgICAgICAgIEBjcnVtYi5pbnNlcnRCZWZvcmUgZWxlbSgnc3BhbicgY2xhc3M6J2RvdCcgdGV4dDon4pePJyksIEBjcnVtYi5maXJzdENoaWxkXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGlmIEBjcnVtYi5sYXN0Q2hpbGQuY2xhc3NOYW1lID09ICdkb3QnXG4gICAgICAgICAgICAgICAgQGNydW1iLmxhc3RDaGlsZC5yZW1vdmUoKVxuICAgICAgICAgICAgICAgIEBjcnVtYi5maXJzdENoaWxkLnJlbW92ZSgpXG4gICAgXG4gICAgb25Nb3VzZURvd246IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIEBkb3duUG9zID0ga3BvcyB3aW5kb3cud2luLmdldEJvdW5kcygpXG4gICAgICAgICAgICBcbiAgICBvbk1vdXNlVXA6IChldmVudCkgPT5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBpZiBub3QgQGRvd25Qb3NcbiAgICAgICAgXG4gICAgICAgIHVwUG9zID0ga3BvcyB3aW5kb3cud2luLmdldEJvdW5kcygpXG4gICAgICAgIFxuICAgICAgICBpZiB1cFBvcy50byhAZG93blBvcykubGVuZ3RoKCkgPiAwXG4gICAgICAgICAgICBkZWxldGUgQGRvd25Qb3NcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICBcbiAgICAgICAgaWYgZXZlbnQudGFyZ2V0LmlkXG4gICAgICAgICAgICBAYnJvd3Nlci5icm93c2UgZXZlbnQudGFyZ2V0LmlkXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJvb3QgPSBAY3J1bWIuZmlyc3RDaGlsZFxuICAgICAgICAgICAgcm9vdCA9IHJvb3QubmV4dFNpYmxpbmcgaWYgcm9vdC5jbGFzc05hbWUgPT0gJ2RvdCdcbiAgICAgICAgICAgIGJyID0gcm9vdC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgICAgICAgICAgaWYga3BvcyhldmVudCkueCA8IGJyLmxlZnRcbiAgICAgICAgICAgICAgICBAYnJvd3Nlci5icm93c2Ugcm9vdC5pZFxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIEBicm93c2VyLmJyb3dzZSBAZmlsZVxuICAgICAgICAgICAgXG4gICAgICAgIGRlbGV0ZSBAZG93blBvc1xuICAgICAgICBcbiAgICBzZXRGaWxlOiAoQGZpbGUpIC0+XG4gICAgICAgIFxuICAgICAgICBAY3J1bWIuaW5uZXJIVE1MID0gRmlsZS5jcnVtYlNwYW4gc2xhc2gudGlsZGUgQGZpbGVcbiAgICAgICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBIZWFkZXJcbiJdfQ==
//# sourceURL=../coffee/header.coffee