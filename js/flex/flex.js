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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmxleC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBd0QsT0FBQSxDQUFRLEtBQVIsQ0FBeEQsRUFBRSx1QkFBRixFQUFZLGlCQUFaLEVBQW1CLGlCQUFuQixFQUEwQixpQkFBMUIsRUFBaUMsZUFBakMsRUFBdUMsZUFBdkMsRUFBNkMsYUFBN0MsRUFBa0Q7O0FBRWxELElBQUEsR0FBUyxPQUFBLENBQVEsUUFBUjs7QUFDVCxNQUFBLEdBQVMsT0FBQSxDQUFRLFVBQVI7O0FBRUg7SUFFQyxjQUFDLEdBQUQ7QUFFQyxZQUFBO1FBQUEsSUFBQyxDQUFBLFVBQUQsNENBQWdDO1FBQ2hDLElBQUMsQ0FBQSxTQUFELDJDQUErQjtRQUMvQixJQUFDLENBQUEsU0FBRCxHQUFlLEdBQUcsQ0FBQztRQUNuQixJQUFDLENBQUEsUUFBRCxHQUFlLEdBQUcsQ0FBQztRQUNuQixJQUFDLENBQUEsVUFBRCxHQUFlLEdBQUcsQ0FBQztRQUNuQixJQUFDLENBQUEsV0FBRCxHQUFlLEdBQUcsQ0FBQztRQUNuQixJQUFDLENBQUEsTUFBRCxHQUFlLEdBQUcsQ0FBQztRQUNuQixJQUFDLENBQUEsU0FBRCxHQUFlLEdBQUcsQ0FBQztRQUVuQixJQUFBLEdBQWUsSUFBQyxDQUFBLFNBQUQsS0FBYztRQUM3QixJQUFDLENBQUEsU0FBRCxHQUFlLElBQUEsSUFBUyxPQUFULElBQW9CO1FBQ25DLElBQUMsQ0FBQSxTQUFELEdBQWUsSUFBQSxJQUFTLGFBQVQsSUFBMEI7UUFDekMsSUFBQyxDQUFBLElBQUQsR0FBZSxJQUFBLElBQVMsR0FBVCxJQUFnQjtRQUMvQixJQUFDLENBQUEsUUFBRCxHQUFlLElBQUEsSUFBUyxNQUFULElBQW1CO1FBQ2xDLElBQUMsQ0FBQSxXQUFELEdBQWUsSUFBQSxJQUFTLHNDQUFULElBQW1EO1FBQ2xFLElBQUMsQ0FBQSxRQUFELEdBQWUsSUFBQSxJ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QUFDLENBQUQ7ZUFBTyxJQUFDLENBQUEsUUFBRCxDQUFVLENBQVYsRUFBYSxTQUFDLENBQUQ7bUJBQU8sQ0FBSSxDQUFDLENBQUMsS0FBSyxDQUFDO1FBQW5CLENBQWI7SUFBUDs7bUJBQ2IsT0FBQSxHQUFhLFNBQUMsQ0FBRDtlQUFPLElBQUMsQ0FBQSxRQUFELENBQVUsQ0FBVixFQUFhLFNBQUMsQ0FBRDttQkFBTyxDQUFJLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFBbkIsQ0FBYjtJQUFQOzttQkFDYixVQUFBLEdBQWEsU0FBQyxDQUFEO0FBQU8sWUFBQTtRQUFBLENBQUEsR0FBSSxDQUFJLElBQUMsQ0FBQSxPQUFELENBQVMsQ0FBVCxDQUFKLElBQW9CLENBQUMsQ0FBQyxLQUF0QixJQUErQjs7WUFBTSxDQUFDLENBQUUsTUFBSCxDQUFBOztlQUFhO0lBQTdEOzttQkFDYixVQUFBLEdBQWEsU0FBQyxDQUFEO0FBQU8sWUFBQTtRQUFBLENBQUEsR0FBSSxDQUFJLElBQUMsQ0FBQSxPQUFELENBQVMsQ0FBVCxDQUFKLElBQW9CLENBQUMsQ0FBQyxLQUF0QixJQUErQjs7WUFBTSxDQUFDLENBQUUsTUFBSCxDQUFBOztlQUFhO0lBQTdEOzs7Ozs7QUFFakIsTUFBTSxDQUFDLE9BQVAsR0FBaUIiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbjAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgIDAwMCAwMDAgICBcbjAwMDAwMCAgICAwMDAgICAgICAwMDAwMDAwICAgICAwMDAwMCAgICBcbjAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgIDAwMCAwMDAgICBcbjAwMCAgICAgICAwMDAwMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiMjI1xuXG57IGdldFN0eWxlLCBjbGFtcCwgdmFsaWQsIGVtcHR5LCBsYXN0LCBkcmFnLCBkZWYsIF8gfSA9IHJlcXVpcmUgJ2t4aydcblxuUGFuZSAgID0gcmVxdWlyZSAnLi9wYW5lJ1xuSGFuZGxlID0gcmVxdWlyZSAnLi9oYW5kbGUnXG5cbmNsYXNzIEZsZXggXG4gICAgXG4gICAgQDogKG9wdCkgLT5cbiAgICAgICAgXG4gICAgICAgIEBoYW5kbGVTaXplICA9IG9wdC5oYW5kbGVTaXplID8gNlxuICAgICAgICBAZGlyZWN0aW9uICAgPSBvcHQuZGlyZWN0aW9uID8gJ2hvcml6b250YWwnXG4gICAgICAgIEBzbmFwRmlyc3QgICA9IG9wdC5zbmFwRmlyc3RcbiAgICAgICAgQHNuYXBMYXN0ICAgID0gb3B0LnNuYXBMYXN0XG4gICAgICAgIEBvblBhbmVTaXplICA9IG9wdC5vblBhbmVTaXplXG4gICAgICAgIEBvbkRyYWdTdGFydCA9IG9wdC5vbkRyYWdTdGFydFxuICAgICAgICBAb25EcmFnICAgICAgPSBvcHQub25EcmFnXG4gICAgICAgIEBvbkRyYWdFbmQgICA9IG9wdC5vbkRyYWdFbmRcbiAgICBcbiAgICAgICAgaG9yeiAgICAgICAgID0gQGRpcmVjdGlvbiA9PSAnaG9yaXpvbnRhbCdcbiAgICAgICAgQGRpbWVuc2lvbiAgID0gaG9yeiBhbmQgJ3dpZHRoJyBvciAnaGVpZ2h0J1xuICAgICAgICBAY2xpZW50RGltICAgPSBob3J6IGFuZCAnY2xpZW50V2lkdGgnIG9yICdjbGllbnRIZWlnaHQnXG4gICAgICAgIEBheGlzICAgICAgICA9IGhvcnogYW5kICd4JyBvciAneSdcbiAgICAgICAgQHBvc2l0aW9uICAgID0gaG9yeiBhbmQgJ2xlZnQnIG9yICd0b3AnXG4gICAgICAgIEBoYW5kbGVDbGFzcyA9IGhvcnogYW5kICdzcGxpdC1oYW5kbGUgc3BsaXQtaGFuZGxlLWhvcml6b250YWwnIG9yICdzcGxpdC1oYW5kbGUgc3BsaXQtaGFuZGxlLXZlcnRpY2FsJ1xuICAgICAgICBAcGFkZGluZ0EgICAgPSBob3J6IGFuZCAncGFkZGluZ0xlZnQnIG9yICdwYWRkaW5nVG9wJ1xuICAgICAgICBAcGFkZGluZ0IgICAgPSBob3J6IGFuZCAncGFkZGluZ1JpZ2h0JyBvciAncGFkZGluZ0JvdHRvbSdcbiAgICAgICAgQGN1cnNvciAgICAgID0gb3B0LmN1cnNvciA/IGhvcnogYW5kICdldy1yZXNpemUnIG9yICducy1yZXNpemUnXG4gICAgICAgIFxuICAgICAgICBAcGFuZXMgICA9IFtdXG4gICAgICAgIEBoYW5kbGVzID0gW11cblxuICAgICAgICBAdmlldyA9IG9wdC52aWV3ID8gb3B0LnBhbmVzWzBdLmRpdi5wYXJlbnROb2RlXG4gICAgICAgIEB2aWV3LnN0eWxlLmRpc3BsYXkgPSAnZmxleCdcbiAgICAgICAgQHZpZXcuc3R5bGUuZmxleERpcmVjdGlvbiA9IGhvcnogYW5kICdyb3cnIG9yICdjb2x1bW4nXG4gICAgICAgIFxuICAgICAgICBpZiB2YWxpZCBvcHQucGFuZXNcbiAgICAgICAgICAgIEBhZGRQYW5lIHAgZm9yIHAgaW4gb3B0LnBhbmVzXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICMgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIFxuICAgICMgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMCAgICBcbiAgICBcbiAgICBhZGRQYW5lOiAocCkgLT5cblxuICAgICAgICBuZXdQYW5lID0gbmV3IFBhbmUgXy5kZWZhdWx0cyBwLCBcbiAgICAgICAgICAgIGZsZXg6ICAgQCBcbiAgICAgICAgICAgIGluZGV4OiAgQHBhbmVzLmxlbmd0aFxuICAgICAgICAgICAgXG4gICAgICAgIGlmIGxhc3RQYW5lID0gXy5sYXN0IEBwYW5lc1xuICAgICAgICAgICAgQGhhbmRsZXMucHVzaCBuZXcgSGFuZGxlXG4gICAgICAgICAgICAgICAgZmxleDogIEBcbiAgICAgICAgICAgICAgICBpbmRleDogbGFzdFBhbmUuaW5kZXhcbiAgICAgICAgICAgICAgICBwYW5lYTogbGFzdFBhbmVcbiAgICAgICAgICAgICAgICBwYW5lYjogbmV3UGFuZVxuICAgICAgICAgICAgXG4gICAgICAgIEBwYW5lcy5wdXNoIG5ld1BhbmVcbiAgICAgICAgQHJlbGF4KClcblxuICAgICMgMDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgIFxuICAgICMgMDAwICAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgXG4gICAgIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwICAgICAgICBcbiAgICBcbiAgICBwb3BQYW5lOiAob3B0PXt9KSAtPlxuICAgICAgICBcbiAgICAgICAgaWYgb3B0Py5yZWxheCA9PSBmYWxzZVxuICAgICAgICAgICAgQHVucmVsYXgoKVxuICAgICAgICBcbiAgICAgICAgaWYgQHBhbmVzLmxlbmd0aCA+IDFcbiAgICAgICAgICAgIEBwYW5lcy5wb3AoKS5kZWwoKVxuICAgICAgICAgICAgQGhhbmRsZXMucG9wKCkuZGVsKClcbiAgICAgICAgICAgIFxuICAgICAgICBpZiBvcHQ/LnJlbGF4ICE9IGZhbHNlXG4gICAgICAgICAgICBAcmVsYXgoKSAgICBcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgbGFzdChAcGFuZXMpLnNldFNpemUgbGFzdChAcGFuZXMpLmFjdHVhbFNpemUoKVxuXG4gICAgc2hpZnRQYW5lOiAtPlxuICAgICAgICBcbiAgICAgICAgaWYgQHBhbmVzLmxlbmd0aCA+IDFcbiAgICAgICAgICAgIEBwYW5lcy5zaGlmdCgpLmRlbCgpXG4gICAgICAgICAgICBAaGFuZGxlcy5zaGlmdCgpLmRlbCgpXG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIGkgaW4gWzAuLi5AcGFuZXMubGVuZ3RoXVxuICAgICAgICAgICAgQHBhbmVzW2ldLmluZGV4ID0gaVxuXG4gICAgICAgIGZvciBpIGluIFswLi4uQGhhbmRsZXMubGVuZ3RoXVxuICAgICAgICAgICAgQGhhbmRsZXNbaV0uaW5kZXggPSBpXG4gICAgICAgICAgICBcbiAgICAgICAgQHJlbGF4KCkgIFxuICAgICAgICAgICAgXG4gICAgIyAwMDAwMDAwMCAgIDAwMDAwMDAwICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAwMDAwICAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAwMDAwMDAgICAgMDAwMDAgICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAwMDAgICAwMDAgMDAwICAgXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgXG4gICAgXG4gICAgcmVsYXg6IC0+XG4gICAgICAgIFxuICAgICAgICBAcmVsYXhlZCA9IHRydWVcbiAgICAgICAgZm9yIHAgaW4gQHZpc2libGVQYW5lcygpXG4gICAgICAgICAgICBwLmRpdi5zdHlsZS5mbGV4ID0gXCIxIDEgMFwiXG4gICAgICAgICAgICBwLnNpemUgPSAwXG5cbiAgICB1bnJlbGF4OiAtPlxuICAgICAgICBcbiAgICAgICAgQHJlbGF4ZWQgPSBmYWxzZVxuICAgICAgICBmb3IgcCBpbiBAdmlzaWJsZVBhbmVzKClcbiAgICAgICAgICAgIHAuc2l6ZSA9IHAuYWN0dWFsU2l6ZSgpXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMCAgICAgICAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAwMDAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgICBcbiAgICAjICAwMDAwMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAwICBcbiAgICBcbiAgICBjYWxjdWxhdGU6IC0+XG5cbiAgICAgICAgdmlzUGFuZXMgID0gQHBhbmVzLmZpbHRlciAocCkgLT4gbm90IHAuY29sbGFwc2VkXG4gICAgICAgIGZsZXhQYW5lcyA9IHZpc1BhbmVzLmZpbHRlciAocCkgLT4gbm90IHAuZml4ZWRcbiAgICAgICAgYXZhaWwgICAgID0gQHNpemUoKVxuICAgICAgICBcbiAgICAgICAgZm9yIGggaW4gQGhhbmRsZXNcbiAgICAgICAgICAgIGgudXBkYXRlKCkgXG4gICAgICAgICAgICBhdmFpbCAtPSBoLnNpemUoKSBpZiBoLmlzVmlzaWJsZSgpXG4gICAgICAgICAgICBcbiAgICAgICAgZm9yIHAgaW4gdmlzUGFuZXNcbiAgICAgICAgICAgIGF2YWlsIC09IHAuc2l6ZVxuICAgICAgICAgICAgXG4gICAgICAgIGRpZmYgPSBhdmFpbCAvIGZsZXhQYW5lcy5sZW5ndGhcbiAgICAgICAgXG4gICAgICAgIGZvciBwIGluIGZsZXhQYW5lc1xuICAgICAgICAgICAgcC5zaXplICs9IGRpZmZcbiAgICAgICAgICAgIFxuICAgICAgICBmb3IgcCBpbiB2aXNQYW5lc1xuICAgICAgICAgICAgcC5zZXRTaXplIHAuc2l6ZVxuXG4gICAgICAgIEBvblBhbmVTaXplPygpXG4gICAgXG4gICAgIyAwMCAgICAgMDAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAgIDAgICAgICAwMDAwMDAwMCAgXG5cbiAgICBtb3ZlSGFuZGxlOiAob3B0KSAtPiBcbiAgICAgICAgXG4gICAgICAgIGhhbmRsZSA9IEBoYW5kbGVzW29wdC5pbmRleF1cbiAgICAgICAgQG1vdmVIYW5kbGVUb1BvcyBoYW5kbGUsIG9wdC5wb3MgICAgICAgIFxuICAgIFxuICAgIG1vdmVIYW5kbGVUb1BvczogKGhhbmRsZSwgcG9zKSAtPlxuICAgICAgICBcbiAgICAgICAgcG9zID0gcGFyc2VJbnQgcG9zXG4gICAgICAgIGlmIEByZWxheGVkIHRoZW4gQHVucmVsYXgoKVxuICAgICAgICBcbiAgICAgICAgb2Zmc2V0ID0gcG9zIC0gaGFuZGxlLmFjdHVhbFBvcygpXG4gICAgICAgIFxuICAgICAgICByZXR1cm4gaWYgTWF0aC5hYnMob2Zmc2V0KSA8IDFcbiAgICAgICAgXG4gICAgICAgIHByZXYgID0gQHByZXZBbGxJbnYoaGFuZGxlKSA/IEBwcmV2VmlzRmxleChoYW5kbGUpID8gQHByZXZGbGV4IGhhbmRsZVxuICAgICAgICBuZXh0ICA9IEBuZXh0QWxsSW52KGhhbmRsZSkgPyBAbmV4dFZpc0ZsZXgoaGFuZGxlKSA/IEBuZXh0RmxleCBoYW5kbGVcbiAgICAgICAgXG4gICAgICAgIGRlbGV0ZSBwcmV2LmNvbGxhcHNlZFxuICAgICAgICBkZWxldGUgbmV4dC5jb2xsYXBzZWRcbiAgICAgICAgXG4gICAgICAgIHByZXZTaXplID0gcHJldi5zaXplICsgb2Zmc2V0XG4gICAgICAgIG5leHRTaXplID0gbmV4dC5zaXplIC0gb2Zmc2V0XG4gICAgICAgIFxuICAgICAgICBpZiBAc25hcEZpcnN0PyBhbmQgcHJldlNpemUgPCBAc25hcEZpcnN0IGFuZCBub3QgQHByZXZWaXNQYW5lIHByZXZcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgcHJldlNpemUgPD0gMCBvciBvZmZzZXQgPCBAc25hcEZpcnN0XG4gICAgICAgICAgICAgICAgcHJldlNpemUgPSAtMVxuICAgICAgICAgICAgICAgIG5leHRTaXplID0gbmV4dC5zaXplICsgcHJldi5zaXplICsgQGhhbmRsZVNpemVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgZWxzZSBpZiBwcmV2U2l6ZSA8IDBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGxlZnRPdmVyID0gLXByZXZTaXplXG4gICAgICAgICAgICBwcmV2SGFuZGxlID0gaGFuZGxlLnByZXYoKVxuICAgICAgICAgICAgd2hpbGUgbGVmdE92ZXIgPiAwIGFuZCBwcmV2SGFuZGxlIGFuZCBwcmV2VmlzRmxleCA9IEBwcmV2VmlzRmxleCBwcmV2SGFuZGxlXG4gICAgICAgICAgICAgICAgZGVkdWN0ID0gTWF0aC5taW4gbGVmdE92ZXIsIHByZXZWaXNGbGV4LnNpemVcbiAgICAgICAgICAgICAgICBsZWZ0T3ZlciAtPSBkZWR1Y3RcbiAgICAgICAgICAgICAgICBwcmV2VmlzRmxleC5zZXRTaXplIHByZXZWaXNGbGV4LnNpemUgLSBkZWR1Y3RcbiAgICAgICAgICAgICAgICBwcmV2SGFuZGxlID0gcHJldkhhbmRsZS5wcmV2KClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIHByZXZTaXplID0gMFxuICAgICAgICAgICAgbmV4dFNpemUgLT0gbGVmdE92ZXJcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgIGlmIEBzbmFwTGFzdD8gYW5kIG5leHRTaXplIDwgQHNuYXBMYXN0IGFuZCBub3QgQG5leHRWaXNQYW5lIG5leHRcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgbmV4dFNpemUgPD0gMCBvciAtb2Zmc2V0IDwgQHNuYXBMYXN0XG4gICAgICAgICAgICAgICAgbmV4dFNpemUgPSAtMVxuICAgICAgICAgICAgICAgIHByZXZTaXplID0gcHJldi5zaXplICsgbmV4dC5zaXplICsgQGhhbmRsZVNpemVcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgZWxzZSBpZiBuZXh0U2l6ZSA8IDBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIGxlZnRPdmVyID0gLW5leHRTaXplXG4gICAgICAgICAgICBuZXh0SGFuZGxlID0gaGFuZGxlLm5leHQoKVxuICAgICAgICAgICAgd2hpbGUgbGVmdE92ZXIgPiAwIGFuZCBuZXh0SGFuZGxlIGFuZCBuZXh0VmlzRmxleCA9IEBuZXh0VmlzRmxleCBuZXh0SGFuZGxlXG4gICAgICAgICAgICAgICAgZGVkdWN0ID0gTWF0aC5taW4gbGVmdE92ZXIsIG5leHRWaXNGbGV4LnNpemVcbiAgICAgICAgICAgICAgICBsZWZ0T3ZlciAtPSBkZWR1Y3RcbiAgICAgICAgICAgICAgICBuZXh0VmlzRmxleC5zZXRTaXplIG5leHRWaXNGbGV4LnNpemUgLSBkZWR1Y3RcbiAgICAgICAgICAgICAgICBuZXh0SGFuZGxlID0gbmV4dEhhbmRsZS5uZXh0KClcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIG5leHRTaXplID0gMFxuICAgICAgICAgICAgcHJldlNpemUgLT0gbGVmdE92ZXJcbiAgICAgICAgXG4gICAgICAgIHByZXYuc2V0U2l6ZSBwcmV2U2l6ZVxuICAgICAgICBuZXh0LnNldFNpemUgbmV4dFNpemVcbiAgICAgICAgQHVwZGF0ZSgpXG4gICAgICAgIEBvblBhbmVTaXplPygpXG5cbiAgICAjICAwMDAwMDAwICAwMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuICAgICMgMDAwMDAwMCAgICAgIDAwMCAgICAgMDAwMDAwMDAwICAgICAwMDAgICAgIDAwMDAwMDAgICBcbiAgICAjICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgIDAwMCAgICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIHJlc3RvcmVTdGF0ZTogKHN0YXRlKSAtPlxuICAgICAgICByZXR1cm4gaWYgbm90IHN0YXRlPy5sZW5ndGhcbiAgICAgICAgZm9yIHNpIGluIFswLi4uc3RhdGUubGVuZ3RoXVxuICAgICAgICAgICAgcyA9IHN0YXRlW3NpXVxuICAgICAgICAgICAgcGFuZSA9IEBwYW5lIHNpXG4gICAgICAgICAgICBkZWxldGUgcGFuZS5jb2xsYXBzZWRcbiAgICAgICAgICAgIHBhbmUuY29sbGFwc2UoKSAgICAgIGlmIHMuc2l6ZSA8IDBcbiAgICAgICAgICAgIHBhbmUuc2V0U2l6ZShzLnNpemUpIGlmIHMuc2l6ZSA+PSAwXG5cbiAgICAgICAgQHVwZGF0ZUhhbmRsZXMoKVxuICAgICAgICBAb25QYW5lU2l6ZT8oKVxuICAgICAgICBcbiAgICBnZXRTdGF0ZTogKCkgLT5cbiAgICAgICAgc3RhdGUgPSBbXVxuICAgICAgICBmb3IgcCBpbiBAcGFuZXNcbiAgICAgICAgICAgIHN0YXRlLnB1c2hcbiAgICAgICAgICAgICAgICBpZDogICBwLmlkXG4gICAgICAgICAgICAgICAgc2l6ZTogcC5zaXplXG4gICAgICAgICAgICAgICAgcG9zOiAgcC5wb3MoKVxuICAgICAgICBzdGF0ZVxuXG4gICAgIyAgMDAwMDAwMCAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgICAwMDAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwICAgIDAwMCAgICAwMDAwMDAwICAgXG4gICAgIyAgICAgIDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgICAgXG4gICAgIyAwMDAwMDAwICAgMDAwICAwMDAwMDAwICAwMDAwMDAwMCAgXG4gICAgICAgIFxuICAgIHJlc2l6ZWQ6ICAgICAgIC0+IEB1cGRhdGUoKS5jYWxjdWxhdGUoKVxuXG4gICAgdXBkYXRlOiAgICAgICAgLT4gQHVwZGF0ZVBhbmVzKCk7IEB1cGRhdGVIYW5kbGVzKClcbiAgICB1cGRhdGVQYW5lczogICAtPiBwLnVwZGF0ZSgpIGZvciBwIGluIEBwYW5lcyAgXG4gICAgdXBkYXRlSGFuZGxlczogLT4gaC51cGRhdGUoKSBmb3IgaCBpbiBAaGFuZGxlc1xuXG4gICAgIyBoYW5kbGUgZHJhZyBjYWxsYmFja3NcbiAgICBcbiAgICBoYW5kbGVTdGFydDogKGhhbmRsZSkgLT4gQG9uRHJhZ1N0YXJ0PygpXG4gICAgaGFuZGxlRHJhZzogIChoYW5kbGUsIGRyYWcpIC0+XG4gICAgICAgIEBtb3ZlSGFuZGxlVG9Qb3MgaGFuZGxlLCBkcmFnLnBvc1tAYXhpc10gLSBAcG9zKCkgLSA0XG4gICAgICAgIEBvbkRyYWc/KClcbiAgICBoYW5kbGVFbmQ6ICgpIC0+XG4gICAgICAgIEB1cGRhdGUoKVxuICAgICAgICBAb25EcmFnRW5kPygpXG5cbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMDAgIDAwMDAwMDAwMCAgXG4gICAgIyAwMDAgICAgICAgIDAwMCAgICAgICAgICAwMDAgICAgIFxuICAgICMgMDAwICAwMDAwICAwMDAwMDAwICAgICAgMDAwICAgICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAwICAgICAwMDAgICAgIFxuICAgIFxuICAgIG51bVBhbmVzOiAgICAgICAgLT4gQHBhbmVzLmxlbmd0aFxuICAgIHZpc2libGVQYW5lczogICAgLT4gQHBhbmVzLmZpbHRlciAocCkgLT4gcC5pc1Zpc2libGUoKVxuICAgIHBhbmVQb3NpdGlvbnM6ICAgLT4gKCBwLnBvcygpIGZvciBwIGluIEBwYW5lcyApXG4gICAgcGFuZVNpemVzOiAgICAgICAtPiAoIHAuc2l6ZSBmb3IgcCBpbiBAcGFuZXMgKVxuICAgIHNpemVPZlBhbmU6ICAoaSkgLT4gQHBhbmUoaSkuc2l6ZVxuICAgIHBvc09mUGFuZTogICAoaSkgLT4gQHBhbmUoaSkucG9zKClcbiAgICBwb3NPZkhhbmRsZTogKGkpIC0+IEBoYW5kbGUoaSkucG9zKClcbiAgICBwYW5lOiAgICAgICAgKGkpIC0+IF8uaXNOdW1iZXIoaSkgYW5kIEBwYW5lc1tpXSAgIG9yIF8uaXNTdHJpbmcoaSkgYW5kIF8uZmluZChAcGFuZXMsIChwKSAtPiBwLmlkID09IGkpIG9yIGlcbiAgICBoYW5kbGU6ICAgICAgKGkpIC0+IF8uaXNOdW1iZXIoaSkgYW5kIEBoYW5kbGVzW2ldIG9yIGlcblxuICAgIGhlaWdodDogLT4gQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0XG4gICAgc2l6ZTogICAtPiBAdmlldy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVtAZGltZW5zaW9uXVxuICAgIHBvczogICAgLT4gQHZpZXcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClbQHBvc2l0aW9uXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgIyAgMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAgICAgICAwMDAgICAgICAgMDAwMDAwMCAgIDAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwICBcbiAgICAjIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgIDAwMCAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIFxuICAgICMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgMDAwICAgICAgMDAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgXG4gICAgIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAwMDAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAgICAgICAwMDAgIDAwMCAgICAgICBcbiAgICAjICAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAgIFxuICAgIFxuICAgIGlzQ29sbGFwc2VkOiAoaSkgLT4gQHBhbmUoaSkuY29sbGFwc2VkXG4gICAgXG4gICAgY29sbGFwc2U6IChpKSAtPiBcbiAgICAgICAgXG4gICAgICAgIGlmIHBhbmUgPSBAcGFuZSBpXG4gICAgICAgICAgICBpZiBub3QgcGFuZS5jb2xsYXBzZWRcbiAgICAgICAgICAgICAgICBwYW5lLmNvbGxhcHNlKClcbiAgICAgICAgICAgICAgICBAY2FsY3VsYXRlKClcbiAgICAgICAgXG4gICAgZXhwYW5kOiAoaSwgZmFjdG9yPTAuNSkgLT5cbiAgICAgICAgXG4gICAgICAgIGlmIHBhbmUgPSBAcGFuZSBpXG4gICAgICAgICAgICBpZiBwYW5lLmNvbGxhcHNlZFxuICAgICAgICAgICAgICAgIHBhbmUuZXhwYW5kKClcbiAgICAgICAgICAgICAgICBpZiBmbGV4ID0gQGNsb3Nlc3RWaXNGbGV4IHBhbmVcbiAgICAgICAgICAgICAgICAgICAgdXNlID0gcGFuZS5maXhlZCA/IGZsZXguc2l6ZSAqIGZhY3RvclxuICAgICAgICAgICAgICAgICAgICBmbGV4LnNpemUgLT0gdXNlXG4gICAgICAgICAgICAgICAgICAgIHBhbmUuc2l6ZSA9IHVzZVxuICAgICAgICAgICAgICAgIEBjYWxjdWxhdGUoKVxuXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAgICAwMDAwMDAwMCAgMDAwICAgMDAwICBcbiAgICAjIDAwMCAgIDAwMCAgMDAwICAwMDAgICAgICAgMDAwICAgICAgIDAwMCAgICAgIDAwMCAgICAgICAgMDAwIDAwMCAgIFxuICAgICMgIDAwMCAwMDAgICAwMDAgIDAwMDAwMDAgICAwMDAwMDAgICAgMDAwICAgICAgMDAwMDAwMCAgICAgMDAwMDAgICAgXG4gICAgIyAgICAwMDAgICAgIDAwMCAgICAgICAwMDAgIDAwMCAgICAgICAwMDAgICAgICAwMDAgICAgICAgIDAwMCAwMDAgICBcbiAgICAjICAgICAwICAgICAgMDAwICAwMDAwMDAwICAgMDAwICAgICAgIDAwMDAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgIFxuICAgIFxuICAgIG5leHRWaXNQYW5lOiAocCkgLT5cbiAgICAgICAgcGkgPSBAcGFuZXMuaW5kZXhPZiBwXG4gICAgICAgIHJldHVybiBudWxsIGlmIHBpID49IEBwYW5lcy5sZW5ndGgtMVxuICAgICAgICBuZXh0ID0gQHBhbmVzW3BpKzFdXG4gICAgICAgIHJldHVybiBuZXh0IGlmIG5leHQuaXNWaXNpYmxlKClcbiAgICAgICAgQG5leHRWaXNQYW5lIG5leHRcbiAgICAgICAgXG4gICAgcHJldlZpc1BhbmU6IChwKSAtPlxuICAgICAgICBwaSA9IEBwYW5lcy5pbmRleE9mIHBcbiAgICAgICAgcmV0dXJuIG51bGwgaWYgcGkgPD0gMFxuICAgICAgICBwcmV2ID0gQHBhbmVzW3BpLTFdXG4gICAgICAgIHJldHVybiBwcmV2IGlmIHByZXYuaXNWaXNpYmxlKClcbiAgICAgICAgQHByZXZWaXNQYW5lIHByZXZcblxuICAgIGNsb3Nlc3RWaXNGbGV4OiAocCkgLT5cbiAgICAgICAgZCA9IDFcbiAgICAgICAgcGkgPSBAcGFuZXMuaW5kZXhPZiBwXG4gICAgICAgIFxuICAgICAgICBpc1Zpc0ZsZXhQYW5lID0gKGkpID0+XG4gICAgICAgICAgICBpZiBpID49IDAgYW5kIGkgPCBAcGFuZXMubGVuZ3RoXG4gICAgICAgICAgICAgICAgaWYgbm90IEBwYW5lc1tpXS5jb2xsYXBzZWQgYW5kIG5vdCBAcGFuZXNbaV0uZml4ZWRcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWUgXG4gICAgICAgICAgICBcbiAgICAgICAgd2hpbGUgZCA8IEBwYW5lcy5sZW5ndGgtMVxuICAgICAgICAgICAgaWYgaXNWaXNGbGV4UGFuZSBwaSArIGRcbiAgICAgICAgICAgICAgICByZXR1cm4gQHBhbmVzW3BpICsgZF1cbiAgICAgICAgICAgIGVsc2UgaWYgaXNWaXNGbGV4UGFuZSBwaSAtIGRcbiAgICAgICAgICAgICAgICByZXR1cm4gQHBhbmVzW3BpIC0gZF1cbiAgICAgICAgICAgIGQrK1xuXG4gICAgdHJhdlByZXY6IChoLCBmKSAtPiBmKGgpIGFuZCBoLnBhbmVhIG9yIGguaW5kZXggPiAwIGFuZCBAdHJhdlByZXYoQGhhbmRsZXNbaC5pbmRleC0xXSwgZikgb3IgbnVsbCAgICBcbiAgICB0cmF2TmV4dDogKGgsIGYpIC0+IGYoaCkgYW5kIGgucGFuZWIgb3IgaC5pbmRleCA8IEBoYW5kbGVzLmxlbmd0aC0xIGFuZCBAdHJhdk5leHQoQGhhbmRsZXNbaC5pbmRleCsxXSwgZikgb3IgbnVsbFxuICAgIHByZXZWaXNGbGV4OiAoaCkgLT4gQHRyYXZQcmV2IGgsICh2KSAtPiBub3Qgdi5wYW5lYS5jb2xsYXBzZWQgYW5kIG5vdCB2LnBhbmVhLmZpeGVkXG4gICAgbmV4dFZpc0ZsZXg6IChoKSAtPiBAdHJhdk5leHQgaCwgKHYpIC0+IG5vdCB2LnBhbmViLmNvbGxhcHNlZCBhbmQgbm90IHYucGFuZWIuZml4ZWQgXG4gICAgcHJldkZsZXg6ICAgIChoKSAtPiBAdHJhdlByZXYgaCwgKHYpIC0+IG5vdCB2LnBhbmVhLmZpeGVkXG4gICAgbmV4dEZsZXg6ICAgIChoKSAtPiBAdHJhdk5leHQgaCwgKHYpIC0+IG5vdCB2LnBhbmViLmZpeGVkIFxuICAgIHByZXZWaXM6ICAgICAoaCkgLT4gQHRyYXZQcmV2IGgsICh2KSAtPiBub3Qgdi5wYW5lYS5jb2xsYXBzZWQgXG4gICAgbmV4dFZpczogICAgIChoKSAtPiBAdHJhdk5leHQgaCwgKHYpIC0+IG5vdCB2LnBhbmViLmNvbGxhcHNlZCBcbiAgICBwcmV2QWxsSW52OiAgKGgpIC0+IHAgPSBub3QgQHByZXZWaXMoaCkgYW5kIGgucGFuZWEgb3IgbnVsbDsgcD8uZXhwYW5kKCk7IHBcbiAgICBuZXh0QWxsSW52OiAgKGgpIC0+IHAgPSBub3QgQG5leHRWaXMoaCkgYW5kIGgucGFuZWIgb3IgbnVsbDsgcD8uZXhwYW5kKCk7IHBcbiAgICAgICAgXG5tb2R1bGUuZXhwb3J0cyA9IEZsZXhcbiJdfQ==
//# sourceURL=../../coffee/flex/flex.coffee