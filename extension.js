const vscode = require('vscode');

const requireRegex = /require\s*\(\s*('|").*('|")\s*\)/g;
const moduleRegex = /('|").*('|")/g;

const priority = {
  './': 1,
  '../': 2,
};

function subCount(str, substr) {
  return str.split(substr).length - 1;
}

function formatRequires(str) {
  const inputString = str.replace(/\n/g, '');
  const stringWithConstVar = inputString.replace(/(const |var )/g, '\n$1');
  const requiresArray = stringWithConstVar.split('\n');
  return requiresArray.filter((n) => n);
}

function sortVariables(strArray) {
  return strArray.map((inputString) => {
    const variablePattern = /\{([^}]+)\}/;
    const match = inputString.match(variablePattern);

    if (match) {
      const variables = match[1].split(',').map((variable) => variable.trim());
      const sortedVariables = variables
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
        .filter((n) => n)
        .join(', ');

      return inputString.replace(variablePattern, `{ ${sortedVariables} }`);
    }

    return inputString;
  });
}

function sortRequires(strArray) {
  return strArray.sort(function (a, b) {
    const aModule = a.match(requireRegex)[0].match(moduleRegex)[0].slice(1, -1);
    const bModule = b.match(requireRegex)[0].match(moduleRegex)[0].slice(1, -1);

    const aPriority =
      priority['./'] * subCount(aModule, './') + priority['../'] * subCount(aModule, '../');
    const bPriority =
      priority['./'] * subCount(bModule, './') + priority['../'] * subCount(bModule, '../');

    if (aPriority > bPriority) return 1;

    if (bPriority > aPriority) return -1;

    if (aModule > bModule) return 1;

    if (aModule < bModule) return -1;

    return 0;
  });
}

function activate(context) {
  const disposable = vscode.commands.registerCommand('require_sort.sort', function () {
    const editor = vscode.window.activeTextEditor;

    if (editor === undefined) return;

    const document = editor.document;

    const requiresString = document.getText(editor.selection);
    const requiresLines = formatRequires(requiresString);

    const textLinesSorted = sortRequires(requiresLines);

    const textLinesVariablesSorted = sortVariables(textLinesSorted);

    editor.edit(function (editBuilder) {
      editBuilder.replace(editor.selection, textLinesVariablesSorted.join('\n'));
    });
  });

  context.subscriptions.push(disposable);
}
exports.activate = activate;

function deactivate() {}
exports.deactivate = deactivate;
