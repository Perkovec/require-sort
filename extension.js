var vscode = require('vscode');

var requireRegex = /require\s*\(\s*('|").*('|")\s*\)/g;
var moduleRegex = /('|").*('|")/g;

var priority = {
    "./": 1,
    "../": 2
};

function subCount(str, substr) {
    return (str.split(substr).length - 1)
}

function activate(context) {
    var disposable = vscode.commands.registerCommand('require_sort.sort', function () {
        var editor = vscode.window.activeTextEditor;

        if (editor === undefined) return;

        var document = editor.document;

        var text = document.getText(editor.selection);
        var textLines = text.split('\n');
        textLines.sort(function(a, b) {
            var aModule = a.match(requireRegex)[0].match(moduleRegex)[0].slice(1, -1);
            var bModule = b.match(requireRegex)[0].match(moduleRegex)[0].slice(1, -1);

            var aPriority = priority['./'] * subCount(aModule, './') + priority['../'] * subCount(aModule, '../');
            var bPriority = priority['./'] * subCount(bModule, './') + priority['../'] * subCount(bModule, '../');

            if (aPriority > bPriority) return 1;
            
            if (bPriority > aPriority) return -1;

            if (aModule > bModule) return 1;
            
            if (aModule < bModule) return -1;

            return 0;
        });

        editor.edit(function (editBuilder) {
            editBuilder.replace(editor.selection, textLines.join('\n'));
        });
    });

    context.subscriptions.push(disposable);
}
exports.activate = activate;

function deactivate() {
}
exports.deactivate = deactivate;