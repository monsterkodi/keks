// koffee 1.4.0

/*
00     00  00000000  000   000  000   000
000   000  000       0000  000  000   000
000000000  0000000   000 0 000  000   000
000 0 000  000       000  0000  000   000
000   000  00000000  000   000   0000000
 */
var _, empty, filelist, keyinfo, klog, noon, os, post, ref, slash, template;

ref = require('kxk'), filelist = ref.filelist, keyinfo = ref.keyinfo, empty = ref.empty, klog = ref.klog, noon = ref.noon, post = ref.post, slash = ref.slash, os = ref.os, _ = ref._;

template = function(obj) {
    var item, menuOrAccel, text, tmpl;
    tmpl = [];
    for (text in obj) {
        menuOrAccel = obj[text];
        tmpl.push((function() {
            switch (false) {
                case !(empty(menuOrAccel) && text.startsWith('-')):
                    return {
                        text: ''
                    };
                case !_.isNumber(menuOrAccel):
                    return {
                        text: text,
                        accel: kstr(menuOrAccel)
                    };
                case !_.isString(menuOrAccel):
                    return {
                        text: text,
                        accel: keyinfo.convertCmdCtrl(menuOrAccel)
                    };
                case !empty(menuOrAccel):
                    return {
                        text: text,
                        accel: ''
                    };
                default:
                    if ((menuOrAccel.accel != null) || (menuOrAccel.command != null)) {
                        item = _.clone(menuOrAccel);
                        item.text = text;
                        return item;
                    } else {
                        return {
                            text: text,
                            menu: template(menuOrAccel)
                        };
                    }
            }
        })());
    }
    return tmpl;
};

