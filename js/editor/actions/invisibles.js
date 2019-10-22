// koffee 1.4.0
var Invisibles, _, kerror, prefs, ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

ref = require('kxk'), prefs = ref.prefs, kerror = ref.kerror, _ = ref._;

Invisibles = (function() {
    function Invisibles(editor) {
        this.editor = editor;
        this.onLineChanged = bind(this.onLineChanged, this);
        this.onLineInserted = bind(this.onLineInserted, this);
        this.onFile = bind(this.onFile, this);
        this.editor.on('file', this.onFile);
    }

    Invisibles.prototype.del = function() {
        return this.editor.removeListener('file', this.onFile);
    };

    Invisibles.prototype.onFile = function(file) {
        if (prefs.get("invisibles▸" + file)) {
            return this.show();
        } else {
            return this.clear();
        }
    };

    Invisibles.prototype.onLineInserted = function(li) {
        var kind, line, n, p, results, s;
        line = this.editor.line(li);
        kind = line.endsWith(' ') && 'trailing' || 'newline';
        this.editor.meta.add({
            line: li,
            html: '&#9687',
            start: line.length,
            end: line.length,
            yOffset: -1,
            clss: 'invisible ' + kind
        });
        s = this.editor.tabline(li);
        p = 0;
        results = [];
        while (p < s.length) {
            n = 1;
            if (s[p] === '\t') {
                n = 4 - (p % 4);
                s = s.splice(p, 1, _.padStart("", n));
                this.editor.meta.add({
                    line: li,
                    html: '&#9656',
                    start: p,
                    end: p,
                    yOffset: -1,
                    clss: 'invisible invisible-tab'
                });
            }
            results.push(p += n);
        }
        return results;
    };

    Invisibles.prototype.onLineChanged = function(li) {
        var metas;
        metas = this.editor.meta.metasAtLineIndex(li).filter(function(m) {
            return m[2].clss.startsWith('invisible');
        });
        if (!metas.length) {
            return kerror("no invisible meta at line " + li + "?");
        }
        this.editor.meta.delMeta(metas[0]);
        return this.onLineInserted(li);
    };

    Invisibles.prototype.activate = function() {
        var ref1;
        prefs.set("invisibles▸" + ((ref1 = this.editor.currentFile) != null ? ref1 : this.editor.name), true);
        return this.show();
    };

    Invisibles.prototype.deactivate = function() {
        prefs.set("invisibles▸" + this.editor.currentFile);
        return this.clear();
    };

    Invisibles.prototype.clear = function() {
        this.editor.removeListener('lineChanged', this.onLineChanged);
        this.editor.removeListener('lineInserted', this.onLineInserted);
        return this.editor.meta.delClass('invisible');
    };

    Invisibles.prototype.show = function() {
        var i, li, ref1, results;
        this.clear();
        this.editor.on('lineChanged', this.onLineChanged);
        this.editor.on('lineInserted', this.onLineInserted);
        results = [];
        for (li = i = 0, ref1 = this.editor.numLines(); 0 <= ref1 ? i < ref1 : i > ref1; li = 0 <= ref1 ? ++i : --i) {
            results.push(this.onLineInserted(li));
        }
        return results;
    };

    return Invisibles;

})();

