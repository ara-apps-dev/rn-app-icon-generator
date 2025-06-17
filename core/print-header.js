import chalk from "chalk";

/**
 * Prints a styled header to the console using chalk for color and formatting.
 * This is shown at the start of the CLI tool.
 */
export function printHeader() {
  console.log(
    chalk.cyan.bold(`
╭────────────────────────────────────────╮
│   🚀 React Native App Icon Generator   │
╰────────────────────────────────────────╯
`)
  );
}

/**
 * Prints a styled footer to the console using chalk for color and formatting.
 * This is shown at the end of the CLI tool.
 */
export function printFooter() {
  console.log(
    chalk.cyan.bold(`
╭──────────────────────────────────────────╮
│   Thanks for using the Icon Generator!   │
╰──────────────────────────────────────────╯
`)
  );
}
