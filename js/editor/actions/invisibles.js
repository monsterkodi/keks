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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52aXNpYmxlcy5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQU9BLElBQUEsaUNBQUE7SUFBQTs7QUFBQSxNQUF1QixPQUFBLENBQVEsS0FBUixDQUF2QixFQUFFLGlCQUFGLEVBQVMsbUJBQVQsRUFBaUI7O0FBRVg7SUFFVyxvQkFBQyxNQUFEO1FBQUMsSUFBQyxDQUFBLFNBQUQ7Ozs7UUFBWSxJQUFDLENBQUEsTUFBTSxDQUFDLEVBQVIsQ0FBVyxNQUFYLEVBQW1CLElBQUMsQ0FBQSxNQUFwQjtJQUFiOzt5QkFFYixHQUFBLEdBQUssU0FBQTtlQUFHLElBQUMsQ0FBQSxNQUFNLENBQUMsY0FBUixDQUF1QixNQUF2QixFQUErQixJQUFDLENBQUEsTUFBaEM7SUFBSDs7eUJBRUwsTUFBQSxHQUFRLFNBQUMsSUFBRDtRQUVKLElBQUcsS0FBSyxDQUFDLEdBQU4sQ0FBVSxhQUFBLEdBQWMsSUFBeEIsQ0FBSDttQkFDSSxJQUFDLENBQUEsSUFBRCxDQUFBLEVBREo7U0FBQSxNQUFBO21CQUdJLElBQUMsQ0FBQSxLQUFELENBQUEsRUFISjs7SUFGSTs7eUJBYVIsY0FBQSxHQUFnQixTQUFDLEVBQUQ7QUFFWixZQUFBO1FBQUEsSUFBQSxHQUFPLElBQUMsQ0FBQSxNQUFNLENBQUMsSUFBUixDQUFhLEVBQWI7UUFDUCxJQUFBLEdBQU8sSUFBSSxDQUFDLFFBQUwsQ0FBYyxHQUFkLENBQUEsSUFBdUIsVUFBdkIsSUFBcUM7UUFDNUMsSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBYixDQUNJO1lBQUEsSUFBQSxFQUFPLEVBQVA7WUFDQSxJQUFBLEVBQU8sUUFEUDtZQUVBLEtBQUEsRUFBTyxJQUFJLENBQUMsTUFGWjtZQUdBLEdBQUEsRUFBTyxJQUFJLENBQUMsTUFIWjtZQUlBLE9BQUEsRUFBUyxDQUFDLENBSlY7WUFLQSxJQUFBLEVBQU8sWUFBQSxHQUFlLElBTHRCO1NBREo7UUFRQSxDQUFB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QUMsQ0FBQSxVQUFmO0FBQUEsbUJBQUE7O1FBRUEsSUFBRyxLQUFLLENBQUMsR0FBTixDQUFVLGFBQUEsR0FBYSw0Q0FBZ0IsSUFBQyxDQUFBLElBQWpCLENBQXZCLEVBQStDLEtBQS9DLENBQUg7bUJBQ0ksSUFBQyxDQUFBLFVBQVUsQ0FBQyxVQUFaLENBQUEsRUFESjtTQUFBLE1BQUE7bUJBR0ksSUFBQyxDQUFBLFVBQVUsQ0FBQyxRQUFaLENBQUEsRUFISjs7SUFKYyxDQVBsQjtJQWdCQSxjQUFBLEVBQWdCLFNBQUE7eUNBQUcsSUFBQyxDQUFBLGFBQUQsSUFBQyxDQUFBLGFBQWMsSUFBSSxVQUFKLENBQWUsSUFBZjtJQUFsQixDQWhCaEIiLCJzb3VyY2VzQ29udGVudCI6WyJcbiMgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAgIDAwMCAgICAgIDAwMDAwMDAwICAgMDAwMDAwMFxuIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgIDAwMFxuIyAwMDAgIDAwMCAwIDAwMCAgIDAwMCAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwICAgICAgMDAwMDAwMCAgIDAwMDAwMDBcbiMgMDAwICAwMDAgIDAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAgIDAwMFxuIyAwMDAgIDAwMCAgIDAwMCAgICAgIDAgICAgICAwMDAgIDAwMDAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAgIDAwMDAwMDBcblxueyBwcmVmcywga2Vycm9yLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbmNsYXNzIEludmlzaWJsZXNcblxuICAgIGNvbnN0cnVjdG9yOiAoQGVkaXRvcikgLT4gQGVkaXRvci5vbiAnZmlsZScsIEBvbkZpbGVcblxuICAgIGRlbDogLT4gQGVkaXRvci5yZW1vdmVMaXN0ZW5lciAnZmlsZScsIEBvbkZpbGVcblxuICAgIG9uRmlsZTogKGZpbGUpID0+XG5cbiAgICAgICAgaWYgcHJlZnMuZ2V0IFwiaW52aXNpYmxlc+KWuCN7ZmlsZX1cIlxuICAgICAgICAgICAgQHNob3coKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBAY2xlYXIoKVxuXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAgMDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgXG4gICAgXG4gICAgb25MaW5lSW5zZXJ0ZWQ6IChsaSkgPT5cblxuICAgICAgICBsaW5lID0gQGVkaXRvci5saW5lIGxpXG4gICAgICAgIGtpbmQgPSBsaW5lLmVuZHNXaXRoKCcgJykgYW5kICd0cmFpbGluZycgb3IgJ25ld2xpbmUnXG4gICAgICAgIEBlZGl0b3IubWV0YS5hZGRcbiAgICAgICAgICAgIGxpbmU6ICBsaVxuICAgICAgICAgICAgaHRtbDogICcmIzk2ODcnXG4gICAgICAgICAgICBzdGFydDogbGluZS5sZW5ndGhcbiAgICAgICAgICAgIGVuZDogICBsaW5lLmxlbmd0aFxuICAgICAgICAgICAgeU9mZnNldDogLTFcbiAgICAgICAgICAgIGNsc3M6ICAnaW52aXNpYmxlICcgKyBraW5kXG4gICAgICAgICAgICBcbiAgICAgICAgcyA9IEBlZGl0b3IudGFibGluZSBsaVxuICAgICAgICBwID0gMFxuICAgICAgICB3aGlsZSBwIDwgcy5sZW5ndGhcbiAgICAgICAgICAgIG4gPSAxXG4gICAgICAgICAgICBpZiBzW3BdID09ICdcXHQnXG4gICAgICAgICAgICAgICAgbiA9IDQtKHAlNClcbiAgICAgICAgICAgICAgICBzID0gcy5zcGxpY2UgcCwgMSwgXy5wYWRTdGFydCBcIlwiLCBuXG4gICAgICAgICAgICAgICAgQGVkaXRvci5tZXRhLmFkZFxuICAgICAgICAgICAgICAgICAgICBsaW5lOiAgbGlcbiAgICAgICAgICAgICAgICAgICAgaHRtbDogICcmIzk2NTYnXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0OiBwXG4gICAgICAgICAgICAgICAgICAgIGVuZDogICBwXG4gICAgICAgICAgICAgICAgICAgIHlPZmZzZXQ6IC0xXG4gICAgICAgICAgICAgICAgICAgIGNsc3M6ICAnaW52aXNpYmxlIGludmlzaWJsZS10YWInXG4gICAgICAgICAgICBwICs9IG5cbiAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwICAwMDAgIDAwMCAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgMCAwMDAgIDAwMCAgMDAwMCAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIG9uTGluZUNoYW5nZWQ6IChsaSkgPT5cblxuICAgICAgICBtZXRhcyA9IEBlZGl0b3IubWV0YS5tZXRhc0F0TGluZUluZGV4KGxpKS5maWx0ZXIgKG0pIC0+IG1bMl0uY2xzcy5zdGFydHNXaXRoICdpbnZpc2libGUnXG4gICAgICAgIHJldHVybiBrZXJyb3IgXCJubyBpbnZpc2libGUgbWV0YSBhdCBsaW5lICN7bGl9P1wiIGlmIG5vdCBtZXRhcy5sZW5ndGhcbiAgICAgICAgQGVkaXRvci5tZXRhLmRlbE1ldGEgbWV0YXNbMF1cbiAgICAgICAgQG9uTGluZUluc2VydGVkIGxpXG5cbiAgICAjICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGFjdGl2YXRlOiAtPlxuXG4gICAgICAgIHByZWZzLnNldCBcImludmlzaWJsZXPilrgje0BlZGl0b3IuY3VycmVudEZpbGUgPyBAZWRpdG9yLm5hbWV9XCIgdHJ1ZVxuICAgICAgICBAc2hvdygpXG4gICAgICAgIFxuICAgIGRlYWN0aXZhdGU6IC0+XG5cbiAgICAgICAgcHJlZnMuc2V0IFwiaW52aXNpYmxlc+KWuCN7QGVkaXRvci5jdXJyZW50RmlsZX1cIlxuICAgICAgICBAY2xlYXIoKVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIGNsZWFyOiAtPlxuXG4gICAgICAgIEBlZGl0b3IucmVtb3ZlTGlzdGVuZXIgJ2xpbmVDaGFuZ2VkJyAgQG9uTGluZUNoYW5nZWRcbiAgICAgICAgQGVkaXRvci5yZW1vdmVMaXN0ZW5lciAnbGluZUluc2VydGVkJyBAb25MaW5lSW5zZXJ0ZWRcbiAgICAgICAgQGVkaXRvci5tZXRhLmRlbENsYXNzICdpbnZpc2libGUnXG5cbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwIDAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICBcbiAgICAjICAgICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAgICAgIDAwICBcbiAgICBcbiAgICBzaG93OiAtPlxuXG4gICAgICAgIEBjbGVhcigpXG5cbiAgICAgICAgQGVkaXRvci5vbiAnbGluZUNoYW5nZWQnICBAb25MaW5lQ2hhbmdlZFxuICAgICAgICBAZWRpdG9yLm9uICdsaW5lSW5zZXJ0ZWQnIEBvbkxpbmVJbnNlcnRlZFxuXG4gICAgICAgIGZvciBsaSBpbiBbMC4uLkBlZGl0b3IubnVtTGluZXMoKV1cbiAgICAgICAgICAgIEBvbkxpbmVJbnNlcnRlZCBsaVxuXG5tb2R1bGUuZXhwb3J0cyA9XG5cbiAgICBhY3Rpb25zOlxuXG4gICAgICAgIHRvZ2dsZUludmlzaWJsZXM6XG4gICAgICAgICAgICBuYW1lOiAgJ1RvZ2dsZSBJbnZpc2libGVzJ1xuICAgICAgICAgICAgdGV4dDogICd0b2dnbGUgaW52aXNpYmxlcyBmb3IgY3VycmVudCBmaWxlJ1xuICAgICAgICAgICAgY29tYm86ICdjdHJsK2knXG5cbiAgICB0b2dnbGVJbnZpc2libGVzOiAtPlxuXG4gICAgICAgIHJldHVybiBpZiBub3QgQGludmlzaWJsZXNcbiAgICAgICAgXG4gICAgICAgIGlmIHByZWZzLmdldCBcImludmlzaWJsZXPilrgje0BjdXJyZW50RmlsZSA/IEBuYW1lfVwiIGZhbHNlXG4gICAgICAgICAgICBAaW52aXNpYmxlcy5kZWFjdGl2YXRlKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGludmlzaWJsZXMuYWN0aXZhdGUoKVxuXG4gICAgaW5pdEludmlzaWJsZXM6IC0+IEBpbnZpc2libGVzID89IG5ldyBJbnZpc2libGVzIEBcbiJdfQ==
//# sourceURL=../../../coffee/editor/actions/invisibles.coffee