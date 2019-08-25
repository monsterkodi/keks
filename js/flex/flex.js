// koffee 1.4.0

/*
00000000  000      00000000  000   000  
000       000      000        000 000   
000000    000      0000000     00000    
000       000      000        000 000   
000       0000000  00000000  000   000
 */
var Flex, Handle, Pane, _, clamp, def, drag, empty, getStyle, last, ref, valid;

ref = require('kxk'), getStyle = ref.getStyle, clamp = ref.clamp, valid = ref.valid, empty = ref.empty, last = ref.last, drag = ref.drag, def = ref.def, _ = ref._;

Pane = require('./pane');

Handle = require('./handle');

Flex = (function() {
    function Flex(opt) {
        var horz, j, len, p, ref1, ref2, ref3, ref4, ref5;
        this.handleSize = (ref1 = opt.handleSize) != null ? ref1 : 6;
        this.direction = (ref2 = opt.direction) != null ? ref2 : 'horizontal';
        this.snapFirst = opt.snapFirst;
        this.snapLast = opt.snapLast;
        this.onPaneSize = opt.onPaneSize;
        this.onDragStart = opt.onDragStart;
        this.onDrag = opt.onDrag;
        this.onDragEnd = opt.onDragEnd;
        horz = this.direction === 'horizontal';
        this.dimension = horz && 'width' || 'height';
        this.clientDim = horz && 'clientWidth' || 'clientHeight';
        this.axis = horz && 'x' || 'y';
        this.position = horz && 'left' || 'top';
        this.handleClass = horz && 'split-handle split-handle-horizontal' || 'split-handle split-handle-vertical';
        this.paddingA = horz && 'paddingLeft' || 'paddingTop';
        this.paddingB = horz && 'paddingRight' || 'paddingBottom';
        this.cursor = (ref3 = opt.cursor) != null ? ref3 : horz && 'ew-resize' || 'ns-resize';
        this.panes = [];
        this.handles = [];
        this.view = (ref4 = opt.view) != null ? ref4 : opt.panes[0].div.parentNode;
        this.view.style.display = 'flex';
        this.view.style.flexDirection = horz && 'row' || 'column';
        if (valid(opt.panes)) {
            ref5 = opt.panes;
            for (j = 0, len = ref5.length; j < len; j++) {
                p = ref5[j];
                this.addPane(p);
            }
        }
    }

    Flex.prototype.addPane = function(p) {
        var lastPane, newPane;
        newPane = new Pane(_.defaults(p, {
            flex: this,
            index: this.panes.length
        }));
        if (lastPane = _.last(this.panes)) {
            this.handles.push(new Handle({
                flex: this,
                index: lastPane.index,
                panea: lastPane,
                paneb: newPane
            }));
        }
        this.panes.push(newPane);
        return this.relax();
    };

    Flex.prototype.popPane = function(opt) {
        if (opt == null) {
            opt = {};
        }
        if ((opt != null ? opt.relax : void 0) === false) {
            this.unrelax();
        }
        if (this.panes.length > 1) {
            this.panes.pop().del();
            this.handles.pop().del();
        }
        if ((opt != null ? opt.relax : void 0) !== false) {
            return this.relax();
        } else {
            return last(this.panes).setSize(last(this.panes).actualSize());
        }
    };

    Flex.prototype.shiftPane = function() {
        var i, j, k, ref1, ref2;
        if (this.panes.length > 1) {
            this.panes.shift().del();
            this.handles.shift().del();
        }
        for (i = j = 0, ref1 = this.panes.length; 0 <= ref1 ? j < ref1 : j > ref1; i = 0 <= ref1 ? ++j : --j) {
            this.panes[i].index = i;
        }
        for (i = k = 0, ref2 = this.handles.length; 0 <= ref2 ? k < ref2 : k > ref2; i = 0 <= ref2 ? ++k : --k) {
            this.handles[i].index = i;
        }
        return this.relax();
    };

    Flex.prototype.relax = function() {
        var j, len, p, ref1, results;
        this.relaxed = true;
        ref1 = this.visiblePanes();
        results = [];
        for (j = 0, len = ref1.length; j < len; j++) {
            p = ref1[j];
            p.div.style.flex = "1 1 0";
            results.push(p.size = 0);
        }
        return results;
    };

    Flex.prototype.unrelax = function() {
        var j, len, p, ref1, results;
        this.relaxed = false;
        ref1 = this.visiblePanes();
        results = [];
        for (j = 0, len = ref1.length; j < len; j++) {
            p = ref1[j];
            results.push(p.size = p.actualSize());
        }
        return results;
    };

    Flex.prototype.calculate = function() {
        var avail, diff, flexPanes, h, j, k, l, len, len1, len2, len3, m, p, ref1, visPanes;
        visPanes = this.panes.filter(function(p) {
            return !p.collapsed;
        });
        flexPanes = visPanes.filter(function(p) {
            return !p.fixed;
        });
        avail = this.size();
        ref1 = this.handles;
        for (j = 0, len = ref1.length; j < len; j++) {
            h = ref1[j];
            h.update();
            if (h.isVisible()) {
                avail -= h.size();
            }
        }
        for (k = 0, len1 = visPanes.length; k < len1; k++) {
            p = visPanes[k];
            avail -= p.size;
        }
        diff = avail / flexPanes.length;
        for (l = 0, len2 = flexPanes.length; l < len2; l++) {
            p = flexPanes[l];
            p.size += diff;
        }
        for (m = 0, len3 = visPanes.length; m < len3; m++) {
            p = visPanes[m];
            p.setSize(p.size);
        }
        return typeof this.onPaneSize === "function" ? this.onPaneSize() : void 0;
    };

    Flex.prototype.moveHandle = function(opt) {
        var handle;
        handle = this.handles[opt.index];
        return this.moveHandleToPos(handle, opt.pos);
    };

    Flex.prototype.moveHandleToPos = function(handle, pos) {
        var deduct, leftOver, next, nextHandle, nextSize, nextVisFlex, offset, prev, prevHandle, prevSize, prevVisFlex, ref1, ref2, ref3, ref4;
        pos = parseInt(pos);
        if (this.relaxed) {
            this.unrelax();
        }
        offset = pos - handle.actualPos();
        if (Math.abs(offset) < 1) {
            return;
        }
        prev = (ref1 = (ref2 = this.prevAllInv(handle)) != null ? ref2 : this.prevVisFlex(handle)) != null ? ref1 : this.prevFlex(handle);
        next = (ref3 = (ref4 = this.nextAllInv(handle)) != null ? ref4 : this.nextVisFlex(handle)) != null ? ref3 : this.nextFlex(handle);
        delete prev.collapsed;
        delete next.collapsed;
        prevSize = prev.size + offset;
        nextSize = next.size - offset;
        if ((this.snapFirst != null) && prevSize < this.snapFirst && !this.prevVisPane(prev)) {
            if (prevSize <= 0 || offset < this.snapFirst) {
                prevSize = -1;
                nextSize = next.size + prev.size + this.handleSize;
            }
        } else if (prevSize < 0) {
            leftOver = -prevSize;
            prevHandle = handle.prev();
            while (leftOver > 0 && prevHandle && (prevVisFlex = this.prevVisFlex(prevHandle))) {
                deduct = Math.min(leftOver, prevVisFlex.size);
                leftOver -= deduct;
                prevVisFlex.setSize(prevVisFlex.size - deduct);
                prevHandle = prevHandle.prev();
            }
            prevSize = 0;
            nextSize -= leftOver;
        }
        if ((this.snapLast != null) && nextSize < this.snapLast && !this.nextVisPane(next)) {
            if (nextSize <= 0 || -offset < this.snapLast) {
                nextSize = -1;
                prevSize = prev.size + next.size + this.handleSize;
            }
        } else if (nextSize < 0) {
            leftOver = -nextSize;
            nextHandle = handle.next();
            while (leftOver > 0 && nextHandle && (nextVisFlex = this.nextVisFlex(nextHandle))) {
                deduct = Math.min(leftOver, nextVisFlex.size);
                leftOver -= deduct;
                nextVisFlex.setSize(nextVisFlex.size - deduct);
                nextHandle = nextHandle.next();
            }
            nextSize = 0;
            prevSize -= leftOver;
        }
        prev.setSize(prevSize);
        next.setSize(nextSize);
        this.update();
        return typeof this.onPaneSize === "function" ? this.onPaneSize() : void 0;
    };

    Flex.prototype.restoreState = function(state) {
        var j, pane, ref1, s, si;
        if (!(state != null ? state.length : void 0)) {
            return;
        }
        for (si = j = 0, ref1 = state.length; 0 <= ref1 ? j < ref1 : j > ref1; si = 0 <= ref1 ? ++j : --j) {
            s = state[si];
            pane = this.pane(si);
            delete pane.collapsed;
            if (s.size < 0) {
                pane.collapse();
            }
            if (s.size >= 0) {
                pane.setSize(s.size);
            }
        }
        this.updateHandles();
        return typeof this.onPaneSize === "function" ? this.onPaneSize() : void 0;
    };

    Flex.prototype.getState = function() {
        var j, len, p, ref1, state;
        state = [];
        ref1 = this.panes;
        for (j = 0, len = ref1.length; j < len; j++) {
            p = ref1[j];
            state.push({
                id: p.id,
                size: p.size,
                pos: p.pos()
            });
        }
        return state;
    };

    Flex.prototype.resized = function() {
        return this.update().calculate();
    };

    Flex.prototype.update = function() {
        this.updatePanes();
        return this.updateHandles();
    };

    Flex.prototype.updatePanes = function() {
        var j, len, p, ref1, results;
        ref1 = this.panes;
        results = [];
        for (j = 0, len = ref1.length; j < len; j++) {
            p = ref1[j];
            results.push(p.update());
        }
        return results;
    };

    Flex.prototype.updateHandles = function() {
        var h, j, len, ref1, results;
        ref1 = this.handles;
        results = [];
        for (j = 0, len = ref1.length; j < len; j++) {
            h = ref1[j];
            results.push(h.update());
        }
        return results;
    };

    Flex.prototype.handleStart = function(handle) {
        return typeof this.onDragStart === "function" ? this.onDragStart() : void 0;
    };

    Flex.prototype.handleDrag = function(handle, drag) {
        this.moveHandleToPos(handle, drag.pos[this.axis] - this.pos() - 4);
        return typeof this.onDrag === "function" ? this.onDrag() : void 0;
    };

    Flex.prototype.handleEnd = function() {
        this.update();
        return typeof this.onDragEnd === "function" ? this.onDragEnd() : void 0;
    };

    Flex.prototype.numPanes = function() {
        return this.panes.length;
    };

    Flex.prototype.visiblePanes = function() {
        return this.panes.filter(function(p) {
            return p.isVisible();
        });
    };

    Flex.prototype.panePositions = function() {
        var j, len, p, ref1, results;
        ref1 = this.panes;
        results = [];
        for (j = 0, len = ref1.length; j < len; j++) {
            p = ref1[j];
            results.push(p.pos());
        }
        return results;
    };

    Flex.prototype.paneSizes = function() {
        var j, len, p, ref1, results;
        ref1 = this.panes;
        results = [];
        for (j = 0, len = ref1.length; j < len; j++) {
            p = ref1[j];
            results.push(p.size);
        }
        return results;
    };

    Flex.prototype.sizeOfPane = function(i) {
        return this.pane(i).size;
    };

    Flex.prototype.posOfPane = function(i) {
        return this.pane(i).pos();
    };

    Flex.prototype.posOfHandle = function(i) {
        return this.handle(i).pos();
    };

    Flex.prototype.pane = function(i) {
        return _.isNumber(i) && this.panes[i] || _.isString(i) && _.find(this.panes, function(p) {
            return p.id === i;
        }) || i;
    };

    Flex.prototype.handle = function(i) {
        return _.isNumber(i) && this.handles[i] || i;
    };

    Flex.prototype.height = function() {
        return this.view.getBoundingClientRect().height;
    };

    Flex.prototype.size = function() {
        return this.view.getBoundingClientRect()[this.dimension];
    };

    Flex.prototype.pos = function() {
        return this.view.getBoundingClientRect()[this.position];
    };

    Flex.prototype.isCollapsed = function(i) {
        return this.pane(i).collapsed;
    };

    Flex.prototype.collapse = function(i) {
        var pane;
        if (pane = this.pane(i)) {
            if (!pane.collapsed) {
                pane.collapse();
                return this.calculate();
            }
        }
    };

    Flex.prototype.expand = function(i, factor) {
        var flex, pane, ref1, use;
        if (factor == null) {
            factor = 0.5;
        }
        if (pane = this.pane(i)) {
            if (pane.collapsed) {
                pane.expand();
                if (flex = this.closestVisFlex(pane)) {
                    use = (ref1 = pane.fixed) != null ? ref1 : flex.size * factor;
                    flex.size -= use;
                    pane.size = use;
                }
                return this.calculate();
            }
        }
    };

    Flex.prototype.nextVisPane = function(p) {
        var next, pi;
        pi = this.panes.indexOf(p);
        if (pi >= this.panes.length - 1) {
            return null;
        }
        next = this.panes[pi + 1];
        if (next.isVisible()) {
            return next;
        }
        return this.nextVisPane(next);
    };

    Flex.prototype.prevVisPane = function(p) {
        var pi, prev;
        pi = this.panes.indexOf(p);
        if (pi <= 0) {
            return null;
        }
        prev = this.panes[pi - 1];
        if (prev.isVisible()) {
            return prev;
        }
        return this.prevVisPane(prev);
    };

    Flex.prototype.closestVisFlex = function(p) {
        var d, isVisFlexPane, pi;
        d = 1;
        pi = this.panes.indexOf(p);
        isVisFlexPane = (function(_this) {
            return function(i) {
                if (i >= 0 && i < _this.panes.length) {
                    if (!_this.panes[i].collapsed && !_this.panes[i].fixed) {
                        return true;
                    }
                }
            };
        })(this);
        while (d < this.panes.length - 1) {
            if (isVisFlexPane(pi + d)) {
                return this.panes[pi + d];
            } else if (isVisFlexPane(pi - d)) {
                return this.panes[pi - d];
            }
            d++;
        }
    };

    Flex.prototype.travPrev = function(h, f) {
        return f(h) && h.panea || h.index > 0 && this.travPrev(this.handles[h.index - 1], f) || null;
    };

    Flex.prototype.travNext = function(h, f) {
        return f(h) && h.paneb || h.index < this.handles.length - 1 && this.travNext(this.handles[h.index + 1], f) || null;
    };

    Flex.prototype.prevVisFlex = function(h) {
        return this.travPrev(h, function(v) {
            return !v.panea.collapsed && !v.panea.fixed;
        });
    };

    Flex.prototype.nextVisFlex = function(h) {
        return this.travNext(h, function(v) {
            return !v.paneb.collapsed && !v.paneb.fixed;
        });
    };

    Flex.prototype.prevFlex = function(h) {
        return this.travPrev(h, function(v) {
            return !v.panea.fixed;
        });
    };

    Flex.prototype.nextFlex = function(h) {
        return this.travNext(h, function(v) {
            return !v.paneb.fixed;
        });
    };

    Flex.prototype.prevVis = function(h) {
        return this.travPrev(h, function(v) {
            return !v.panea.collapsed;
        });
    };

    Flex.prototype.nextVis = function(h) {
        return this.travNext(h, function(v) {
            return !v.paneb.collapsed;
        });
    };

    Flex.prototype.prevAllInv = function(h) {
        var p;
        p = !this.prevVis(h) && h.panea || null;
        if (p != null) {
            p.expand();
        }
        return p;
    };

    Flex.prototype.nextAllInv = function(h) {
        var p;
        p = !this.nextVis(h) && h.paneb || null;
        if (p != null) {
            p.expand();
        }
        return p;
    };

    return Flex;

})();

