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
    var actionFile, actionFiles, actions, combo, editMenu, item, j, k, key, len, mainMenu, menu, menuAction, menuName, name, ref1, ref2, ref3, result, submenu, v, value, viewMenu;
    mainMenu = template(noon.load(__dirname + '../../../coffee/menu.noon'));
    viewMenu = {
        text: 'View',
        menu: [
            {
                text: 'Toggle Center Text',
                accel: 'ctrl+\\'
            }, {
                text: 'Toggle Invisibles',
                accel: 'ctrl+i'
            }, {
                text: 'Toggle Pigments',
                accel: 'alt+ctrl+p'
            }
        ]
    };
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
                text: ''
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
                } else {
                    continue;
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
            }
        }
    }
    result = [editMenu];
    for (key in submenu) {
        menu = submenu[key];
        result.push({
            text: key,
            menu: menu
        });
    }
    return result.concat([viewMenu, mainMenu[2]]);
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVudS5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBK0QsT0FBQSxDQUFRLEtBQVIsQ0FBL0QsRUFBRSx1QkFBRixFQUFZLHFCQUFaLEVBQXFCLGlCQUFyQixFQUE0QixlQUE1QixFQUFrQyxlQUFsQyxFQUF3QyxlQUF4QyxFQUE4QyxpQkFBOUMsRUFBcUQsV0FBckQsRUFBeUQ7O0FBRXpELFFBQUEsR0FBVyxTQUFDLEdBQUQ7QUFFUCxRQUFBO0lBQUEsSUFBQSxHQUFPO0FBQ1AsU0FBQSxXQUFBOztRQUNJLElBQUksQ0FBQyxJQUFMO0FBQVUsb0JBQUEsS0FBQTtBQUFBLHVCQUNELEtBQUEsQ0FBTSxXQUFOLENBQUEsSUFBdUIsSUFBSSxDQUFDLFVBQUwsQ0FBZ0IsR0FBaEIsRUFEdEI7MkJBRUY7d0JBQUEsSUFBQSxFQUFNLEVBQU47O0FBRkUsc0JBR0QsQ0FBQyxDQUFDLFFBQUYsQ0FBVyxXQUFYLENBSEM7MkJBSUY7d0JBQUEsSUFBQSxFQUFLLElBQUw7d0JBQ0EsS0FBQSxFQUFNLElBQUEsQ0FBSyxXQUFMLENBRE47O0FBSkUsc0JBTUQsQ0FBQyxDQUFDLFFBQUYsQ0FBVyxXQUFYLENBTkM7MkJBT0Y7d0JBQUEsSUFBQSxFQUFLLElBQUw7d0JBQ0EsS0FBQSxFQUFNLE9BQU8sQ0FBQyxjQUFSLENBQXVCLFdBQXZCLENBRE47O0FBUEUsc0JBU0QsS0FBQSxDQUFNLFdBQU4sQ0FUQzsyQkFVRjt3QkFBQSxJQUFBLEVBQUssSUFBTDt3QkFDQSxLQUFBLEVBQU8sRUFEUDs7QUFWRTtvQkFhRixJQUFHLDJCQUFBLElBQXNCLDZCQUF6Qjt3QkFDSSxJQUFBLEdBQU8sQ0FBQyxDQUFDLEtBQUYsQ0FBUSxXQUFSO3dCQUNQLElBQUksQ0FBQyxJQUFMLEdBQVk7K0JBQ1osS0FISjtxQkFBQSxNQUFBOytCQUtJOzRCQUFBLElBQUEsRUFBSyxJQUFMOzRC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O0FBRko7QUFISjtJQTBCQSxNQUFBLEdBQVMsQ0FBQyxRQUFEO0FBQ1QsU0FBQSxjQUFBOztRQUNJLE1BQU0sQ0FBQyxJQUFQLENBQVk7WUFBQSxJQUFBLEVBQUssR0FBTDtZQUFVLElBQUEsRUFBSyxJQUFmO1NBQVo7QUFESjtXQUdBLE1BQU0sQ0FBQyxNQUFQLENBQWMsQ0FBQyxRQUFELEVBQVcsUUFBUyxDQUFBLENBQUEsQ0FBcEIsQ0FBZDtBQTFEYSIsInNvdXJjZXNDb250ZW50IjpbIiMjI1xuMDAgICAgIDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgMDAwICAgICAgIDAwMDAgIDAwMCAgMDAwICAgMDAwXG4wMDAwMDAwMDAgIDAwMDAwMDAgICAwMDAgMCAwMDAgIDAwMCAgIDAwMFxuMDAwIDAgMDAwICAwMDAgICAgICAgMDAwICAwMDAwICAwMDAgICAwMDBcbjAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgIDAwMDAwMDBcbiMjI1xuXG57IGZpbGVsaXN0LCBrZXlpbmZvLCBlbXB0eSwga2xvZywgbm9vbiwgcG9zdCwgc2xhc2gsIG9zLCBfIH0gPSByZXF1aXJlICdreGsnXG5cbnRlbXBsYXRlID0gKG9iaikgLT5cbiAgICBcbiAgICB0bXBsID0gW11cbiAgICBmb3IgdGV4dCxtZW51T3JBY2NlbCBvZiBvYmpcbiAgICAgICAgdG1wbC5wdXNoIHN3aXRjaFxuICAgICAgICAgICAgd2hlbiBlbXB0eShtZW51T3JBY2NlbCkgYW5kIHRleHQuc3RhcnRzV2l0aCAnLSdcbiAgICAgICAgICAgICAgICB0ZXh0OiAnJ1xuICAgICAgICAgICAgd2hlbiBfLmlzTnVtYmVyIG1lbnVPckFjY2VsXG4gICAgICAgICAgICAgICAgdGV4dDp0ZXh0XG4gICAgICAgICAgICAgICAgYWNjZWw6a3N0ciBtZW51T3JBY2NlbFxuICAgICAgICAgICAgd2hlbiBfLmlzU3RyaW5nIG1lbnVPckFjY2VsXG4gICAgICAgICAgICAgICAgdGV4dDp0ZXh0XG4gICAgICAgICAgICAgICAgYWNjZWw6a2V5aW5mby5jb252ZXJ0Q21kQ3RybCBtZW51T3JBY2NlbFxuICAgICAgICAgICAgd2hlbiBlbXB0eSBtZW51T3JBY2NlbFxuICAgICAgICAgICAgICAgIHRleHQ6dGV4dFxuICAgICAgICAgICAgICAgIGFjY2VsOiAnJ1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGlmIG1lbnVPckFjY2VsLmFjY2VsPyBvciBtZW51T3JBY2NlbC5jb21tYW5kPyAjIG5lZWRzIGJldHRlciB0ZXN0IVxuICAgICAgICAgICAgICAgICAgICBpdGVtID0gXy5jbG9uZSBtZW51T3JBY2NlbFxuICAgICAgICAgICAgICAgICAgICBpdGVtLnRleHQgPSB0ZXh0XG4gICAgICAgICAgICAgICAgICAgIGl0ZW1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6dGV4dFxuICAgICAgICAgICAgICAgICAgICBtZW51OnRlbXBsYXRlIG1lbnVPckFjY2VsXG4gICAgdG1wbFxuXG5tb2R1bGUuZXhwb3J0cyA9IC0+XG5cbiAgICBtYWluTWVudSA9IHRlbXBsYXRlIG5vb24ubG9hZCBfX2Rpcm5hbWUgKyAnLi4vLi4vLi4vY29mZmVlL21lbnUubm9vbidcblxuICAgIHZpZXdNZW51ID0gdGV4dDonVmlldycgbWVudTpbXG4gICAgICAgIHRleHQ6J1RvZ2dsZSBDZW50ZXIgVGV4dCcgIGFjY2VsOidjdHJsK1xcXFwnXG4gICAgLFxuICAgICAgICB0ZXh0OidUb2dnbGUgSW52aXNpYmxlcycgICBhY2NlbDonY3RybCtpJ1xuICAgICxcbiAgICAgICAgdGV4dDonVG9nZ2xlIFBpZ21lbnRzJyAgICAgYWNjZWw6J2FsdCtjdHJsK3AnXG4gICAgXSAgICBcbiAgICBlZGl0TWVudSA9IHRleHQ6J0VkaXQnIG1lbnU6W1xuICAgICAgICB0ZXh0OidVbmRvJyAgYWNjZWw6J2N0cmwreidcbiAgICAsXG4gICAgICAgIHRleHQ6J1JlZG8nICBhY2NlbDonY3RybCtzaGlmdCt6J1xuICAgICxcbiAgICAgICAgdGV4dDonJyAgICAgXG4gICAgLFxuICAgICAgICB0ZXh0OidDdXQnICAgYWNjZWw6J2N0cmwreCdcbiAgICAsXG4gICAgICAgIHRleHQ6J0NvcHknICBhY2NlbDonY3RybCtjJ1xuICAgICxcbiAgICAgICAgdGV4dDonUGFzdGUnIGFjY2VsOidjdHJsK3YnXG4gICAgXVxuXG4gICAgYWN0aW9uRmlsZXMgPSBmaWxlbGlzdCBzbGFzaC5qb2luIF9fZGlybmFtZSwgJy4uL2VkaXRvci9hY3Rpb25zJ1xuICAgIHN1Ym1lbnUgPSBNaXNjOiBbXVxuXG4gICAgZm9yIGFjdGlvbkZpbGUgaW4gYWN0aW9uRmlsZXNcbiAgICAgICAgY29udGludWUgaWYgc2xhc2guZXh0KGFjdGlvbkZpbGUpIG5vdCBpbiBbJ2pzJyAnY29mZmVlJ11cbiAgICAgICAgYWN0aW9ucyA9IHJlcXVpcmUgYWN0aW9uRmlsZVxuICAgICAgICBmb3Iga2V5LHZhbHVlIG9mIGFjdGlvbnNcbiAgICAgICAgICAgIG1lbnVOYW1lID0gJ01pc2MnXG4gICAgICAgICAgICBpZiBrZXkgPT0gJ2FjdGlvbnMnXG4gICAgICAgICAgICAgICAgaWYgdmFsdWVbJ21lbnUnXT9cbiAgICAgICAgICAgICAgICAgICAgbWVudU5hbWUgPSB2YWx1ZVsnbWVudSddXG4gICAgICAgICAgICAgICAgICAgIHN1Ym1lbnVbbWVudU5hbWVdID89IFtdXG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgICAgICAgIGZvciBrLHYgb2YgdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgaWYgdi5uYW1lIGFuZCB2LmNvbWJvXG4gICAgICAgICAgICAgICAgICAgICAgICBtZW51QWN0aW9uID0gKGMpIC0+IChpLHdpbikgLT4gcG9zdC50b1dpbiB3aW4uaWQsICdtZW51QWN0aW9uJywgY1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tYm8gPSB2LmNvbWJvXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiBvcy5wbGF0Zm9ybSgpICE9ICdkYXJ3aW4nIGFuZCB2LmFjY2VsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tYm8gPSB2LmFjY2VsXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtID1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiAgIHYubmFtZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjY2VsOiAgY29tYm9cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIHYubWVudT9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJtZW51W3YubWVudV0gPz0gW11cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIHYuc2VwYXJhdG9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VibWVudVt2Lm1lbnUgPyBtZW51TmFtZV0ucHVzaCB0ZXh0OiAnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgc3VibWVudVt2Lm1lbnUgPyBtZW51TmFtZV0ucHVzaCBpdGVtXG5cbiAgICByZXN1bHQgPSBbZWRpdE1lbnVdXG4gICAgZm9yIGtleSwgbWVudSBvZiBzdWJtZW51XG4gICAgICAgIHJlc3VsdC5wdXNoIHRleHQ6a2V5LCBtZW51Om1lbnVcblxuICAgIHJlc3VsdC5jb25jYXQgW3ZpZXdNZW51LCBtYWluTWVudVsyXV1cblxuIl19
//# sourceURL=../../coffee/editor/menu.coffee