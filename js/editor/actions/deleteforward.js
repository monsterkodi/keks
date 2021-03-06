// koffee 1.4.0
var reversed;

reversed = require('kxk').reversed;

module.exports = {
    actions: {
        menu: 'Delete',
        deleteForward: {
            separator: true,
            name: 'Delete Forward',
            combo: 'delete',
            text: 'delete character to the right'
        },
        deleteToEndOfLine: {
            name: 'Delete to End of Line',
            combo: 'ctrl+shift+k',
            text: 'delete characters to the end of line'
        },
        deleteToEndOfLineOrWholeLine: {
            name: 'Delete to End of Line or Delete Whole Line',
            combo: 'ctrl+k',
            text: "delete characters to the end of line, if cursor is not at end of line.\ndelete whole line otherwise."
        }
    },
    deleteToEndOfLine: function() {
        this["do"].start();
        this.moveCursorsToLineBoundary('right', {
            extend: true
        });
        this.deleteSelection({
            deleteLines: false
        });
        return this["do"].end();
    },
    deleteToEndOfLineOrWholeLine: function() {
        var c, cursors, i, len;
        cursors = this["do"].isDoing() && this["do"].cursors() || this.cursors();
        for (i = 0, len = cursors.length; i < len; i++) {
            c = cursors[i];
            if (c[0] !== 0 && !this.isCursorAtEndOfLine(c)) {
                return this.deleteToEndOfLine();
            }
        }
        this["do"].start();
        this.selectMoreLines();
        this.deleteSelection({
            deleteLines: true
        });
        return this["do"].end();
    },
    deleteForward: function() {
        var c, i, j, k, l, len, len1, len2, len3, ll, nc, newCursors, ref, ref1, ref2, ref3;
        if (this.numSelections()) {
            return this.deleteSelection();
        } else {
            this["do"].start();
            newCursors = this["do"].cursors();
            ref = reversed(newCursors);
            for (i = 0, len = ref.length; i < len; i++) {
                c = ref[i];
                if (this.isCursorAtEndOfLine(c)) {
                    if (!this.isCursorInLastLine(c)) {
                        ll = this.line(c[1]).length;
                        this["do"].change(c[1], this["do"].line(c[1]) + this["do"].line(c[1] + 1));
                        this["do"]["delete"](c[1] + 1);
                        ref1 = positionsAtLineIndexInPositions(c[1] + 1, newCursors);
                        for (j = 0, len1 = ref1.length; j < len1; j++) {
                            nc = ref1[j];
                            cursorDelta(nc, ll, -1);
                        }
                        ref2 = positionsBelowLineIndexInPositions(c[1] + 1, newCursors);
                        for (k = 0, len2 = ref2.length; k < len2; k++) {
                            nc = ref2[k];
                            cursorDelta(nc, 0, -1);
                        }
                    }
                } else {
                    this["do"].change(c[1], this["do"].line(c[1]).splice(c[0], 1));
                    ref3 = positionsAtLineIndexInPositions(c[1], newCursors);
                    for (l = 0, len3 = ref3.length; l < len3; l++) {
                        nc = ref3[l];
                        if (nc[0] > c[0]) {
                            cursorDelta(nc, -1);
                        }
                    }
                }
            }
            this["do"].setCursors(newCursors);
            return this["do"].end();
        }
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVsZXRlZm9yd2FyZC5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQU9BLElBQUE7O0FBQUUsV0FBYSxPQUFBLENBQVEsS0FBUjs7QUFFZixNQUFNLENBQUMsT0FBUCxHQUVJO0lBQUEsT0FBQSxFQUNJO1FBQUEsSUFBQSxFQUFNLFFBQU47UUFFQSxhQUFBLEVBQ0k7WUFBQSxTQUFBLEVBQVcsSUFBWDtZQUNBLElBQUEsRUFBUSxnQkFEUjtZQUVBLEtBQUEsRUFBUSxRQUZSO1lBR0EsSUFBQSxFQUFRLCtCQUhSO1NBSEo7UUFRQSxpQkFBQSxFQUNJO1lBQUEsSUFBQSxFQUFRLHVCQUFSO1lBQ0EsS0FBQSxFQUFRLGNBRFI7WUFFQSxJQUFBLEVBQVEsc0NBRlI7U0FUSjtRQWFBLDRCQUFBLEVBQ0k7WUFBQSxJQUFBLEVBQVEsNENBQVI7WUFDQSxLQUFBLEVBQVEsUUFEUjtZQUVBLElBQUEsRUFBUSxzR0FGUjtTQWRKO0tBREo7SUFxQkEsaUJBQUEsRUFBbUIsU0FBQTtRQUVmLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxLQUFKLENBQUE7UUFDQSxJQUFDLENBQUEseUJBQUQsQ0FBMkIsT0FBM0IsRUFBb0M7WUFBQSxNQUFBLEVBQU8sSUFBUDtTQUFwQztRQUNBLElBQUMsQ0FBQSxlQUFELENBQWlCO1lBQUEsV0FBQSxFQUFZLEtBQVo7U0FBakI7ZUFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsR0FBSixDQUFBO0lBTGUsQ0FyQm5CO0lBNEJBLDRCQUFBLEVBQThCLFNBQUE7QUFFMUIsWUFBQTtRQUFBLE9BQUEsR0FBVSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsT0FBSixDQUFBLENBQUEsSUFBa0IsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLE9BQUosQ0FBQSxDQUFsQixJQUFtQyxJQUFDLENBQUEsT0FBRCxDQUFBO0FBQzdDLGFBQUEseUNBQUE7O1lBQ0ksSUFBRyxDQUFFLENBQUEsQ0FBQSxDQUFGLEtBQVEsQ0FBUixJQUFjLENBQUksSUFBQyxDQUFBLG1CQUFELENBQXFCLENBQXJCLENBQXJCO0FBQ0ksdUJBQU8sSUFBQyxDQUFBLGlCQUFELENBQUEsRUFEWDs7QUFESjtRQUlBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxLQUFKLENBQUE7UUFDQSxJQUFDLENBQUEsZUFBRCxDQUFBO1FBQ0EsSUFBQyxDQUFBLGVBQUQsQ0FBaUI7WUFBQSxXQUFBLEVBQVksSUFBWjtTQUFqQjtlQUNBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxHQUFKLENBQUE7SUFWMEIsQ0E1QjlCO0lBd0NBLGFBQUEsRUFBZSxTQUFBO0FBRVgsWUFBQTtRQUFBLElBQUcsSUFBQyxDQUFBLGFBQUQsQ0FBQSxDQUFIO21CQUNJLElBQUMsQ0FBQSxlQUFELENBQUEsRUFESjtTQUFBLE1BQUE7WUFHSSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsS0FBSixDQUFBO1lBQ0EsVUFBQSxHQUFhLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxPQUFKLENBQUE7QUFDYjtBQUFBLGlCQUFBLHFDQUFBOztnQkFFSSxJQUFHLElBQUMsQ0FBQSxtQkFBRCxDQUFxQixDQUFyQixDQUFIO29CQUNJLElBQUcsQ0FBSSxJQUFDLENBQUEsa0JBQUQsQ0FBb0IsQ0FBcEIsQ0FBUDt3QkFFSSxFQUFBLEdBQUssSUFBQyxDQUFBLElBQUQsQ0FBTSxDQUFFLENBQUEsQ0FBQSxDQUFSLENBQVcsQ0FBQzt3QkFFakIsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLE1BQUosQ0FBVyxDQUFFLENBQUEsQ0FBQSxDQUFiLEVBQWlCLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxJQUFKLENBQVMsQ0FBRSxDQUFBLENBQUEsQ0FBWCxDQUFBLEdBQWlCLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxJQUFKLENBQVMsQ0FBRSxDQUFBLENBQUEsQ0FBRixHQUFLLENBQWQsQ0FBbEM7d0JBQ0EsSUFBQyxFQUFBLEVBQUEsRUFBRSxFQUFDLE1BQUQsRUFBSCxDQUFXLENBQUUsQ0FBQSxDQUFBLENBQUYsR0FBSyxDQUFoQjtBQUdBO0FBQUEsNkJBQUEsd0NBQUE7OzRCQUNJLFdBQUEsQ0FBWSxFQUFaLEVBQWdCLEVBQWhCLEVBQW9CLENBQUMsQ0FBckI7QUFESjtBQUdBO0FBQUEsNkJBQUEsd0NBQUE7OzRCQUNJLFdBQUEsQ0FBWSxFQUFaLEVBQWdCLENBQWhCLEVBQW1CLENBQUMsQ0FBcEI7QUFESix5QkFYSjtxQkFESjtpQkFBQSxNQUFBO29CQWVJLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxNQUFKLENBQVcsQ0FBRSxDQUFBLENBQUEsQ0FBYixFQUFpQixJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsSUFBSixDQUFTLENBQUUsQ0FBQSxDQUFBLENBQVgsQ0FBYyxDQUFDLE1BQWYsQ0FBc0IsQ0FBRSxDQUFBLENBQUEsQ0FBeEIsRUFBNEIsQ0FBNUIsQ0FBakI7QUFDQTtBQUFBLHlCQUFBLHdDQUFBOzt3QkFDSSxJQUFHLEVBQUcsQ0FBQSxDQUFBLENBQUgsR0FBUSxDQUFFLENBQUEsQ0FBQSxDQUFiOzRCQUNJLFdBQUEsQ0FBWSxFQUFaLEVBQWdCLENBQUMsQ0FBakIsRUFESjs7QUFESixxQkFoQko7O0FBRko7WUFzQkEsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLFVBQUosQ0FBZSxVQUFmO21CQUNBLElBQUMsRUFBQSxFQUFBLEVBQUUsQ0FBQyxHQUFKLENBQUEsRUE1Qko7O0lBRlcsQ0F4Q2YiLCJzb3VyY2VzQ29udGVudCI6WyJcbiMgMDAwMDAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAgICAwMDAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwMDAwICAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAwMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwMDAwMCAgICAwMDAgICAwMDBcbiMgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbiMgMDAwICAgICAgICAwMDAwMDAwICAgMDAwICAgMDAwICAwMCAgICAgMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICBcblxueyByZXZlcnNlZCB9ID0gcmVxdWlyZSAna3hrJyBcblxubW9kdWxlLmV4cG9ydHMgPVxuICAgIFxuICAgIGFjdGlvbnM6XG4gICAgICAgIG1lbnU6ICdEZWxldGUnXG4gICAgICAgIFxuICAgICAgICBkZWxldGVGb3J3YXJkOlxuICAgICAgICAgICAgc2VwYXJhdG9yOiB0cnVlXG4gICAgICAgICAgICBuYW1lOiAgICdEZWxldGUgRm9yd2FyZCdcbiAgICAgICAgICAgIGNvbWJvOiAgJ2RlbGV0ZSdcbiAgICAgICAgICAgIHRleHQ6ICAgJ2RlbGV0ZSBjaGFyYWN0ZXIgdG8gdGhlIHJpZ2h0J1xuXG4gICAgICAgIGRlbGV0ZVRvRW5kT2ZMaW5lOlxuICAgICAgICAgICAgbmFtZTogICAnRGVsZXRlIHRvIEVuZCBvZiBMaW5lJ1xuICAgICAgICAgICAgY29tYm86ICAnY3RybCtzaGlmdCtrJ1xuICAgICAgICAgICAgdGV4dDogICAnZGVsZXRlIGNoYXJhY3RlcnMgdG8gdGhlIGVuZCBvZiBsaW5lJ1xuICAgICAgICAgICAgXG4gICAgICAgIGRlbGV0ZVRvRW5kT2ZMaW5lT3JXaG9sZUxpbmU6XG4gICAgICAgICAgICBuYW1lOiAgICdEZWxldGUgdG8gRW5kIG9mIExpbmUgb3IgRGVsZXRlIFdob2xlIExpbmUnXG4gICAgICAgICAgICBjb21ibzogICdjdHJsK2snXG4gICAgICAgICAgICB0ZXh0OiAgIFwiXCJcImRlbGV0ZSBjaGFyYWN0ZXJzIHRvIHRoZSBlbmQgb2YgbGluZSwgaWYgY3Vyc29yIGlzIG5vdCBhdCBlbmQgb2YgbGluZS5cbiAgICAgICAgICAgICAgICBkZWxldGUgd2hvbGUgbGluZSBvdGhlcndpc2UuXG4gICAgICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICAgICAgXG4gICAgZGVsZXRlVG9FbmRPZkxpbmU6IC0+XG4gICAgICAgIFxuICAgICAgICBAZG8uc3RhcnQoKVxuICAgICAgICBAbW92ZUN1cnNvcnNUb0xpbmVCb3VuZGFyeSAncmlnaHQnLCBleHRlbmQ6dHJ1ZVxuICAgICAgICBAZGVsZXRlU2VsZWN0aW9uIGRlbGV0ZUxpbmVzOmZhbHNlXG4gICAgICAgIEBkby5lbmQoKVxuICAgICAgICBcbiAgICBkZWxldGVUb0VuZE9mTGluZU9yV2hvbGVMaW5lOiAtPlxuICAgICAgICBcbiAgICAgICAgY3Vyc29ycyA9IEBkby5pc0RvaW5nKCkgYW5kIEBkby5jdXJzb3JzKCkgb3IgQGN1cnNvcnMoKVxuICAgICAgICBmb3IgYyBpbiBjdXJzb3JzXG4gICAgICAgICAgICBpZiBjWzBdICE9IDAgYW5kIG5vdCBAaXNDdXJzb3JBdEVuZE9mTGluZShjKVxuICAgICAgICAgICAgICAgIHJldHVybiBAZGVsZXRlVG9FbmRPZkxpbmUoKVxuICAgICAgICBcbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgQHNlbGVjdE1vcmVMaW5lcygpXG4gICAgICAgIEBkZWxldGVTZWxlY3Rpb24gZGVsZXRlTGluZXM6dHJ1ZSAgICAgIFxuICAgICAgICBAZG8uZW5kKClcblxuICAgIGRlbGV0ZUZvcndhcmQ6IC0+XG4gICAgICAgIFxuICAgICAgICBpZiBAbnVtU2VsZWN0aW9ucygpXG4gICAgICAgICAgICBAZGVsZXRlU2VsZWN0aW9uKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgICAgIG5ld0N1cnNvcnMgPSBAZG8uY3Vyc29ycygpXG4gICAgICAgICAgICBmb3IgYyBpbiByZXZlcnNlZCBuZXdDdXJzb3JzXG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiBAaXNDdXJzb3JBdEVuZE9mTGluZSBjICMgY3Vyc29yIGF0IGVuZCBvZiBsaW5lXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vdCBAaXNDdXJzb3JJbkxhc3RMaW5lIGMgIyBjdXJzb3Igbm90IGluIGZpcnN0IGxpbmVcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBsbCA9IEBsaW5lKGNbMV0pLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIEBkby5jaGFuZ2UgY1sxXSwgQGRvLmxpbmUoY1sxXSkgKyBAZG8ubGluZShjWzFdKzEpXG4gICAgICAgICAgICAgICAgICAgICAgICBAZG8uZGVsZXRlIGNbMV0rMVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAjIG1vdmUgY3Vyc29ycyBpbiBqb2luZWQgbGluZVxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIG5jIGluIHBvc2l0aW9uc0F0TGluZUluZGV4SW5Qb3NpdGlvbnMgY1sxXSsxLCBuZXdDdXJzb3JzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yRGVsdGEgbmMsIGxsLCAtMVxuICAgICAgICAgICAgICAgICAgICAgICAgIyBtb3ZlIGN1cnNvcnMgYmVsb3cgZGVsZXRlZCBsaW5lIHVwXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgbmMgaW4gcG9zaXRpb25zQmVsb3dMaW5lSW5kZXhJblBvc2l0aW9ucyBjWzFdKzEsIG5ld0N1cnNvcnNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3JEZWx0YSBuYywgMCwgLTFcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIEBkby5jaGFuZ2UgY1sxXSwgQGRvLmxpbmUoY1sxXSkuc3BsaWNlIGNbMF0sIDFcbiAgICAgICAgICAgICAgICAgICAgZm9yIG5jIGluIHBvc2l0aW9uc0F0TGluZUluZGV4SW5Qb3NpdGlvbnMgY1sxXSwgbmV3Q3Vyc29yc1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgbmNbMF0gPiBjWzBdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yRGVsdGEgbmMsIC0xXG5cbiAgICAgICAgICAgIEBkby5zZXRDdXJzb3JzIG5ld0N1cnNvcnNcbiAgICAgICAgICAgIEBkby5lbmQoKVxuIl19
//# sourceURL=../../../coffee/editor/actions/deleteforward.coffee