module.exports = {
    actions: {
        toggleInvisibles: {
            name: 'Toggle Invisibles',
            text: 'toggle invisibles for current file',
            combo: 'ctrl+i'
        }
    },
    toggleInvisibles: function() {
        var ref1;
        if (!this.invisibles) {
            return;
        }
        if (prefs.get("invisibles▸" + ((ref1 = this.currentFile) != null ? ref1 : this.name), false)) {
            return this.invisibles.deactivate();
        } else {
            return this.invisibles.activate();
        }
    },
    initInvisibles: function() {
        return this.invisibles != null ? this.invisibles : this.invisibles = new Invisibles(this);
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52aXNpYmxlcy5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQU9BLElBQUEsaUNBQUE7SUFBQTs7QUFBQSxNQUF1QixPQUFBLENBQVEsS0FBUixDQUF2QixFQUFFLGlCQUFGLEVBQVMsbUJBQVQsRUFBaUI7O0FBRVg7SUFFQyxvQkFBQyxNQUFEO1FBQUMsSUFBQyxDQUFBLFNBQUQ7Ozs7UUFBWSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxNQUFYLEVBQW1CLElBQUMsQ0FBQSxNQUFwQjtJQUFiOzt5QkFFSCxHQUFBLEdBQUssU0FBQTtlQUFHLElBQUMsQ0FBQSxNQUFNLENBQUMsY0FBUixDQUF1QixNQUF2QixFQUErQixJQUFDLENBQUEsTUFBaEM7SUFBSDs7eUJBRUwsTUFBQSxHQUFRLFNBQUMsSUFBRDtRQUVKLElBQUcsS0FBSyxDQUFDLEdBQU4sQ0FBVSxhQUFBLEdBQWMsSUFBeEIsQ0FBSDttQkFDSSxJQUFDLENBQUEsSUFBRCxDQUFBLEVBREo7U0FBQSxNQUFBO21CQUdJLElBQUMsQ0FBQSxLQUFELENBQUEsRUFISjs7SUFGSTs7eUJBYVIsY0FBQSxHQUFnQixTQUFDLEVBQUQ7QUFFWixZQUFBO1FBQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxNQUFNLENBQUMsSUFBUixDQUFhLEVBQWI7UUFDUCxJQUFBLEdBQU8sSUFBSSxDQUFDLFFBQUwsQ0FBYyxHQUFkLENBQUEsSUFBdUIsVUFBdkIsSUFBcUM7UUFDNUMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBYixDQUNJO1lBQUEsSUFBQSxFQUFPLEVBQVA7WUFDQSxJQUFBLEVBQU8sUUFEUDtZQUVBLEtBQUEsRUFBTyxJQUFJLENBQUMsTUFGWjtZQUdBLEdBQUEsRUFBTyxJQUFJLENBQUMsTUFIWjtZQUlBLE9BQUEsRUFBUyxDQUFDLENBSlY7WUFLQSxJQUFBLEVBQU8sWUFBQSxHQUFlLElBTHRCO1NBREo7UUFRQSxDQUFB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QUMsQ0FBQSxVQUFmO0FBQUEsbUJBQUE7O1FBRUEsSUFBRyxLQUFLLENBQUMsR0FBTixDQUFVLGFBQUEsR0FBYSw0Q0FBZ0IsSUFBQyxDQUFBLElBQWpCLENBQXZCLEVBQStDLEtBQS9DLENBQUg7bUJBQ0ksSUFBQyxDQUFBLFVBQVUsQ0FBQyxVQUFaLENBQUEsRUFESjtTQUFBLE1BQUE7bUJBR0ksSUFBQyxDQUFBLFVBQVUsQ0FBQyxRQUFaLENBQUEsRUFISjs7SUFKYyxDQVBsQjtJQWdCQSxjQUFBLEVBQWdCLFNBQUE7eUNBQUcsSUFBQyxDQUFBLGFBQUQsSUFBQyxDQUFBLGFBQWMsSUFBSSxVQUFKLENBQWUsSUFBZjtJQUFsQixDQWhCaEIiLCJzb3VyY2VzQ29udGVudCI6WyJcbiMgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMFxuIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMFxuIyAwMDAgIDAwMCAwIDAwMCAgIDAwMCAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDBcbiMgMDAwICAwMDAgIDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgIDAwMFxuIyAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcblxueyBwcmVmcywga2Vycm9yLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbmNsYXNzIEludmlzaWJsZXNcblxuICAgIEA6IChAZWRpdG9yKSAtPiBAZWRpdG9yLm9uICdmaWxlJywgQG9uRmlsZVxuXG4gICAgZGVsOiAtPiBAZWRpdG9yLnJlbW92ZUxpc3RlbmVyICdmaWxlJywgQG9uRmlsZVxuXG4gICAgb25GaWxlOiAoZmlsZSkgPT5cblxuICAgICAgICBpZiBwcmVmcy5nZXQgXCJpbnZpc2libGVz4pa4I3tmaWxlfVwiXG4gICAgICAgICAgICBAc2hvdygpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIEBjbGVhcigpXG5cbiAgICAjIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAwICAgMDAwMDAwMDAwICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAwMDAwICAgICAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBvbkxpbmVJbnNlcnRlZDogKGxpKSA9PlxuXG4gICAgICAgIGxpbmUgPSBAZWRpdG9yLmxpbmUgbGlcbiAgICAgICAga2luZCA9IGxpbmUuZW5kc1dpdGgoJyAnKSBhbmQgJ3RyYWlsaW5nJyBvciAnbmV3bGluZSdcbiAgICAgICAgQGVkaXRvci5tZXRhLmFkZFxuICAgICAgICAgICAgbGluZTogIGxpXG4gICAgICAgICAgICBodG1sOiAgJyYjOTY4NydcbiAgICAgICAgICAgIHN0YXJ0OiBsaW5lLmxlbmd0aFxuICAgICAgICAgICAgZW5kOiAgIGxpbmUubGVuZ3RoXG4gICAgICAgICAgICB5T2Zmc2V0OiAtMVxuICAgICAgICAgICAgY2xzczogICdpbnZpc2libGUgJyArIGtpbmRcbiAgICAgICAgICAgIFxuICAgICAgICBzID0gQGVkaXRvci50YWJsaW5lIGxpXG4gICAgICAgIHAgPSAwXG4gICAgICAgIHdoaWxlIHAgPCBzLmxlbmd0aFxuICAgICAgICAgICAgbiA9IDFcbiAgICAgICAgICAgIGlmIHNbcF0gPT0gJ1xcdCdcbiAgICAgICAgICAgICAgICBuID0gNC0ocCU0KVxuICAgICAgICAgICAgICAgIHMgPSBzLnNwbGljZSBwLCAxLCBfLnBhZFN0YXJ0IFwiXCIsIG5cbiAgICAgICAgICAgICAgICBAZWRpdG9yLm1ldGEuYWRkXG4gICAgICAgICAgICAgICAgICAgIGxpbmU6ICBsaVxuICAgICAgICAgICAgICAgICAgICBodG1sOiAgJyYjOTY1NidcbiAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IHBcbiAgICAgICAgICAgICAgICAgICAgZW5kOiAgIHBcbiAgICAgICAgICAgICAgICAgICAgeU9mZnNldDogLTFcbiAgICAgICAgICAgICAgICAgICAgY2xzczogICdpbnZpc2libGUgaW52aXNpYmxlLXRhYidcbiAgICAgICAgICAgIHAgKz0gblxuICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgb25MaW5lQ2hhbmdlZDogKGxpKSA9PlxuXG4gICAgICAgIG1ldGFzID0gQGVkaXRvci5tZXRhLm1ldGFzQXRMaW5lSW5kZXgobGkpLmZpbHRlciAobSkgLT4gbVsyXS5jbHNzLnN0YXJ0c1dpdGggJ2ludmlzaWJsZSdcbiAgICAgICAgcmV0dXJuIGtlcnJvciBcIm5vIGludmlzaWJsZSBtZXRhIGF0IGxpbmUgI3tsaX0/XCIgaWYgbm90IG1ldGFzLmxlbmd0aFxuICAgICAgICBAZWRpdG9yLm1ldGEuZGVsTWV0YSBtZXRhc1swXVxuICAgICAgICBAb25MaW5lSW5zZXJ0ZWQgbGlcblxuICAgICMgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgMCAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMCAgXG4gICAgXG4gICAgYWN0aXZhdGU6IC0+XG5cbiAgICAgICAgcHJlZnMuc2V0IFwiaW52aXNpYmxlc+KWuCN7QGVkaXRvci5jdXJyZW50RmlsZSA/IEBlZGl0b3IubmFtZX1cIiB0cnVlXG4gICAgICAgIEBzaG93KClcbiAgICAgICAgXG4gICAgZGVhY3RpdmF0ZTogLT5cblxuICAgICAgICBwcmVmcy5zZXQgXCJpbnZpc2libGVz4pa4I3tAZWRpdG9yLmN1cnJlbnRGaWxlfVwiXG4gICAgICAgIEBjbGVhcigpXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgY2xlYXI6IC0+XG5cbiAgICAgICAgQGVkaXRvci5yZW1vdmVMaXN0ZW5lciAnbGluZUNoYW5nZWQnICBAb25MaW5lQ2hhbmdlZFxuICAgICAgICBAZWRpdG9yLnJlbW92ZUxpc3RlbmVyICdsaW5lSW5zZXJ0ZWQnIEBvbkxpbmVJbnNlcnRlZFxuICAgICAgICBAZWRpdG9yLm1ldGEuZGVsQ2xhc3MgJ2ludmlzaWJsZSdcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIFxuICAgICMgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMDAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwMDAwMCAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMCAgICAgMDAgIFxuICAgIFxuICAgIHNob3c6IC0+XG5cbiAgICAgICAgQGNsZWFyKClcblxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lQ2hhbmdlZCcgIEBvbkxpbmVDaGFuZ2VkXG4gICAgICAgIEBlZGl0b3Iub24gJ2xpbmVJbnNlcnRlZCcgQG9uTGluZUluc2VydGVkXG5cbiAgICAgICAgZm9yIGxpIGluIFswLi4uQGVkaXRvci5udW1MaW5lcygpXVxuICAgICAgICAgICAgQG9uTGluZUluc2VydGVkIGxpXG5cbm1vZHVsZS5leHBvcnRzID1cblxuICAgIGFjdGlvbnM6XG5cbiAgICAgICAgdG9nZ2xlSW52aXNpYmxlczpcbiAgICAgICAgICAgIG5hbWU6ICAnVG9nZ2xlIEludmlzaWJsZXMnXG4gICAgICAgICAgICB0ZXh0OiAgJ3RvZ2dsZSBpbnZpc2libGVzIGZvciBjdXJyZW50IGZpbGUnXG4gICAgICAgICAgICBjb21ibzogJ2N0cmwraSdcblxuICAgIHRvZ2dsZUludmlzaWJsZXM6IC0+XG5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBAaW52aXNpYmxlc1xuICAgICAgICBcbiAgICAgICAgaWYgcHJlZnMuZ2V0IFwiaW52aXNpYmxlc+KWuCN7QGN1cnJlbnRGaWxlID8gQG5hbWV9XCIgZmFsc2VcbiAgICAgICAgICAgIEBpbnZpc2libGVzLmRlYWN0aXZhdGUoKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAaW52aXNpYmxlcy5hY3RpdmF0ZSgpXG5cbiAgICBpbml0SW52aXNpYmxlczogLT4gQGludmlzaWJsZXMgPz0gbmV3IEludmlzaWJsZXMgQFxuIl19
//# sourceURL=../../../coffee/editor/actions/invisibles.coffee