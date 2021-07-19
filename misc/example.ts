import * as readline from "readline";
import chalk from "chalk";
import { Analyser, ArgItem } from "../src";

function printArgs(args: readonly ArgItem[]) {
    const line = chalk.gray("│  ");

    function print(arg: ArgItem, indent: number) {
        switch (arg.kind) {
            case "string":
                printStringArgs(arg, indent);
                break;
            case "group":
                printGroupArgs(arg, indent);
                break;
        }
    }

    function printStringArgs(arg: ArgItem & { kind: "string" }, indent: number) {
        const delimiter = arg.delimiter === "" ? "∅" : arg.delimiter;
        console.log(`${line.repeat(indent)}${chalk.gray("├")} ${chalk.green(delimiter)}  ${chalk.red(arg.content)}`);
    }

    function printGroupArgs(arg: ArgItem & { kind: "group" }, indent: number) {
        console.log(
            `${line.repeat(indent)}${chalk.gray("├")} ${chalk.green(arg.delimiter[0])} ${chalk.green(
                arg.delimiter[1],
            )}`,
        );
        arg.content.forEach(a => print(a, indent + 1));
    }

    args.forEach(a => print(a, 0));
}

const analyser = new Analyser({
    quotes: "both",
    groupDelimiters: [
        ["[", "]"],
        ["(", ")"],
        ["{", "}"],
    ],
});
const rl = readline.createInterface(process.stdin);

rl.on("line", input => {
    console.log(chalk.yellowBright("-".repeat(40)));
    try {
        const args = analyser.analyse(input);
        printArgs(args);
    } catch (e) {
        console.log(chalk.red.bold("Error"), chalk.redBright(e));
    }
    console.log(chalk.yellowBright("=".repeat(40)));
});

console.log();
console.log(chalk.bold("Write something then press ENTER"));
console.log(chalk.bold("Ctrl+C to quit"));
console.log(chalk.yellowBright("=".repeat(40)));
