// koffee 1.4.0

/*
 0000000  000   000  000   000  000000000   0000000   000   000
000        000 000   0000  000     000     000   000   000 000
0000000     00000    000 0 000     000     000000000    00000
     000     000     000  0000     000     000   000   000 000
0000000      000     000   000     000     000   000  000   000
 */
var Balancer, Syntax, _, elem, empty, fs, kerror, klog, klor, kstr, matchr, noon, ref, slash, valid,
    indexOf = [].indexOf;

ref = require('kxk'), kerror = ref.kerror, kstr = ref.kstr, valid = ref.valid, klog = ref.klog, elem = ref.elem, empty = ref.empty, fs = ref.fs, noon = ref.noon, slash = ref.slash, _ = ref._;

matchr = require('../tools/matchr');

Balancer = require('./balancer');

klor = require('klor');

Syntax = (function() {
    function Syntax(name, getLine, getLines) {
        this.name = name;
        this.getLine = getLine;
        this.getLines = getLines;
        this.diss = [];
        this.colors = {};
        this.balancer = new Balancer(this, this.getLine);
    }

    Syntax.prototype.newDiss = function(li) {
        var diss;
        diss = this.balancer.dissForLine(li);
        return diss;
    };

    Syntax.prototype.getDiss = function(li) {
        if (this.diss[li] == null) {
            this.diss[li] = this.newDiss(li);
        }
        return this.diss[li];
    };

    Syntax.prototype.setDiss = function(li, dss) {
        this.diss[li] = dss;
        return dss;
    };

    Syntax.prototype.fillDiss = function(bot) {
        var i, li, ref1, results;
        results = [];
        for (li = i = 0, ref1 = bot; 0 <= ref1 ? i <= ref1 : i >= ref1; li = 0 <= ref1 ? ++i : --i) {
            results.push(this.getDiss(li));
        }
        return results;
    };

    Syntax.prototype.setLines = function(lines) {
        return this.balancer.setLines(lines);
    };

    Syntax.prototype.changed = function(changeInfo) {
        var ch, change, di, i, len, li, ref1, ref2, results;
        if (valid(changeInfo.changes)) {
            this.balancer.blocks = null;
        }
        ref1 = changeInfo.changes;
        results = [];
        for (i = 0, len = ref1.length; i < len; i++) {
            change = ref1[i];
            ref2 = [change.doIndex, change.newIndex, change.change], di = ref2[0], li = ref2[1], ch = ref2[2];
            switch (ch) {
                case 'changed':
                    results.push(this.diss[di] = this.newDiss(di));
                    break;
                case 'deleted':
                    this.balancer.deleteLine(di);
                    results.push(this.diss.splice(di, 1));
                    break;
                case 'inserted':
                    this.balancer.insertLine(di);
                    results.push(this.diss.splice(di, 0, this.newDiss(di)));
                    break;
                default:
                    results.push(void 0);
            }
        }
        return results;
    };

    Syntax.prototype.setFileType = function(fileType) {
        this.name = fileType;
        return this.balancer.setFileType(fileType);
    };

    Syntax.prototype.clear = function() {
        this.diss = [];
        return this.balancer.clear();
    };

    Syntax.prototype.colorForClassnames = function(clss) {
        var color, computedStyle, div, opacity;
        if (this.colors[clss] == null) {
            div = elem({
                "class": clss
            });
            document.body.appendChild(div);
            computedStyle = window.getComputedStyle(div);
            color = computedStyle.color;
            opacity = computedStyle.opacity;
            if (opacity !== '1') {
                color = 'rgba(' + color.slice(4, color.length - 2) + ', ' + opacity + ')';
            }
            this.colors[clss] = color;
            div.remove();
        }
        return this.colors[clss];
    };

    Syntax.prototype.colorForStyle = function(styl) {
        var div;
        if (this.colors[styl] == null) {
            div = elem('div');
            div.style = styl;
            document.body.appendChild(div);
            this.colors[styl] = window.getComputedStyle(div).color;
            div.remove();
        }
        return this.colors[styl];
    };

    Syntax.prototype.schemeChanged = function() {
        return this.colors = {};
    };


    /*
     0000000  000000000   0000000   000000000  000   0000000
    000          000     000   000     000     000  000
    0000000      000     000000000     000     000  000
         000     000     000   000     000     000  000
    0000000      000     000   000     000     000   0000000
     */

    Syntax.matchrConfigs = {};

    Syntax.syntaxNames = [];

    Syntax.spanForTextAndSyntax = function(text, n) {
        var clrzd, d, di, diss, i, j, l, last, ref1, ref2, ref3, sp, spc, style, value;
        l = "";
        diss = this.dissForTextAndSyntax(text, n);
        if (diss != null ? diss.length : void 0) {
            last = 0;
            for (di = i = 0, ref1 = diss.length; 0 <= ref1 ? i < ref1 : i > ref1; di = 0 <= ref1 ? ++i : --i) {
                d = diss[di];
                style = (d.styl != null) && d.styl.length && (" style=\"" + d.styl + "\"") || '';
                spc = '';
                for (sp = j = ref2 = last, ref3 = d.start; ref2 <= ref3 ? j < ref3 : j > ref3; sp = ref2 <= ref3 ? ++j : --j) {
                    spc += '&nbsp;';
                }
                last = d.start + d.match.length;
                value = (d.value != null) && d.value.length && (" class=\"" + d.value + "\"") || '';
                clrzd = "<span" + style + value + ">" + spc + (kstr.encode(d.match)) + "</span>";
                l += clrzd;
            }
        }
        return l;
    };

    Syntax.rangesForTextAndSyntax = function(line, n) {
        return matchr.ranges(Syntax.matchrConfigs[n], line);
    };

    Syntax.dissForTextAndSyntax = function(text, n) {
        return klor.ranges(text, n);
    };

    Syntax.lineForDiss = function(dss) {
        var d, i, l, len;
        l = "";
        for (i = 0, len = dss.length; i < len; i++) {
            d = dss[i];
            l = _.padEnd(l, d.start);
            l += d.match;
        }
        return l;
    };

    Syntax.shebang = function(line) {
        var lastWord;
        if (line.startsWith("#!")) {
            lastWord = _.last(line.split(/[\s\/]/));
            switch (lastWord) {
                case 'python':
                    return 'py';
                case 'node':
                    return 'js';
                case 'bash':
                    return 'sh';
                default:
                    if (indexOf.call(this.syntaxNames, lastWord) >= 0) {
                        return lastWord;
                    }
            }
        }
        return 'txt';
    };

    Syntax.init = function() {
        return this.syntaxNames = this.syntaxNames.concat(klor.exts);
    };

    return Syntax;

})();