module.exports = function() {
    var actionFile, actionFiles, actions, combo, editMenu, item, j, k, key, len, mainMenu, menu, menuAction, menuName, name, ref1, ref2, ref3, submenu, v, value;
    mainMenu = template(noon.load(__dirname + '../../../coffee/menu.noon'));
    editMenu = {
        text: 'Edit',
        menu: [
            {
                text: 'Undo',
                accel: 'ctrl+z'
            }, {
                text: 'Redo',
                accel: 'ctrl+shift+z'
            }, {
                text: '-'
            }, {
                text: 'Cut',
                accel: 'ctrl+x'
            }, {
                text: 'Copy',
                accel: 'ctrl+c'
            }, {
                text: 'Paste',
                accel: 'ctrl+v'
            }
        ]
    };
    actionFiles = filelist(slash.join(__dirname, '../editor/actions'));
    submenu = {
        Misc: []
    };
    for (j = 0, len = actionFiles.length; j < len; j++) {
        actionFile = actionFiles[j];
        if ((ref1 = slash.ext(actionFile)) !== 'js' && ref1 !== 'coffee') {
            continue;
        }
        actions = require(actionFile);
        for (key in actions) {
            value = actions[key];
            menuName = 'Misc';
            if (key === 'actions') {
                if (value['menu'] != null) {
                    menuName = value['menu'];
                    if (submenu[menuName] != null) {
                        submenu[menuName];
                    } else {
                        submenu[menuName] = [];
                    }
                }
                for (k in value) {
                    v = value[k];
                    if (v.name && v.combo) {
                        menuAction = function(c) {
                            return function(i, win) {
                                return post.toWin(win.id, 'menuAction', c);
                            };
                        };
                        combo = v.combo;
                        if (os.platform() !== 'darwin' && v.accel) {
                            combo = v.accel;
                        }
                        item = {
                            text: v.name,
                            accel: combo
                        };
                        if (v.menu != null) {
                            if (submenu[name = v.menu] != null) {
                                submenu[name];
                            } else {
                                submenu[name] = [];
                            }
                        }
                        if (v.separator) {
                            submenu[(ref2 = v.menu) != null ? ref2 : menuName].push({
                                text: ''
                            });
                        }
                        submenu[(ref3 = v.menu) != null ? ref3 : menuName].push(item);
                    }
                }
                submenu[menuName].push({
                    text: ''
                });
            }
        }
    }
    for (key in submenu) {
        menu = submenu[key];
        editMenu.menu.push({
            text: key,
            menu: menu
        });
    }
    return [mainMenu[0], editMenu, mainMenu[2]];
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBK0QsT0FBQSxDQUFRLEtBQVIsQ0FBL0QsRUFBRSx1QkFBRixFQUFZLHFCQUFaLEVBQXFCLGlCQUFyQixFQUE0QixlQUE1QixFQUFrQyxlQUFsQyxFQUF3QyxlQUF4QyxFQUE4QyxpQkFBOUMsRUFBcUQsV0FBckQsRUFBeUQ7O0FBR3pELFFBQUEsR0FBVyxTQUFDLEdBQUQ7QUFFUCxRQUFBO0lBQUEsSUFBQSxHQUFPO0FBQ1AsU0FBQSxXQUFBOztRQUNJLElBQUksQ0FBQyxJQUFMO0FBQVUsb0JBQUEsS0FBQTtBQUFBLHVCQUNELEtBQUEsQ0FBTSxXQUFOLENBQUEsSUFBdUIsSUFBSSxDQUFDLFVBQUwsQ0FBZ0IsR0FBaEIsRUFEdEI7MkJBRUY7d0JBQUEsSUFBQSxFQUFNLEVBQU47O0FBRkUsc0JBR0QsQ0FBQyxDQUFDLFFBQUYsQ0FBVyxXQUFYLENBSEM7MkJBSUY7d0JBQUEsSUFBQSxFQUFLLElBQUw7d0JBQ0EsS0FBQSxFQUFNLElBQUEsQ0FBSyxXQUFMLENBRE47O0FBSkUsc0JBTUQsQ0FBQyxDQUFDLFFBQUYsQ0FBVyxXQUFYLENBTkM7MkJBT0Y7d0JBQUEsSUFBQSxFQUFLLElBQUw7d0JBQ0EsS0FBQSxFQUFNLE9BQU8sQ0FBQyxjQUFSLENBQXVCLFdBQXZCLENBRE47O0FBUEUsc0JBU0QsS0FBQSxDQUFNLFdBQU4sQ0FUQzsyQkFVRjt3QkFBQSxJQUFBLEVBQUssSUFBTDt3QkFDQSxLQUFBLEVBQU8sRUFEUDs7QUFWRTtvQkFhRixJQUFHLDJCQUFBLElBQXNCLDZCQUF6Qjt3QkFDSSxJQUFBLEdBQU8sQ0FBQyxDQUFDLEtBQUYsQ0FBUSxXQUFSO3dCQUNQLElBQUksQ0FBQyxJQUFMLEdBQVk7K0JBQ1osS0FISjtxQkFBQSxNQUFBOytCQUtJOzRCQUFBLElBQUEsRUFBSyxJQUFMOzRC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akM7QUFqRGEiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwICAgICAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgIDAwMFxuMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDBcbjAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAgMDAwXG4wMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG4jIyNcblxueyBmaWxlbGlzdCwga2V5aW5mbywgZW1wdHksIGtsb2csIG5vb24sIHBvc3QsIHNsYXNoLCBvcywgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5cbnRlbXBsYXRlID0gKG9iaikgLT5cbiAgICBcbiAgICB0bXBsID0gW11cbiAgICBmb3IgdGV4dCxtZW51T3JBY2NlbCBvZiBvYmpcbiAgICAgICAgdG1wbC5wdXNoIHN3aXRjaFxuICAgICAgICAgICAgd2hlbiBlbXB0eShtZW51T3JBY2NlbCkgYW5kIHRleHQuc3RhcnRzV2l0aCAnLSdcbiAgICAgICAgICAgICAgICB0ZXh0OiAnJ1xuICAgICAgICAgICAgd2hlbiBfLmlzTnVtYmVyIG1lbnVPckFjY2VsXG4gICAgICAgICAgICAgICAgdGV4dDp0ZXh0XG4gICAgICAgICAgICAgICAgYWNjZWw6a3N0ciBtZW51T3JBY2NlbFxuICAgICAgICAgICAgd2hlbiBfLmlzU3RyaW5nIG1lbnVPckFjY2VsXG4gICAgICAgICAgICAgICAgdGV4dDp0ZXh0XG4gICAgICAgICAgICAgICAgYWNjZWw6a2V5aW5mby5jb252ZXJ0Q21kQ3RybCBtZW51T3JBY2NlbFxuICAgICAgICAgICAgd2hlbiBlbXB0eSBtZW51T3JBY2NlbFxuICAgICAgICAgICAgICAgIHRleHQ6dGV4dFxuICAgICAgICAgICAgICAgIGFjY2VsOiAnJ1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGlmIG1lbnVPckFjY2VsLmFjY2VsPyBvciBtZW51T3JBY2NlbC5jb21tYW5kPyAjIG5lZWRzIGJldHRlciB0ZXN0IVxuICAgICAgICAgICAgICAgICAgICBpdGVtID0gXy5jbG9uZSBtZW51T3JBY2NlbFxuICAgICAgICAgICAgICAgICAgICBpdGVtLnRleHQgPSB0ZXh0XG4gICAgICAgICAgICAgICAgICAgIGl0ZW1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6dGV4dFxuICAgICAgICAgICAgICAgICAgICBtZW51OnRlbXBsYXRlIG1lbnVPckFjY2VsXG4gICAgdG1wbFxuXG5tb2R1bGUuZXhwb3J0cyA9IC0+XG5cbiAgICBtYWluTWVudSA9IHRlbXBsYXRlIG5vb24ubG9hZCBfX2Rpcm5hbWUgKyAnLi4vLi4vLi4vY29mZmVlL21lbnUubm9vbidcbiAgICBcbiAgICBlZGl0TWVudSA9IHRleHQ6J0VkaXQnIG1lbnU6W1xuICAgICAgICB0ZXh0OidVbmRvJyAgYWNjZWw6J2N0cmwreidcbiAgICAsXG4gICAgICAgIHRleHQ6J1JlZG8nICBhY2NlbDonY3RybCtzaGlmdCt6J1xuICAgICxcbiAgICAgICAgdGV4dDonLScgICAgIFxuICAgICxcbiAgICAgICAgdGV4dDonQ3V0JyAgIGFjY2VsOidjdHJsK3gnXG4gICAgLFxuICAgICAgICB0ZXh0OidDb3B5JyAgYWNjZWw6J2N0cmwrYydcbiAgICAsXG4gICAgICAgIHRleHQ6J1Bhc3RlJyBhY2NlbDonY3RybCt2J1xuICAgIF1cblxuICAgIGFjdGlvbkZpbGVzID0gZmlsZWxpc3Qgc2xhc2guam9pbiBfX2Rpcm5hbWUsICcuLi9lZGl0b3IvYWN0aW9ucydcbiAgICBzdWJtZW51ID0gTWlzYzogW11cblxuICAgIGZvciBhY3Rpb25GaWxlIGluIGFjdGlvbkZpbGVzXG4gICAgICAgIGNvbnRpbnVlIGlmIHNsYXNoLmV4dChhY3Rpb25GaWxlKSBub3QgaW4gWydqcycgJ2NvZmZlZSddXG4gICAgICAgIGFjdGlvbnMgPSByZXF1aXJlIGFjdGlvbkZpbGVcbiAgICAgICAgZm9yIGtleSx2YWx1ZSBvZiBhY3Rpb25zXG4gICAgICAgICAgICBtZW51TmFtZSA9ICdNaXNjJ1xuICAgICAgICAgICAgaWYga2V5ID09ICdhY3Rpb25zJ1xuICAgICAgICAgICAgICAgIGlmIHZhbHVlWydtZW51J10/XG4gICAgICAgICAgICAgICAgICAgIG1lbnVOYW1lID0gdmFsdWVbJ21lbnUnXVxuICAgICAgICAgICAgICAgICAgICBzdWJtZW51W21lbnVOYW1lXSA/PSBbXVxuICAgICAgICAgICAgICAgIGZvciBrLHYgb2YgdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgaWYgdi5uYW1lIGFuZCB2LmNvbWJvXG4gICAgICAgICAgICAgICAgICAgICAgICBtZW51QWN0aW9uID0gKGMpIC0+IChpLHdpbikgLT4gcG9zdC50b1dpbiB3aW4uaWQsICdtZW51QWN0aW9uJywgY1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tYm8gPSB2LmNvbWJvXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBvcy5wbGF0Zm9ybSgpICE9ICdkYXJ3aW4nIGFuZCB2LmFjY2VsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tYm8gPSB2LmFjY2VsXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiAgIHYubmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjY2VsOiAgY29tYm9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIHYubWVudT9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJtZW51W3YubWVudV0gPz0gW11cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIHYuc2VwYXJhdG9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VibWVudVt2Lm1lbnUgPyBtZW51TmFtZV0ucHVzaCB0ZXh0OiAnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VibWVudVt2Lm1lbnUgPyBtZW51TmFtZV0ucHVzaCBpdGVtXG4gICAgICAgICAgICAgICAgc3VibWVudVttZW51TmFtZV0ucHVzaCB0ZXh0OiAnJ1xuXG4gICAgZm9yIGtleSwgbWVudSBvZiBzdWJtZW51XG4gICAgICAgIGVkaXRNZW51Lm1lbnUucHVzaCB0ZXh0OmtleSwgbWVudTptZW51XG5cbiAgICBbbWFpbk1lbnVbMF0sIGVkaXRNZW51LCBtYWluTWVudVsyXV1cblxuIl19
//# sourceURL=../../coffee/editor/menu.coffee