module.exports = Flex;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmxleC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBd0QsT0FBQSxDQUFRLEtBQVIsQ0FBeEQsRUFBRSx1QkFBRixFQUFZLGlCQUFaLEVBQW1CLGlCQUFuQixFQUEwQixpQkFBMUIsRUFBaUMsZUFBakMsRUFBdUMsZUFBdkMsRUFBNkMsYUFBN0MsRUFBa0Q7O0FBRWxELElBQUEsR0FBUyxPQUFBLENBQVEsUUFBUjs7QUFDVCxNQUFBLEdBQVMsT0FBQSxDQUFRLFVBQVI7O0FBRUg7SUFFVyxjQUFDLEdBQUQ7QUFFVCxZQUFBO1FBQUEsSUFBQyxDQUFBLFVBQUQsNENBQWdDO1FBQ2hDLElBQUMsQ0FBQSxTQUFELDJDQUErQjtRQUMvQixJQUFDLENBQUEsU0FBRCxHQUFlLEdBQUcsQ0FBQztRQUNuQixJQUFDLENBQUEsUUFBRCxHQUFlLEdBQUcsQ0FBQztRQUNuQixJQUFDLENBQUEsVUFBRCxHQUFlLEdBQUcsQ0FBQztRQUNuQixJQUFDLENBQUEsV0FBRCxHQUFlLEdBQUcsQ0FBQztRQUNuQixJQUFDLENBQUEsTUFBRCxHQUFlLEdBQUcsQ0FBQztRQUNuQixJQUFDLENBQUEsU0FBRCxHQUFlLEdBQUcsQ0FBQztRQUVuQixJQUFBLEdBQWUsSUFBQyxDQUFBLFNBQUQsS0FBYztRQUM3QixJQUFDLENBQUEsU0FBRCxHQUFlLElBQUEsSUFBUyxPQUFULElBQW9CO1FBQ25DLElBQUMsQ0FBQSxTQUFELEdBQWUsSUFBQSxJQUFTLGFBQVQsSUFBMEI7UUFDekMsSUFBQyxDQUFBLElBQUQsR0FBZSxJQUFBLElBQVMsR0FBVCxJQUFnQjtRQUMvQixJQUFDLENBQUEsUUFBRCxHQUFlLElBQUEsSUFBUyxNQUFULElBQW1CO1FBQ2xDLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBQSxJQUFTLHNDQUFULElBQW1EO1FBQ2xFLElBQUMsQ0FBQSxRQUFELEdBQWUsSUFBQSxJ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QUFDLENBQUQ7ZUFBTyxJQUFDLENBQUEsUUFBRCxDQUFVLENBQVYsRUFBYSxTQUFDLENBQUQ7bUJBQU8sQ0FBSSxDQUFDLENBQUMsS0FBSyxDQUFDO1FBQW5CLENBQWI7SUFBUDs7bUJBQ2IsT0FBQSxHQUFhLFNBQUMsQ0FBRDtlQUFPLElBQUMsQ0FBQSxRQUFELENBQVUsQ0FBVixFQUFhLFNBQUMsQ0FBRDttQkFBTyxDQUFJLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFBbkIsQ0FBYjtJQUFQOzttQkFDYixVQUFBLEdBQWEsU0FBQyxDQUFEO0FBQU8sWUFBQTtRQUFBLENBQUEsR0FBSSxDQUFJLElBQUMsQ0FBQSxPQUFELENBQVMsQ0FBVCxDQUFKLElBQW9CLENBQUMsQ0FBQyxLQUF0QixJQUErQjs7WUFBTSxDQUFDLENBQUUsTUFBSCxDQUFBOztlQUFhO0lBQTdEOzttQkFDYixVQUFBLEdBQWEsU0FBQyxDQUFEO0FBQU8sWUFBQTtRQUFBLENBQUEsR0FBSSxDQUFJLElBQUMsQ0FBQSxPQUFELENBQVMsQ0FBVCxDQUFKLElBQW9CLENBQUMsQ0FBQyxLQUF0QixJQUErQjs7WUFBTSxDQUFDLENBQUUsTUFBSCxDQUFBOztlQUFhO0lBQTdEOzs7Ozs7QUFFakIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbjAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgIDAwMCAwMDAgICBcbjAwMDAwMCAgICAwMDAgICAgICAwMDAwMDAwICAgICAwMDAwMCAgICBcbjAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgIDAwMCAwMDAgICBcbjAwMCAgICAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiMjI1xuXG57IGdldFN0eWxlLCBjbGFtcCwgdmFsaWQsIGVtcHR5LCBsYXN0LCBkcmFnLCBkZWYsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuUGFuZSAgID0gcmVxdWlyZSAnLi9wYW5lJ1xuSGFuZGxlID0gcmVxdWlyZSAnLi9oYW5kbGUnXG5cbmNsYXNzIEZsZXggXG4gICAgXG4gICAgY29uc3RydWN0b3I6IChvcHQpIC0+XG4gICAgICAgIFxuICAgICAgICBAaGFuZGxlU2l6ZSAgPSBvcHQuaGFuZGxlU2l6ZSA/IDZcbiAgICAgICAgQGRpcmVjdGlvbiAgID0gb3B0LmRpcmVjdGlvbiA/ICdob3Jpem9udGFsJ1xuICAgICAgICBAc25hcEZpcnN0ICAgPSBvcHQuc25hcEZpcnN0XG4gICAgICAgIEBzbmFwTGFzdCAgICA9IG9wdC5zbmFwTGFzdFxuICAgICAgICBAb25QYW5lU2l6ZSAgPSBvcHQub25QYW5lU2l6ZVxuICAgICAgICBAb25EcmFnU3RhcnQgPSBvcHQub25EcmFnU3RhcnRcbiAgICAgICAgQG9uRHJhZyAgICAgID0gb3B0Lm9uRHJhZ1xuICAgICAgICBAb25EcmFnRW5kICAgPSBvcHQub25EcmFnRW5kXG4gICAgXG4gICAgICAgIGhvcnogICAgICAgICA9IEBkaXJlY3Rpb24gPT0gJ2hvcml6b250YWwnXG4gICAgICAgIEBkaW1lbnNpb24gICA9IGhvcnogYW5kICd3aWR0aCcgb3IgJ2hlaWdodCdcbiAgICAgICAgQGNsaWVudERpbSAgID0gaG9yeiBhbmQgJ2NsaWVudFdpZHRoJyBvciAnY2xpZW50SGVpZ2h0J1xuICAgICAgICBAYXhpcyAgICAgICAgPSBob3J6IGFuZCAneCcgb3IgJ3knXG4gICAgICAgIEBwb3NpdGlvbiAgICA9IGhvcnogYW5kICdsZWZ0JyBvciAndG9wJ1xuICAgICAgICBAaGFuZGxlQ2xhc3MgPSBob3J6IGFuZCAnc3BsaXQtaGFuZGxlIHNwbGl0LWhhbmRsZS1ob3Jpem9udGFsJyBvciAnc3BsaXQtaGFuZGxlIHNwbGl0LWhhbmRsZS12ZXJ0aWNhbCdcbiAgICAgICAgQHBhZGRpbmdBICAgID0gaG9yeiBhbmQgJ3BhZGRpbmdMZWZ0JyBvciAncGFkZGluZ1RvcCdcbiAgICAgICAgQHBhZGRpbmdCICAgID0gaG9yeiBhbmQgJ3BhZGRpbmdSaWdodCcgb3IgJ3BhZGRpbmdCb3R0b20nXG4gICAgICAgIEBjdXJzb3IgICAgICA9IG9wdC5jdXJzb3IgPyBob3J6IGFuZCAnZXctcmVzaXplJyBvciAnbnMtcmVzaXplJ1xuICAgICAgICBcbiAgICAgICAgQHBhbmVzICAgPSBbXVxuICAgICAgICBAaGFuZGxlcyA9IFtdXG5cbiAgICAgICAgQHZpZXcgPSBvcHQudmlldyA/IG9wdC5wYW5lc1swXS5kaXYucGFyZW50Tm9kZVxuICAgICAgICBAdmlldy5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnXG4gICAgICAgIEB2aWV3LnN0eWxlLmZsZXhEaXJlY3Rpb24gPSBob3J6IGFuZCAncm93JyBvciAnY29sdW1uJ1xuICAgICAgICBcbiAgICAgICAgaWYgdmFsaWQgb3B0LnBhbmVzXG4gICAgICAgICAgICBAYWRkUGFuZSBwIGZvciBwIGluIG9wdC5wYW5lc1xuICAgICAgICAgICAgICAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgICAwMDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAgICAgXG4gICAgXG4gICAgYWRkUGFuZTogKHApIC0+XG5cbiAgICAgICAgbmV3UGFuZSA9IG5ldyBQYW5lIF8uZGVmYXVsdHMgcCwgXG4gICAgICAgICAgICBmbGV4OiAgIEAgXG4gICAgICAgICAgICBpbmRleDogIEBwYW5lcy5sZW5ndGhcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBsYXN0UGFuZSA9IF8ubGFzdCBAcGFuZXNcbiAgICAgICAgICAgIEBoYW5kbGVzLnB1c2ggbmV3IEhhbmRsZVxuICAgICAgICAgICAgICAgIGZsZXg6ICBAXG4gICAgICAgICAgICAgICAgaW5kZXg6IGxhc3RQYW5lLmluZGV4XG4gICAgICAgICAgICAgICAgcGFuZWE6IGxhc3RQYW5lXG4gICAgICAgICAgICAgICAgcGFuZWI6IG5ld1BhbmVcbiAgICAgICAgICAgIFxuICAgICAgICBAcGFuZXMucHVzaCBuZXdQYW5lXG4gICAgICAgIEByZWxheCgpXG5cbiAgICAjIDAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgICBcbiAgICAjIDAwMCAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgIFxuICAgICMgMDAwICAgICAgICAgMDAwMDAwMCAgIDAwMCAgICAgICAgXG4gICAgXG4gICAgcG9wUGFuZTogKG9wdD17fSkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIG9wdD8ucmVsYXggPT0gZmFsc2VcbiAgICAgICAgICAgIEB1bnJlbGF4KClcbiAgICAgICAgXG4gICAgICAgIGlmIEBwYW5lcy5sZW5ndGggPiAxXG4gICAgICAgICAgICBAcGFuZXMucG9wKCkuZGVsKClcbiAgICAgICAgICAgIEBoYW5kbGVzLnBvcCgpLmRlbCgpXG4gICAgICAgICAgICBcbiAgICAgICAgaWYgb3B0Py5yZWxheCAhPSBmYWxzZVxuICAgICAgICAgICAgQHJlbGF4KCkgICAgXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGxhc3QoQHBhbmVzKS5zZXRTaXplIGxhc3QoQHBhbmVzKS5hY3R1YWxTaXplKClcblxuICAgIHNoaWZ0UGFuZTogLT5cbiAgICAgICAgXG4gICAgICAgIGlmIEBwYW5lcy5sZW5ndGggPiAxXG4gICAgICAgICAgICBAcGFuZXMuc2hpZnQoKS5kZWwoKVxuICAgICAgICAgICAgQGhhbmRsZXMuc2hpZnQoKS5kZWwoKVxuICAgICAgICAgICAgXG4gICAgICAgIGZvciBpIGluIFswLi4uQHBhbmVzLmxlbmd0aF1cbiAgICAgICAgICAgIEBwYW5lc1tpXS5pbmRleCA9IGlcblxuICAgICAgICBmb3IgaSBpbiBbMC4uLkBoYW5kbGVzLmxlbmd0aF1cbiAgICAgICAgICAgIEBoYW5kbGVzW2ldLmluZGV4ID0gaVxuICAgICAgICAgICAgXG4gICAgICAgIEByZWxheCgpICBcbiAgICAgICAgICAgIFxuICAgICMgMDAwMDAwMDAgICAwMDAwMDAwMCAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAgMDAwIDAwMCAgIFxuICAgICMgMDAwMDAwMCAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwMDAwMDAwICAgIDAwMDAwICAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgMDAwICAgMDAwIDAwMCAgIFxuICAgICMgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIHJlbGF4OiAtPlxuICAgICAgICBcbiAgICAgICAgQHJlbGF4ZWQgPSB0cnVlXG4gICAgICAgIGZvciBwIGluIEB2aXNpYmxlUGFuZXMoKVxuICAgICAgICAgICAgcC5kaXYuc3R5bGUuZmxleCA9IFwiMSAxIDBcIlxuICAgICAgICAgICAgcC5zaXplID0gMFxuXG4gICAgdW5yZWxheDogLT5cbiAgICAgICAgXG4gICAgICAgIEByZWxheGVkID0gZmFsc2VcbiAgICAgICAgZm9yIHAgaW4gQHZpc2libGVQYW5lcygpXG4gICAgICAgICAgICBwLnNpemUgPSBwLmFjdHVhbFNpemUoKVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAgMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwMDAwMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwMCAgXG4gICAgXG4gICAgY2FsY3VsYXRlOiAtPlxuXG4gICAgICAgIHZpc1BhbmVzICA9IEBwYW5lcy5maWx0ZXIgKHApIC0+IG5vdCBwLmNvbGxhcHNlZFxuICAgICAgICBmbGV4UGFuZXMgPSB2aXNQYW5lcy5maWx0ZXIgKHApIC0+IG5vdCBwLmZpeGVkXG4gICAgICAgIGF2YWlsICAgICA9IEBzaXplKClcbiAgICAgICAgXG4gICAgICAgIGZvciBoIGluIEBoYW5kbGVzXG4gICAgICAgICAgICBoLnVwZGF0ZSgpIFxuICAgICAgICAgICAgYXZhaWwgLT0gaC5zaXplKCkgaWYgaC5pc1Zpc2libGUoKVxuICAgICAgICAgICAgXG4gICAgICAgIGZvciBwIGluIHZpc1BhbmVzXG4gICAgICAgICAgICBhdmFpbCAtPSBwLnNpemVcbiAgICAgICAgICAgIFxuICAgICAgICBkaWZmID0gYXZhaWwgLyBmbGV4UGFuZXMubGVuZ3RoXG4gICAgICAgIFxuICAgICAgICBmb3IgcCBpbiBmbGV4UGFuZXNcbiAgICAgICAgICAgIHAuc2l6ZSArPSBkaWZmXG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIHAgaW4gdmlzUGFuZXNcbiAgICAgICAgICAgIHAuc2V0U2l6ZSBwLnNpemVcblxuICAgICAgICBAb25QYW5lU2l6ZT8oKVxuICAgIFxuICAgICMgMDAgICAgIDAwICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAgMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgMDAwICAgMDAwMDAwMCAgICAgICAwICAgICAgMDAwMDAwMDAgIFxuXG4gICAgbW92ZUhhbmRsZTogKG9wdCkgLT4gXG4gICAgICAgIFxuICAgICAgICBoYW5kbGUgPSBAaGFuZGxlc1tvcHQuaW5kZXhdXG4gICAgICAgIEBtb3ZlSGFuZGxlVG9Qb3MgaGFuZGxlLCBvcHQucG9zICAgICAgICBcbiAgICBcbiAgICBtb3ZlSGFuZGxlVG9Qb3M6IChoYW5kbGUsIHBvcykgLT5cbiAgICAgICAgXG4gICAgICAgIHBvcyA9IHBhcnNlSW50IHBvc1xuICAgICAgICBpZiBAcmVsYXhlZCB0aGVuIEB1bnJlbGF4KClcbiAgICAgICAgXG4gICAgICAgIG9mZnNldCA9IHBvcyAtIGhhbmRsZS5hY3R1YWxQb3MoKVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGlmIE1hdGguYWJzKG9mZnNldCkgPCAxXG4gICAgICAgIFxuICAgICAgICBwcmV2ICA9IEBwcmV2QWxsSW52KGhhbmRsZSkgPyBAcHJldlZpc0ZsZXgoaGFuZGxlKSA/IEBwcmV2RmxleCBoYW5kbGVcbiAgICAgICAgbmV4dCAgPSBAbmV4dEFsbEludihoYW5kbGUpID8gQG5leHRWaXNGbGV4KGhhbmRsZSkgPyBAbmV4dEZsZXggaGFuZGxlXG4gICAgICAgIFxuICAgICAgICBkZWxldGUgcHJldi5jb2xsYXBzZWRcbiAgICAgICAgZGVsZXRlIG5leHQuY29sbGFwc2VkXG4gICAgICAgIFxuICAgICAgICBwcmV2U2l6ZSA9IHByZXYuc2l6ZSArIG9mZnNldFxuICAgICAgICBuZXh0U2l6ZSA9IG5leHQuc2l6ZSAtIG9mZnNldFxuICAgICAgICBcbiAgICAgICAgaWYgQHNuYXBGaXJzdD8gYW5kIHByZXZTaXplIDwgQHNuYXBGaXJzdCBhbmQgbm90IEBwcmV2VmlzUGFuZSBwcmV2XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIHByZXZTaXplIDw9IDAgb3Igb2Zmc2V0IDwgQHNuYXBGaXJzdFxuICAgICAgICAgICAgICAgIHByZXZTaXplID0gLTFcbiAgICAgICAgICAgICAgICBuZXh0U2l6ZSA9IG5leHQuc2l6ZSArIHByZXYuc2l6ZSArIEBoYW5kbGVTaXplXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGVsc2UgaWYgcHJldlNpemUgPCAwXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBsZWZ0T3ZlciA9IC1wcmV2U2l6ZVxuICAgICAgICAgICAgcHJldkhhbmRsZSA9IGhhbmRsZS5wcmV2KClcbiAgICAgICAgICAgIHdoaWxlIGxlZnRPdmVyID4gMCBhbmQgcHJldkhhbmRsZSBhbmQgcHJldlZpc0ZsZXggPSBAcHJldlZpc0ZsZXggcHJldkhhbmRsZVxuICAgICAgICAgICAgICAgIGRlZHVjdCA9IE1hdGgubWluIGxlZnRPdmVyLCBwcmV2VmlzRmxleC5zaXplXG4gICAgICAgICAgICAgICAgbGVmdE92ZXIgLT0gZGVkdWN0XG4gICAgICAgICAgICAgICAgcHJldlZpc0ZsZXguc2V0U2l6ZSBwcmV2VmlzRmxleC5zaXplIC0gZGVkdWN0XG4gICAgICAgICAgICAgICAgcHJldkhhbmRsZSA9IHByZXZIYW5kbGUucHJldigpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBwcmV2U2l6ZSA9IDBcbiAgICAgICAgICAgIG5leHRTaXplIC09IGxlZnRPdmVyXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICBpZiBAc25hcExhc3Q/IGFuZCBuZXh0U2l6ZSA8IEBzbmFwTGFzdCBhbmQgbm90IEBuZXh0VmlzUGFuZSBuZXh0XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmIG5leHRTaXplIDw9IDAgb3IgLW9mZnNldCA8IEBzbmFwTGFzdFxuICAgICAgICAgICAgICAgIG5leHRTaXplID0gLTFcbiAgICAgICAgICAgICAgICBwcmV2U2l6ZSA9IHByZXYuc2l6ZSArIG5leHQuc2l6ZSArIEBoYW5kbGVTaXplXG4gICAgICAgICAgICAgICAgXG4gICAgICAgIGVsc2UgaWYgbmV4dFNpemUgPCAwXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBsZWZ0T3ZlciA9IC1uZXh0U2l6ZVxuICAgICAgICAgICAgbmV4dEhhbmRsZSA9IGhhbmRsZS5uZXh0KClcbiAgICAgICAgICAgIHdoaWxlIGxlZnRPdmVyID4gMCBhbmQgbmV4dEhhbmRsZSBhbmQgbmV4dFZpc0ZsZXggPSBAbmV4dFZpc0ZsZXggbmV4dEhhbmRsZVxuICAgICAgICAgICAgICAgIGRlZHVjdCA9IE1hdGgubWluIGxlZnRPdmVyLCBuZXh0VmlzRmxleC5zaXplXG4gICAgICAgICAgICAgICAgbGVmdE92ZXIgLT0gZGVkdWN0XG4gICAgICAgICAgICAgICAgbmV4dFZpc0ZsZXguc2V0U2l6ZSBuZXh0VmlzRmxleC5zaXplIC0gZGVkdWN0XG4gICAgICAgICAgICAgICAgbmV4dEhhbmRsZSA9IG5leHRIYW5kbGUubmV4dCgpXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICBuZXh0U2l6ZSA9IDBcbiAgICAgICAgICAgIHByZXZTaXplIC09IGxlZnRPdmVyXG4gICAgICAgIFxuICAgICAgICBwcmV2LnNldFNpemUgcHJldlNpemVcbiAgICAgICAgbmV4dC5zZXRTaXplIG5leHRTaXplXG4gICAgICAgIEB1cGRhdGUoKVxuICAgICAgICBAb25QYW5lU2l6ZT8oKVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMDAwMDAgICAgICAwMDAgICAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4gICAgIyAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcbiAgICBcbiAgICByZXN0b3JlU3RhdGU6IChzdGF0ZSkgLT5cbiAgICAgICAgcmV0dXJuIGlmIG5vdCBzdGF0ZT8ubGVuZ3RoXG4gICAgICAgIGZvciBzaSBpbiBbMC4uLnN0YXRlLmxlbmd0aF1cbiAgICAgICAgICAgIHMgPSBzdGF0ZVtzaV1cbiAgICAgICAgICAgIHBhbmUgPSBAcGFuZSBzaVxuICAgICAgICAgICAgZGVsZXRlIHBhbmUuY29sbGFwc2VkXG4gICAgICAgICAgICBwYW5lLmNvbGxhcHNlKCkgICAgICBpZiBzLnNpemUgPCAwXG4gICAgICAgICAgICBwYW5lLnNldFNpemUocy5zaXplKSBpZiBzLnNpemUgPj0gMFxuXG4gICAgICAgIEB1cGRhdGVIYW5kbGVzKClcbiAgICAgICAgQG9uUGFuZVNpemU/KClcbiAgICAgICAgXG4gICAgZ2V0U3RhdGU6ICgpIC0+XG4gICAgICAgIHN0YXRlID0gW11cbiAgICAgICAgZm9yIHAgaW4gQHBhbmVzXG4gICAgICAgICAgICBzdGF0ZS5wdXNoXG4gICAgICAgICAgICAgICAgaWQ6ICAgcC5pZFxuICAgICAgICAgICAgICAgIHNpemU6IHAuc2l6ZVxuICAgICAgICAgICAgICAgIHBvczogIHAucG9zKClcbiAgICAgICAgc3RhdGVcblxuICAgICMgIDAwMDAwMDAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgICAgMDAwICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMCAgICAwMDAgICAgMDAwMDAwMCAgIFxuICAgICMgICAgICAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgIDAwMCAgMDAwMDAwMCAgMDAwMDAwMDAgIFxuICAgICAgICBcbiAgICByZXNpemVkOiAgICAgICAtPiBAdXBkYXRlKCkuY2FsY3VsYXRlKClcblxuICAgIHVwZGF0ZTogICAgICAgIC0+IEB1cGRhdGVQYW5lcygpOyBAdXBkYXRlSGFuZGxlcygpXG4gICAgdXBkYXRlUGFuZXM6ICAgLT4gcC51cGRhdGUoKSBmb3IgcCBpbiBAcGFuZXMgIFxuICAgIHVwZGF0ZUhhbmRsZXM6IC0+IGgudXBkYXRlKCkgZm9yIGggaW4gQGhhbmRsZXNcblxuICAgICMgaGFuZGxlIGRyYWcgY2FsbGJhY2tzXG4gICAgXG4gICAgaGFuZGxlU3RhcnQ6IChoYW5kbGUpIC0+IEBvbkRyYWdTdGFydD8oKVxuICAgIGhhbmRsZURyYWc6ICAoaGFuZGxlLCBkcmFnKSAtPlxuICAgICAgICBAbW92ZUhhbmRsZVRvUG9zIGhhbmRsZSwgZHJhZy5wb3NbQGF4aXNdIC0gQHBvcygpIC0gNFxuICAgICAgICBAb25EcmFnPygpXG4gICAgaGFuZGxlRW5kOiAoKSAtPlxuICAgICAgICBAdXBkYXRlKClcbiAgICAgICAgQG9uRHJhZ0VuZD8oKVxuXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAwMDAwMDAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAgICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgMDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAgMDAwICAgICBcbiAgICBcbiAgICBudW1QYW5lczogICAgICAgIC0+IEBwYW5lcy5sZW5ndGhcbiAgICB2aXNpYmxlUGFuZXM6ICAgIC0+IEBwYW5lcy5maWx0ZXIgKHApIC0+IHAuaXNWaXNpYmxlKClcbiAgICBwYW5lUG9zaXRpb25zOiAgIC0+ICggcC5wb3MoKSBmb3IgcCBpbiBAcGFuZXMgKVxuICAgIHBhbmVTaXplczogICAgICAgLT4gKCBwLnNpemUgZm9yIHAgaW4gQHBhbmVzIClcbiAgICBzaXplT2ZQYW5lOiAgKGkpIC0+IEBwYW5lKGkpLnNpemVcbiAgICBwb3NPZlBhbmU6ICAgKGkpIC0+IEBwYW5lKGkpLnBvcygpXG4gICAgcG9zT2ZIYW5kbGU6IChpKSAtPiBAaGFuZGxlKGkpLnBvcygpXG4gICAgcGFuZTogICAgICAgIChpKSAtPiBfLmlzTnVtYmVyKGkpIGFuZCBAcGFuZXNbaV0gICBvciBfLmlzU3RyaW5nKGkpIGFuZCBfLmZpbmQoQHBhbmVzLCAocCkgLT4gcC5pZCA9PSBpKSBvciBpXG4gICAgaGFuZGxlOiAgICAgIChpKSAtPiBfLmlzTnVtYmVyKGkpIGFuZCBAaGFuZGxlc1tpXSBvciBpXG5cbiAgICBoZWlnaHQ6IC0+IEB2aWV3LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodFxuICAgIHNpemU6ICAgLT4gQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClbQGRpbWVuc2lvbl1cbiAgICBwb3M6ICAgIC0+IEB2aWV3LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpW0Bwb3NpdGlvbl1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgMDAwICAgICAgMDAwICAgICAgIDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgICAgICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICBcbiAgICBcbiAgICBpc0NvbGxhcHNlZDogKGkpIC0+IEBwYW5lKGkpLmNvbGxhcHNlZFxuICAgIFxuICAgIGNvbGxhcHNlOiAoaSkgLT4gXG4gICAgICAgIFxuICAgICAgICBpZiBwYW5lID0gQHBhbmUgaVxuICAgICAgICAgICAgaWYgbm90IHBhbmUuY29sbGFwc2VkXG4gICAgICAgICAgICAgICAgcGFuZS5jb2xsYXBzZSgpXG4gICAgICAgICAgICAgICAgQGNhbGN1bGF0ZSgpXG4gICAgICAgIFxuICAgIGV4cGFuZDogKGksIGZhY3Rvcj0wLjUpIC0+XG4gICAgICAgIFxuICAgICAgICBpZiBwYW5lID0gQHBhbmUgaVxuICAgICAgICAgICAgaWYgcGFuZS5jb2xsYXBzZWRcbiAgICAgICAgICAgICAgICBwYW5lLmV4cGFuZCgpXG4gICAgICAgICAgICAgICAgaWYgZmxleCA9IEBjbG9zZXN0VmlzRmxleCBwYW5lXG4gICAgICAgICAgICAgICAgICAgIHVzZSA9IHBhbmUuZml4ZWQgPyBmbGV4LnNpemUgKiBmYWN0b3JcbiAgICAgICAgICAgICAgICAgICAgZmxleC5zaXplIC09IHVzZVxuICAgICAgICAgICAgICAgICAgICBwYW5lLnNpemUgPSB1c2VcbiAgICAgICAgICAgICAgICBAY2FsY3VsYXRlKClcblxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgMDAwICAgICAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgIDAwMCAwMDAgICBcbiAgICAjICAwMDAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwMDAwICAgIDAwMCAgICAgIDAwMDAwMDAgICAgIDAwMDAwICAgIFxuICAgICMgICAgMDAwICAgICAwMDAgICAgICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgMDAwICAgICAgICAwMDAgMDAwICAgXG4gICAgIyAgICAgMCAgICAgIDAwMCAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICBcbiAgICBuZXh0VmlzUGFuZTogKHApIC0+XG4gICAgICAgIHBpID0gQHBhbmVzLmluZGV4T2YgcFxuICAgICAgICByZXR1cm4gbnVsbCBpZiBwaSA+PSBAcGFuZXMubGVuZ3RoLTFcbiAgICAgICAgbmV4dCA9IEBwYW5lc1twaSsxXVxuICAgICAgICByZXR1cm4gbmV4dCBpZiBuZXh0LmlzVmlzaWJsZSgpXG4gICAgICAgIEBuZXh0VmlzUGFuZSBuZXh0XG4gICAgICAgIFxuICAgIHByZXZWaXNQYW5lOiAocCkgLT5cbiAgICAgICAgcGkgPSBAcGFuZXMuaW5kZXhPZiBwXG4gICAgICAgIHJldHVybiBudWxsIGlmIHBpIDw9IDBcbiAgICAgICAgcHJldiA9IEBwYW5lc1twaS0xXVxuICAgICAgICByZXR1cm4gcHJldiBpZiBwcmV2LmlzVmlzaWJsZSgpXG4gICAgICAgIEBwcmV2VmlzUGFuZSBwcmV2XG5cbiAgICBjbG9zZXN0VmlzRmxleDogKHApIC0+XG4gICAgICAgIGQgPSAxXG4gICAgICAgIHBpID0gQHBhbmVzLmluZGV4T2YgcFxuICAgICAgICBcbiAgICAgICAgaXNWaXNGbGV4UGFuZSA9IChpKSA9PlxuICAgICAgICAgICAgaWYgaSA+PSAwIGFuZCBpIDwgQHBhbmVzLmxlbmd0aFxuICAgICAgICAgICAgICAgIGlmIG5vdCBAcGFuZXNbaV0uY29sbGFwc2VkIGFuZCBub3QgQHBhbmVzW2ldLmZpeGVkXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlIFxuICAgICAgICAgICAgXG4gICAgICAgIHdoaWxlIGQgPCBAcGFuZXMubGVuZ3RoLTFcbiAgICAgICAgICAgIGlmIGlzVmlzRmxleFBhbmUgcGkgKyBkXG4gICAgICAgICAgICAgICAgcmV0dXJuIEBwYW5lc1twaSArIGRdXG4gICAgICAgICAgICBlbHNlIGlmIGlzVmlzRmxleFBhbmUgcGkgLSBkXG4gICAgICAgICAgICAgICAgcmV0dXJuIEBwYW5lc1twaSAtIGRdXG4gICAgICAgICAgICBkKytcblxuICAgIHRyYXZQcmV2OiAoaCwgZikgLT4gZihoKSBhbmQgaC5wYW5lYSBvciBoLmluZGV4ID4gMCBhbmQgQHRyYXZQcmV2KEBoYW5kbGVzW2guaW5kZXgtMV0sIGYpIG9yIG51bGwgICAgXG4gICAgdHJhdk5leHQ6IChoLCBmKSAtPiBmKGgpIGFuZCBoLnBhbmViIG9yIGguaW5kZXggPCBAaGFuZGxlcy5sZW5ndGgtMSBhbmQgQHRyYXZOZXh0KEBoYW5kbGVzW2guaW5kZXgrMV0sIGYpIG9yIG51bGxcbiAgICBwcmV2VmlzRmxleDogKGgpIC0+IEB0cmF2UHJldiBoLCAodikgLT4gbm90IHYucGFuZWEuY29sbGFwc2VkIGFuZCBub3Qgdi5wYW5lYS5maXhlZFxuICAgIG5leHRWaXNGbGV4OiAoaCkgLT4gQHRyYXZOZXh0IGgsICh2KSAtPiBub3Qgdi5wYW5lYi5jb2xsYXBzZWQgYW5kIG5vdCB2LnBhbmViLmZpeGVkIFxuICAgIHByZXZGbGV4OiAgICAoaCkgLT4gQHRyYXZQcmV2IGgsICh2KSAtPiBub3Qgdi5wYW5lYS5maXhlZFxuICAgIG5leHRGbGV4OiAgICAoaCkgLT4gQHRyYXZOZXh0IGgsICh2KSAtPiBub3Qgdi5wYW5lYi5maXhlZCBcbiAgICBwcmV2VmlzOiAgICAgKGgpIC0+IEB0cmF2UHJldiBoLCAodikgLT4gbm90IHYucGFuZWEuY29sbGFwc2VkIFxuICAgIG5leHRWaXM6ICAgICAoaCkgLT4gQHRyYXZOZXh0IGgsICh2KSAtPiBub3Qgdi5wYW5lYi5jb2xsYXBzZWQgXG4gICAgcHJldkFsbEludjogIChoKSAtPiBwID0gbm90IEBwcmV2VmlzKGgpIGFuZCBoLnBhbmVhIG9yIG51bGw7IHA/LmV4cGFuZCgpOyBwXG4gICAgbmV4dEFsbEludjogIChoKSAtPiBwID0gbm90IEBuZXh0VmlzKGgpIGFuZCBoLnBhbmViIG9yIG51bGw7IHA/LmV4cGFuZCgpOyBwXG4gICAgICAgIFxubW9kdWxlLmV4cG9ydHMgPSBGbGV4XG4iXX0=
//# sourceURL=../../coffee/flex/flex.coffee