Syntax.init();

module.exports = Syntax;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3ludGF4LmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7O0FBQUEsSUFBQSwrRkFBQTtJQUFBOztBQVFBLE1BQWlFLE9BQUEsQ0FBUSxLQUFSLENBQWpFLEVBQUUsbUJBQUYsRUFBVSxlQUFWLEVBQWdCLGlCQUFoQixFQUF1QixlQUF2QixFQUE2QixlQUE3QixFQUFtQyxpQkFBbkMsRUFBMEMsV0FBMUMsRUFBOEMsZUFBOUMsRUFBb0QsaUJBQXBELEVBQTJEOztBQUUzRCxNQUFBLEdBQVcsT0FBQSxDQUFRLGlCQUFSOztBQUNYLFFBQUEsR0FBVyxPQUFBLENBQVEsWUFBUjs7QUFDWCxJQUFBLEdBQVcsT0FBQSxDQUFRLE1BQVI7O0FBRUw7SUFFQyxnQkFBQyxJQUFELEVBQVEsT0FBUixFQUFrQixRQUFsQjtRQUFDLElBQUMsQ0FBQSxPQUFEO1FBQU8sSUFBQyxDQUFBLFVBQUQ7UUFBVSxJQUFDLENBQUEsV0FBRDtRQUVqQixJQUFDLENBQUEsSUFBRCxHQUFZO1FBQ1osSUFBQyxDQUFBLE1BQUQsR0FBWTtRQUNaLElBQUMsQ0FBQSxRQUFELEdBQVksSUFBSSxRQUFKLENBQWEsSUFBYixFQUFnQixJQUFDLENBQUEsT0FBakI7SUFKYjs7cUJBWUgsT0FBQSxHQUFTLFNBQUMsRUFBRDtBQUVMLFlBQUE7UUFBQSxJQUFBLEdBQU8sSUFBQyxDQUFBLFFBQVEsQ0FBQyxXQUFWLENBQXNCLEVBQXRCO2VBQ1A7SUFISzs7cUJBS1QsT0FBQSxHQUFTLFNBQUMsRUFBRDtRQUVMLElBQU8scUJBQVA7WUFDSSxJQUFDLENBQUEsSUFBSyxDQUFBLEVBQUEsQ0FBTixHQUFZLElBQUMsQ0FBQSxPQUFELENBQVMsRUFBVCxFQURoQjs7ZUFHQSxJQUFDLENBQUEsSUFBSyxDQUFBLEVBQUE7SUFMRDs7cUJBT1QsT0FBQSxHQUFTLFNBQUMsRUFBRCxFQUFLLEdBQUw7UUFFTCxJQUFDLENBQUEsSUFBSyxDQUFB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QVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbiAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuMDAwICAgICAgICAwMDAgMDAwICAgMDAwMCAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgIDAwMCAwMDBcbjAwMDAwMDAgICAgIDAwMDAwICAgIDAwMCAwIDAwMCAgICAgMDAwICAgICAwMDAwMDAwMDAgICAgMDAwMDBcbiAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgMDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAwMDAgMDAwXG4wMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMjI1xuXG57IGtlcnJvciwga3N0ciwgdmFsaWQsIGtsb2csIGVsZW0sIGVtcHR5LCBmcywgbm9vbiwgc2xhc2gsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxubWF0Y2hyICAgPSByZXF1aXJlICcuLi90b29scy9tYXRjaHInXG5CYWxhbmNlciA9IHJlcXVpcmUgJy4vYmFsYW5jZXInXG5rbG9yICAgICA9IHJlcXVpcmUgJ2tsb3InXG5cbmNsYXNzIFN5bnRheFxuICAgIFxuICAgIEA6IChAbmFtZSwgQGdldExpbmUsIEBnZXRMaW5lcykgLT5cblxuICAgICAgICBAZGlzcyAgICAgPSBbXVxuICAgICAgICBAY29sb3JzICAgPSB7fVxuICAgICAgICBAYmFsYW5jZXIgPSBuZXcgQmFsYW5jZXIgQCwgQGdldExpbmVcblxuICAgICMgMDAwMDAwMCAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgICAgICAwMDBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAwMDAwICAgMDAwMDAwMFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMFxuICAgICMgMDAwMDAwMCAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwXG5cbiAgICBuZXdEaXNzOiAobGkpIC0+XG5cbiAgICAgICAgZGlzcyA9IEBiYWxhbmNlci5kaXNzRm9yTGluZSBsaVxuICAgICAgICBkaXNzXG5cbiAgICBnZXREaXNzOiAobGkpIC0+XG5cbiAgICAgICAgaWYgbm90IEBkaXNzW2xpXT9cbiAgICAgICAgICAgIEBkaXNzW2xpXSA9IEBuZXdEaXNzIGxpXG5cbiAgICAgICAgQGRpc3NbbGldXG5cbiAgICBzZXREaXNzOiAobGksIGRzcykgLT5cblxuICAgICAgICBAZGlzc1tsaV0gPSBkc3NcbiAgICAgICAgZHNzXG5cbiAgICBmaWxsRGlzczogKGJvdCkgLT5cblxuICAgICAgICBmb3IgbGkgaW4gWzAuLmJvdF1cbiAgICAgICAgICAgIEBnZXREaXNzIGxpXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgICAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAgICAwMDAgIDAwMCAwIDAwMCAgMDAwMDAwMCAgIDAwMDAwMDAgICBcbiAgICAjICAgICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgICAgICAgICAgMDAwICBcbiAgICAjIDAwMDAwMDAgICAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICBcbiAgICBcbiAgICBzZXRMaW5lczogKGxpbmVzKSAtPlxuICAgICAgICBcbiAgICAgICAgQGJhbGFuY2VyLnNldExpbmVzIGxpbmVzXG4gICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAwMDAwICAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwMDAwMFxuXG4gICAgY2hhbmdlZDogKGNoYW5nZUluZm8pIC0+XG5cbiAgICAgICAgaWYgdmFsaWQgY2hhbmdlSW5mby5jaGFuZ2VzXG4gICAgICAgICAgICBAYmFsYW5jZXIuYmxvY2tzID0gbnVsbFxuICAgICAgICBcbiAgICAgICAgZm9yIGNoYW5nZSBpbiBjaGFuZ2VJbmZvLmNoYW5nZXNcblxuICAgICAgICAgICAgW2RpLGxpLGNoXSA9IFtjaGFuZ2UuZG9JbmRleCwgY2hhbmdlLm5ld0luZGV4LCBjaGFuZ2UuY2hhbmdlXVxuXG4gICAgICAgICAgICBzd2l0Y2ggY2hcblxuICAgICAgICAgICAgICAgIHdoZW4gJ2NoYW5nZWQnXG5cbiAgICAgICAgICAgICAgICAgICAgQGRpc3NbZGldID0gQG5ld0Rpc3MgZGlcblxuICAgICAgICAgICAgICAgIHdoZW4gJ2RlbGV0ZWQnXG5cbiAgICAgICAgICAgICAgICAgICAgQGJhbGFuY2VyLmRlbGV0ZUxpbmUgZGlcbiAgICAgICAgICAgICAgICAgICAgQGRpc3Muc3BsaWNlIGRpLCAxXG5cbiAgICAgICAgICAgICAgICB3aGVuICdpbnNlcnRlZCdcblxuICAgICAgICAgICAgICAgICAgICBAYmFsYW5jZXIuaW5zZXJ0TGluZSBkaVxuICAgICAgICAgICAgICAgICAgICBAZGlzcy5zcGxpY2UgZGksIDAsIEBuZXdEaXNzIGRpXG5cbiAgICAjIDAwMDAwMDAwICAwMDAgIDAwMCAgICAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgICAgIDAwMCAgICAgIDAwMCAwMDAgICAwMDAgICAwMDAgIDAwMFxuICAgICMgMDAwMDAwICAgIDAwMCAgMDAwICAgICAgMDAwMDAwMCAgICAgIDAwMCAgICAgICAwMDAwMCAgICAwMDAwMDAwMCAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICAgICAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgIDAwMDAwMDAgIDAwMDAwMDAwICAgICAwMDAgICAgICAgIDAwMCAgICAgMDAwICAgICAgICAwMDAwMDAwMFxuXG4gICAgc2V0RmlsZVR5cGU6IChmaWxlVHlwZSkgLT5cblxuICAgICAgICAjIGtsb2cgJ1N5bnRheC5zZXRGaWxlVHlwZScsIGZpbGVUeXBlXG4gICAgICAgIFxuICAgICAgICBAbmFtZSA9IGZpbGVUeXBlXG4gICAgICAgIEBiYWxhbmNlci5zZXRGaWxlVHlwZSBmaWxlVHlwZVxuICAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMDAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcblxuICAgIGNsZWFyOiAtPlxuXG4gICAgICAgIEBkaXNzID0gW11cbiAgICAgICAgQGJhbGFuY2VyLmNsZWFyKClcblxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwMDAwMFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAwMDBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgMDAwXG5cbiAgICBjb2xvckZvckNsYXNzbmFtZXM6IChjbHNzKSAtPlxuXG4gICAgICAgIGlmIG5vdCBAY29sb3JzW2Nsc3NdP1xuXG4gICAgICAgICAgICBkaXYgPSBlbGVtIGNsYXNzOiBjbHNzXG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkIGRpdlxuICAgICAgICAgICAgY29tcHV0ZWRTdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlIGRpdlxuICAgICAgICAgICAgY29sb3IgPSBjb21wdXRlZFN0eWxlLmNvbG9yXG4gICAgICAgICAgICBvcGFjaXR5ID0gY29tcHV0ZWRTdHlsZS5vcGFjaXR5XG4gICAgICAgICAgICBpZiBvcGFjaXR5ICE9ICcxJ1xuICAgICAgICAgICAgICAgIGNvbG9yID0gJ3JnYmEoJyArIGNvbG9yLnNsaWNlKDQsIGNvbG9yLmxlbmd0aC0yKSArICcsICcgKyBvcGFjaXR5ICsgJyknXG4gICAgICAgICAgICBAY29sb3JzW2Nsc3NdID0gY29sb3JcbiAgICAgICAgICAgIGRpdi5yZW1vdmUoKVxuXG4gICAgICAgIHJldHVybiBAY29sb3JzW2Nsc3NdXG5cbiAgICBjb2xvckZvclN0eWxlOiAoc3R5bCkgLT5cblxuICAgICAgICBpZiBub3QgQGNvbG9yc1tzdHlsXT9cbiAgICAgICAgICAgIGRpdiA9IGVsZW0gJ2RpdidcbiAgICAgICAgICAgIGRpdi5zdHlsZSA9IHN0eWxcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQgZGl2XG4gICAgICAgICAgICBAY29sb3JzW3N0eWxdID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZGl2KS5jb2xvclxuICAgICAgICAgICAgZGl2LnJlbW92ZSgpXG5cbiAgICAgICAgcmV0dXJuIEBjb2xvcnNbc3R5bF1cblxuICAgIHNjaGVtZUNoYW5nZWQ6IC0+IEBjb2xvcnMgPSB7fVxuXG4gICAgIyMjXG4gICAgIDAwMDAwMDAgIDAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwMDAgIDAwMCAgIDAwMDAwMDBcbiAgICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDBcbiAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwICAwMDBcbiAgICAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAwMDBcbiAgICAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgMDAwMDAwMFxuICAgICMjI1xuXG4gICAgQG1hdGNockNvbmZpZ3MgPSB7fVxuICAgIEBzeW50YXhOYW1lcyA9IFtdXG5cbiAgICBAc3BhbkZvclRleHRBbmRTeW50YXg6ICh0ZXh0LCBuKSAtPlxuXG4gICAgICAgIGwgPSBcIlwiXG4gICAgICAgIGRpc3MgPSBAZGlzc0ZvclRleHRBbmRTeW50YXggdGV4dCwgblxuICAgICAgICBpZiBkaXNzPy5sZW5ndGhcbiAgICAgICAgICAgIGxhc3QgPSAwXG4gICAgICAgICAgICBmb3IgZGkgaW4gWzAuLi5kaXNzLmxlbmd0aF1cbiAgICAgICAgICAgICAgICBkID0gZGlzc1tkaV1cbiAgICAgICAgICAgICAgICBzdHlsZSA9IGQuc3R5bD8gYW5kIGQuc3R5bC5sZW5ndGggYW5kIFwiIHN0eWxlPVxcXCIje2Quc3R5bH1cXFwiXCIgb3IgJydcbiAgICAgICAgICAgICAgICBzcGMgPSAnJ1xuICAgICAgICAgICAgICAgIGZvciBzcCBpbiBbbGFzdC4uLmQuc3RhcnRdXG4gICAgICAgICAgICAgICAgICAgIHNwYyArPSAnJm5ic3A7J1xuICAgICAgICAgICAgICAgIGxhc3QgID0gZC5zdGFydCArIGQubWF0Y2gubGVuZ3RoXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBkLnZhbHVlPyBhbmQgZC52YWx1ZS5sZW5ndGggYW5kIFwiIGNsYXNzPVxcXCIje2QudmFsdWV9XFxcIlwiIG9yICcnXG4gICAgICAgICAgICAgICAgY2xyemQgPSBcIjxzcGFuI3tzdHlsZX0je3ZhbHVlfT4je3NwY30je2tzdHIuZW5jb2RlIGQubWF0Y2h9PC9zcGFuPlwiXG4gICAgICAgICAgICAgICAgbCArPSBjbHJ6ZFxuICAgICAgICBsXG5cbiAgICBAcmFuZ2VzRm9yVGV4dEFuZFN5bnRheDogKGxpbmUsIG4pIC0+XG5cbiAgICAgICAgbWF0Y2hyLnJhbmdlcyBTeW50YXgubWF0Y2hyQ29uZmlnc1tuXSwgbGluZVxuXG4gICAgQGRpc3NGb3JUZXh0QW5kU3ludGF4OiAodGV4dCwgbikgLT5cblxuICAgICAgICBrbG9yLnJhbmdlcyB0ZXh0LCBuXG5cbiAgICBAbGluZUZvckRpc3M6IChkc3MpIC0+XG5cbiAgICAgICAgbCA9IFwiXCJcbiAgICAgICAgZm9yIGQgaW4gZHNzXG4gICAgICAgICAgICBsID0gXy5wYWRFbmQgbCwgZC5zdGFydFxuICAgICAgICAgICAgbCArPSBkLm1hdGNoXG4gICAgICAgIGxcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMDAgIDAwMCAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMCAwIDAwMCAgMDAwICAwMDAwXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcblxuICAgIEBzaGViYW5nOiAobGluZSkgLT5cblxuICAgICAgICBpZiBsaW5lLnN0YXJ0c1dpdGggXCIjIVwiXG4gICAgICAgICAgICBsYXN0V29yZCA9IF8ubGFzdCBsaW5lLnNwbGl0IC9bXFxzXFwvXS9cbiAgICAgICAgICAgIHN3aXRjaCBsYXN0V29yZFxuICAgICAgICAgICAgICAgIHdoZW4gJ3B5dGhvbicgdGhlbiByZXR1cm4gJ3B5J1xuICAgICAgICAgICAgICAgIHdoZW4gJ25vZGUnICAgdGhlbiByZXR1cm4gJ2pzJ1xuICAgICAgICAgICAgICAgIHdoZW4gJ2Jhc2gnICAgdGhlbiByZXR1cm4gJ3NoJ1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgaWYgbGFzdFdvcmQgaW4gQHN5bnRheE5hbWVzXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbGFzdFdvcmRcbiAgICAgICAgJ3R4dCdcblxuICAgICMgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMDAwMDAwXG4gICAgIyAwMDAgIDAwMDAgIDAwMCAgMDAwICAgICAwMDBcbiAgICAjIDAwMCAgMDAwIDAgMDAwICAwMDAgICAgIDAwMFxuICAgICMgMDAwICAwMDAgIDAwMDAgIDAwMCAgICAgMDAwXG4gICAgIyAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAwMDBcblxuICAgIEBpbml0OiAtPlxuXG4gICAgICAgICMgc3ludGF4RGlyID0gXCIje19fZGlybmFtZX0vLi4vLi4vc3ludGF4L1wiXG5cbiAgICAgICAgIyBmb3Igc3ludGF4RmlsZSBpbiBmcy5yZWFkZGlyU3luYyBzeW50YXhEaXJcblxuICAgICAgICAgICAgIyBzeW50YXhOYW1lID0gc2xhc2guYmFzZW5hbWUgc3ludGF4RmlsZSwgJy5ub29uJ1xuICAgICAgICAgICAgIyBwYXR0ZXJucyA9IG5vb24ubG9hZCBzbGFzaC5qb2luIHN5bnRheERpciwgc3ludGF4RmlsZVxuXG4gICAgICAgICAgICAjIHBhdHRlcm5zWydcXFxcdysnXSAgICAgICA9ICd0ZXh0JyAgICMgdGhpcyBlbnN1cmVzIHRoYXQgYWxsIC4uLlxuICAgICAgICAgICAgIyBwYXR0ZXJuc1snW15cXFxcd1xcXFxzXSsnXSA9ICdzeW50YXgnICMgbm9uLXNwYWNlIGNoYXJhY3RlcnMgbWF0Y2hcblxuICAgICAgICAgICAgIyBpZiBwYXR0ZXJucy5rbz8uZXh0bmFtZXM/XG4gICAgICAgICAgICAgICAgIyBleHRuYW1lcyA9IHBhdHRlcm5zLmtvLmV4dG5hbWVzXG4gICAgICAgICAgICAgICAgIyBkZWxldGUgcGF0dGVybnMua29cblxuICAgICAgICAgICAgICAgICMgY29uZmlnID0gbWF0Y2hyLmNvbmZpZyBwYXR0ZXJuc1xuICAgICAgICAgICAgICAgICMgZm9yIHN5bnRheE5hbWUgaW4gZXh0bmFtZXNcbiAgICAgICAgICAgICAgICAgICAgIyBAc3ludGF4TmFtZXMucHVzaCBzeW50YXhOYW1lXG4gICAgICAgICAgICAgICAgICAgICMgQG1hdGNockNvbmZpZ3Nbc3ludGF4TmFtZV0gPSBjb25maWdcbiAgICAgICAgICAgICMgZWxzZVxuICAgICAgICAgICAgICAgICMgQHN5bnRheE5hbWVzLnB1c2ggc3ludGF4TmFtZVxuICAgICAgICAgICAgICAgICMgQG1hdGNockNvbmZpZ3Nbc3ludGF4TmFtZV0gPSBtYXRjaHIuY29uZmlnIHBhdHRlcm5zXG5cbiAgICAgICAgIyBrbG9yLmluaXQoKVxuICAgICAgICBAc3ludGF4TmFtZXMgPSBAc3ludGF4TmFtZXMuY29uY2F0IGtsb3IuZXh0c1xuXG5TeW50YXguaW5pdCgpXG5tb2R1bGUuZXhwb3J0cyA9IFN5bnRheFxuIl19
//# sourceURL=../../coffee/editor/syntax.coffee