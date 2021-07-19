import { NoSpaceAfterGroup, NotClosedGroupError, UnexpectedCloseGroup } from "./errors";

export interface Options {
    /**
     * A list of tuples that define the open and the close symbole of groups.
     */
    readonly groupDelimiters?: ReadonlyArray<readonly [string, string]>;
    /** Defines the symboles for quotes.
     *  Either simple (`'`), double (`"`), both or none.
     *  Default value is `both`.
     */
    readonly quotes?: "none" | "simple" | "double" | "both";
}

export type ArgItem =
    | {
          readonly kind: "string";
          readonly delimiter: string;
          readonly content: string;
      }
    | {
          readonly kind: "group";
          readonly delimiter: readonly [string, string];
          readonly content: readonly ArgItem[];
      };

export class Analyser {
    private readonly data: AnalyserData;

    /**
     * @param options The options used to analyse strings.
     */
    constructor(options?: Options) {
        this.data = parseOptions(options);
    }

    /**
     * Analyse the string with the options passed to the constructor.
     * @param s The string to analyse.
     * @returns Arguments extracted from the string.
     */
    analyse(s: string): ArgItem[] {
        this.data.regex.lastIndex = 0; // Reset the regex
        return analyse(s, this.data);
    }

    /**
     * Performs a one shot analyse.
     * @param s The string to analyse.
     * @param options The options of the analyse.
     * @returns Arguments extracted from the string.
     */
    static analyse(s: string, options?: Options): ArgItem[] {
        return analyse(s, parseOptions(options));
    }
}

interface AnalyserData {
    readonly quotes: readonly string[];
    readonly regex: RegExp;
    readonly rightDelimiterPattern: string;
    readonly delimiterMapRight2Left: ReadonlyMap<string, string>;
    readonly delimiterMapLeft2Tuple: ReadonlyMap<string, readonly [string, string]>;
}

function parseOptions(options?: Options): AnalyserData {
    /** Escape regex special symbol into their litteral value. */
    function escapeRegex(s: string): string {
        return s.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
    }

    const delimiters = options?.groupDelimiters ?? [];
    const quotes = options?.quotes
        ? options.quotes === "simple"
            ? ["'"]
            : options.quotes === "double"
            ? ['"']
            : options.quotes === "both"
            ? ["'", '"']
            : []
        : ["'", '"'];
    const delimiterMapLeft2Tuple = new Map(delimiters.map(o => [o[0], o] as const));
    const delimiterMapRight2Left = new Map(delimiters.map(([left, right]) => [right, left] as const));

    const quotePattern = quotes.join("|");
    const leftDelimiterPattern = delimiters.map(([left]) => escapeRegex(left)).join("|");
    const rightDelimiterPattern = delimiters.map(([_, right]) => escapeRegex(right)).join("|");

    const pattern = ["\\s+", quotePattern, leftDelimiterPattern, rightDelimiterPattern].filter(s => s.length).join("|");

    const regex = new RegExp(pattern, "g");

    return { quotes, regex, rightDelimiterPattern, delimiterMapLeft2Tuple, delimiterMapRight2Left };
}

interface GroupBuilder {
    readonly leftDelimiter: string | null;
    readonly content: ArgItem[];
    readonly openAt: number;
}

function analyse(s: string, data: AnalyserData): ArgItem[] {
    const { quotes, regex, rightDelimiterPattern, delimiterMapRight2Left, delimiterMapLeft2Tuple } = data;

    const root: ArgItem[] = [];
    const builders: GroupBuilder[] = [
        {
            leftDelimiter: null,
            content: root,
            openAt: 0,
        },
    ];

    let lastSpace = 0;

    function pushItem(delimiter: string, content: string) {
        if (!content.length) return; // ignore empty item
        // builders has at least 1 element
        builders[builders.length - 1]!.content.push({ kind: "string", delimiter, content });
    }

    function expectSpaceAfterGroup() {
        // Expecting spaces, the end of the string
        // Or a close group but without consuming it
        const spaceRegex = new RegExp(`\\s+|$|(?=${rightDelimiterPattern})`, "y");
        spaceRegex.lastIndex = regex.lastIndex;
        if (!spaceRegex.exec(s)) throw new NoSpaceAfterGroup(regex.lastIndex);
        lastSpace = regex.lastIndex = spaceRegex.lastIndex;
    }

    function handleQuote(delimiter: string, index: number) {
        // Look for the next delimiter not preceded by the escape character `\`
        const quoteRegex = new RegExp(`(?<!\\\\)${delimiter}`, "g");
        quoteRegex.lastIndex = regex.lastIndex;

        const match = quoteRegex.exec(s);

        if (!match) throw new NotClosedGroupError(index);

        // Extract the content and remove the escape characters
        const content = s.slice(regex.lastIndex, match.index).replace(/\\["']/g, s => s[1]!);
        pushItem(delimiter, content);

        regex.lastIndex = quoteRegex.lastIndex;
        expectSpaceAfterGroup();
    }

    function openGroup(leftDelimiter: string, index: number) {
        const builder: GroupBuilder = {
            leftDelimiter,
            content: [],
            openAt: index,
        };
        builders.push(builder);
        lastSpace = regex.lastIndex;
    }

    function closeGroup(rightDelimiter: string, matchIndex: number) {
        const leftDelimiter = delimiterMapRight2Left.get(rightDelimiter);

        // push the last item of the group
        pushItem("", s.slice(lastSpace, matchIndex));

        // builders has at least 1 element
        const builder = builders.pop()!;
        if (builder.leftDelimiter !== leftDelimiter) throw new UnexpectedCloseGroup(matchIndex);
        builders[builders.length - 1]!.content.push({
            kind: "group",
            delimiter: delimiterMapLeft2Tuple.get(leftDelimiter)!,
            content: builder.content,
        });

        expectSpaceAfterGroup();
    }

    let match: RegExpExecArray | null;
    while ((match = regex.exec(s))) {
        // match[0] is always defined
        const value = match[0]!;

        if (value.match(/\s+/)) {
            pushItem("", s.slice(lastSpace, match.index));
            lastSpace = regex.lastIndex;
        } else if (quotes.includes(value)) {
            handleQuote(value, match.index);
        } else if (delimiterMapLeft2Tuple.has(value)) {
            openGroup(value, match.index);
        } else {
            closeGroup(value, match.index);
        }
    }

    // ensure the last item is pushed
    pushItem("", s.slice(lastSpace));

    if (builders.length > 1) {
        throw new NotClosedGroupError(builders[builders.length - 1]!.openAt);
    }

    return root;
}
