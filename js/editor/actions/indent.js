// koffee 1.4.0
module.exports = {
    actions: {
        menu: 'Line',
        indent: {
            separator: true,
            name: 'Indent',
            combo: 'command+]',
            accel: 'ctrl+]'
        },
        deIndent: {
            name: 'Outdent',
            combo: 'command+[',
            accel: 'ctrl+['
        }
    },
    indent: function() {
        var i, j, k, l, len, len1, len2, nc, newCursors, newSelections, ns, ref, ref1, ref2;
        this["do"].start();
        newSelections = this["do"].selections();
        newCursors = this["do"].cursors();
        ref = this.selectedAndCursorLineIndices();
        for (j = 0, len = ref.length; j < len; j++) {
            i = ref[j];
            this["do"].change(i, this.indentString + this["do"].line(i));
            ref1 = positionsAtLineIndexInPositions(i, newCursors);
            for (k = 0, len1 = ref1.length; k < len1; k++) {
                nc = ref1[k];
                cursorDelta(nc, this.indentString.length);
            }
            ref2 = rangesAtLineIndexInRanges(i, newSelections);
            for (l = 0, len2 = ref2.length; l < len2; l++) {
                ns = ref2[l];
                ns[1][0] += this.indentString.length;
                ns[1][1] += this.indentString.length;
            }
        }
        this["do"].select(newSelections);
        this["do"].setCursors(newCursors);
        return this["do"].end();
    },
    deIndent: function() {
        var i, j, k, l, len, len1, len2, lineCursors, nc, newCursors, newSelections, ns, ref, ref1;
        this["do"].start();
        newSelections = this["do"].selections();
        newCursors = this["do"].cursors();
        ref = this.selectedAndCursorLineIndices();
        for (j = 0, len = ref.length; j < len; j++) {
            i = ref[j];
            if (this["do"].line(i).startsWith(this.indentString)) {
                this["do"].change(i, this["do"].line(i).substr(this.indentString.length));
                lineCursors = positionsAtLineIndexInPositions(i, newCursors);
                for (k = 0, len1 = lineCursors.length; k < len1; k++) {
                    nc = lineCursors[k];
                    cursorDelta(nc, -this.indentString.length);
                }
                ref1 = rangesAtLineIndexInRanges(i, newSelections);
                for (l = 0, len2 = ref1.length; l < len2; l++) {
                    ns = ref1[l];
                    ns[1][0] -= this.indentString.length;
                    ns[1][1] -= this.indentString.length;
                }
            }
        }
        this["do"].select(newSelections);
        this["do"].setCursors(newCursors);
        return this["do"].end();
    }
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZW50LmpzIiwic291cmNlUm9vdCI6Ii4iLCJzb3VyY2VzIjpbIiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBT0EsTUFBTSxDQUFDLE9BQVAsR0FFSTtJQUFBLE9BQUEsRUFDSTtRQUFBLElBQUEsRUFBTSxNQUFOO1FBRUEsTUFBQSxFQUNJO1lBQUEsU0FBQSxFQUFXLElBQVg7WUFDQSxJQUFBLEVBQU8sUUFEUDtZQUVBLEtBQUEsRUFBTyxXQUZQO1lBR0EsS0FBQSxFQUFPLFFBSFA7U0FISjtRQVFBLFFBQUEsRUFDSTtZQUFBLElBQUEsRUFBTyxTQUFQO1lBQ0EsS0FBQSxFQUFPLFdBRFA7WUFFQSxLQUFBLEVBQU8sUUFGUDtTQVRKO0tBREo7SUFjQSxNQUFBLEVBQVEsU0FBQTtBQUNKLFlBQUE7UUFBQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsS0FBSixDQUFBO1FBQ0EsYUFBQSxHQUFnQixJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsVUFBSixDQUFBO1FBQ2hCLFVBQUEsR0FBZ0IsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLE9BQUosQ0FBQTtBQUNoQjtBQUFBLGFBQUEscUNBQUE7O1lBQ0ksSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLE1BQUosQ0FBVyxDQUFYLEVBQWMsSUFBQyxDQUFBLFlBQUQsR0FBZ0IsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLElBQUosQ0FBUyxDQUFULENBQTlCO0FBQ0E7QUFBQSxpQkFBQSx3Q0FBQTs7Z0JBQ0ksV0FBQSxDQUFZLEVBQVosRUFBZ0IsSUFBQyxDQUFBLFlBQVksQ0FBQyxNQUE5QjtBQURKO0FBRUE7QUFBQSxpQkFBQSx3Q0FBQTs7Z0JBQ0ksRUFBRyxDQUFBLENBQUEsQ0FBRyxDQUFBLENBQUEsQ0FBTixJQUFZLElBQUMsQ0FBQSxZQUFZLENBQUM7Z0JBQzFCLEVBQUcsQ0FBQSxDQUFBLENBQUcsQ0FBQSxDQUFBLENBQU4sSUFBWSxJQUFDLENBQUEsWUFBWSxDQUFDO0FBRjlCO0FBSko7UUFPQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsTUFBSixDQUFXLGFBQVg7UUFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsVUFBSixDQUFlLFVBQWY7ZUFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsR0FBSixDQUFBO0lBYkksQ0FkUjtJQTZCQSxRQUFBLEVBQVUsU0FBQTtBQUNOLFlBQUE7UUFBQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsS0FBSixDQUFBO1FBQ0EsYUFBQSxHQUFnQixJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsVUFBSixDQUFBO1FBQ2hCLFVBQUEsR0FBZ0IsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLE9BQUosQ0FBQTtBQUNoQjtBQUFBLGFBQUEscUNBQUE7O1lBQ0ksSUFBRyxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsSUFBSixDQUFTLENBQVQsQ0FBVyxDQUFDLFVBQVosQ0FBdUIsSUFBQyxDQUFBLFlBQXhCLENBQUg7Z0JBQ0ksSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLE1BQUosQ0FBVyxDQUFYLEVBQWMsSUFBQyxFQUFBLEVBQUEsRUFBRSxDQUFDLElBQUosQ0FBUyxDQUFULENBQVcsQ0FBQyxNQUFaLENBQW1CLElBQUMsQ0FBQSxZQUFZLENBQUMsTUFBakMsQ0FBZDtnQkFDQSxXQUFBLEdBQWMsK0JBQUEsQ0FBZ0MsQ0FBaEMsRUFBbUMsVUFBbkM7QUFDZCxxQkFBQSwrQ0FBQTs7b0JBQ0ksV0FBQSxDQUFZLEVBQVosRUFBZ0IsQ0FBQyxJQUFDLENBQUEsWUFBWSxDQUFDLE1BQS9CO0FBREo7QUFFQTtBQUFBLHFCQUFBLHdDQUFBOztvQkFDSSxFQUFHLENBQUEsQ0FBQSxDQUFHLENBQUEsQ0FBQSxDQUFOLElBQVksSUFBQyxDQUFBLFlBQVksQ0FBQztvQkFDMUIsRUFBRyxDQUFBLENBQUEsQ0FBRyxDQUFBLENBQUEsQ0FBTixJQUFZLElBQUMsQ0FBQSxZQUFZLENBQUM7QUFGOUIsaUJBTEo7O0FBREo7UUFTQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsTUFBSixDQUFXLGFBQVg7UUFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsVUFBSixDQUFlLFVBQWY7ZUFDQSxJQUFDLEVBQUEsRUFBQSxFQUFFLENBQUMsR0FBSixDQUFBO0lBZk0sQ0E3QlYiLCJzb3VyY2VzQ29udGVudCI6WyJcbiMgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4jIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgICAgIDAwMCAgIFxuIyAwMDAgIDAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgMDAwIDAgMDAwICAgICAwMDAgICBcbiMgMDAwICAwMDAgIDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgICAgMDAwICAgXG4jIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAgIDAwMCAgIFxuXG5tb2R1bGUuZXhwb3J0cyA9XG4gICAgICBcbiAgICBhY3Rpb25zOiBcbiAgICAgICAgbWVudTogJ0xpbmUnXG4gICAgICAgIFxuICAgICAgICBpbmRlbnQ6XG4gICAgICAgICAgICBzZXBhcmF0b3I6IHRydWVcbiAgICAgICAgICAgIG5hbWU6ICAnSW5kZW50J1xuICAgICAgICAgICAgY29tYm86ICdjb21tYW5kK10nXG4gICAgICAgICAgICBhY2NlbDogJ2N0cmwrXSdcbiAgICAgICAgICAgIFxuICAgICAgICBkZUluZGVudDpcbiAgICAgICAgICAgIG5hbWU6ICAnT3V0ZGVudCdcbiAgICAgICAgICAgIGNvbWJvOiAnY29tbWFuZCtbJ1xuICAgICAgICAgICAgYWNjZWw6ICdjdHJsK1snXG4gICAgICAgICAgICBcbiAgICBpbmRlbnQ6IC0+XG4gICAgICAgIEBkby5zdGFydCgpXG4gICAgICAgIG5ld1NlbGVjdGlvbnMgPSBAZG8uc2VsZWN0aW9ucygpXG4gICAgICAgIG5ld0N1cnNvcnMgICAgPSBAZG8uY3Vyc29ycygpXG4gICAgICAgIGZvciBpIGluIEBzZWxlY3RlZEFuZEN1cnNvckxpbmVJbmRpY2VzKClcbiAgICAgICAgICAgIEBkby5jaGFuZ2UgaSwgQGluZGVudFN0cmluZyArIEBkby5saW5lKGkpXG4gICAgICAgICAgICBmb3IgbmMgaW4gcG9zaXRpb25zQXRMaW5lSW5kZXhJblBvc2l0aW9ucyBpLCBuZXdDdXJzb3JzXG4gICAgICAgICAgICAgICAgY3Vyc29yRGVsdGEgbmMsIEBpbmRlbnRTdHJpbmcubGVuZ3RoXG4gICAgICAgICAgICBmb3IgbnMgaW4gcmFuZ2VzQXRMaW5lSW5kZXhJblJhbmdlcyBpLCBuZXdTZWxlY3Rpb25zXG4gICAgICAgICAgICAgICAgbnNbMV1bMF0gKz0gQGluZGVudFN0cmluZy5sZW5ndGhcbiAgICAgICAgICAgICAgICBuc1sxXVsxXSArPSBAaW5kZW50U3RyaW5nLmxlbmd0aFxuICAgICAgICBAZG8uc2VsZWN0IG5ld1NlbGVjdGlvbnNcbiAgICAgICAgQGRvLnNldEN1cnNvcnMgbmV3Q3Vyc29yc1xuICAgICAgICBAZG8uZW5kKClcblxuICAgIGRlSW5kZW50OiAtPiBcbiAgICAgICAgQGRvLnN0YXJ0KClcbiAgICAgICAgbmV3U2VsZWN0aW9ucyA9IEBkby5zZWxlY3Rpb25zKClcbiAgICAgICAgbmV3Q3Vyc29ycyAgICA9IEBkby5jdXJzb3JzKClcbiAgICAgICAgZm9yIGkgaW4gQHNlbGVjdGVkQW5kQ3Vyc29yTGluZUluZGljZXMoKVxuICAgICAgICAgICAgaWYgQGRvLmxpbmUoaSkuc3RhcnRzV2l0aCBAaW5kZW50U3RyaW5nXG4gICAgICAgICAgICAgICAgQGRvLmNoYW5nZSBpLCBAZG8ubGluZShpKS5zdWJzdHIgQGluZGVudFN0cmluZy5sZW5ndGhcbiAgICAgICAgICAgICAgICBsaW5lQ3Vyc29ycyA9IHBvc2l0aW9uc0F0TGluZUluZGV4SW5Qb3NpdGlvbnMgaSwgbmV3Q3Vyc29yc1xuICAgICAgICAgICAgICAgIGZvciBuYyBpbiBsaW5lQ3Vyc29yc1xuICAgICAgICAgICAgICAgICAgICBjdXJzb3JEZWx0YSBuYywgLUBpbmRlbnRTdHJpbmcubGVuZ3RoXG4gICAgICAgICAgICAgICAgZm9yIG5zIGluIHJhbmdlc0F0TGluZUluZGV4SW5SYW5nZXMgaSwgbmV3U2VsZWN0aW9uc1xuICAgICAgICAgICAgICAgICAgICBuc1sxXVswXSAtPSBAaW5kZW50U3RyaW5nLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICBuc1sxXVsxXSAtPSBAaW5kZW50U3RyaW5nLmxlbmd0aFxuICAgICAgICBAZG8uc2VsZWN0IG5ld1NlbGVjdGlvbnNcbiAgICAgICAgQGRvLnNldEN1cnNvcnMgbmV3Q3Vyc29yc1xuICAgICAgICBAZG8uZW5kKClcbiJdfQ==
//# sourceURL=../../../coffee/editor/actions/indent.coffee