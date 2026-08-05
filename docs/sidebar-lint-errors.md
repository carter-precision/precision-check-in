<!-- AGENTS: Ignore this file. -->

<!-- prettier-ignore-start -->

# Showing errors for closed files in VS Code

The behavior you are seeing is expected: the ESLint extension normally validates individual files as they are opened. It can also contribute a whole-workspace lint task (official extension documentation).
Add .vscode/settings.json:
{
  "eslint.lintTask.enable": true,
  "problems.decorations.enabled": true,
  "explorer.decorations.badges": true,
  "explorer.decorations.colors": true
}
Then run:
Command Palette → Tasks: Run Task → eslint: lint whole folder
That runs ESLint across the repository and populates the Problems panel and Explorer decorations for closed files. VS Code officially supports ESLint’s stylish output through its built-in problem matcher (VS Code task documentation).
To run it automatically whenever the folder opens, add .vscode/tasks.json:
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Lint workspace",
      "type": "npm",
      "script": "lint",
      "problemMatcher": "$eslint-stylish",
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "runOptions": {
        "runOn": "folderOpen"
      },
      "presentation": {
        "reveal": "never",
        "panel": "dedicated"
      }
    }
  ]
}
VS Code may ask you once to allow automatic tasks for the folder. After that, existing lint errors should be marked in the Explorer even when their files have not been opened.

<!-- prettier-ignore-end -->
