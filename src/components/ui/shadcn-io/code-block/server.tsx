import {
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationFocus,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import type { HTMLAttributes } from "react";
import {
  type BundledLanguage,
  type CodeOptionsMultipleThemes,
  codeToHtml,
} from "shiki";

type DivProps = Omit<HTMLAttributes<HTMLDivElement>, "children">;

export type CodeBlockContentProps = DivProps & {
  /** Shiki themes mapping (light/dark) */
  themes?: CodeOptionsMultipleThemes["themes"];
  /** Shiki language id (e.g. "typescript") */
  language?: BundledLanguage;
  /** The source code to render */
  code: string;
  /** Turn syntax highlighting on/off */
  syntaxHighlighting?: boolean;
};

export const CodeBlockContent = async ({
  code,
  themes,
  language = "typescript",
  syntaxHighlighting = true,
  ...props
}: CodeBlockContentProps) => {
  const html = syntaxHighlighting
    ? await codeToHtml(code, {
        lang: language,
        themes: themes ?? { light: "vitesse-light", dark: "vitesse-dark" },
        transformers: [
          transformerNotationDiff({ matchAlgorithm: "v3" }),
          transformerNotationHighlight({ matchAlgorithm: "v3" }),
          transformerNotationWordHighlight({ matchAlgorithm: "v3" }),
          transformerNotationFocus({ matchAlgorithm: "v3" }),
          transformerNotationErrorLevel({ matchAlgorithm: "v3" }),
        ],
      })
    : code;

  return (
    <div
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki returns trusted HTML
      dangerouslySetInnerHTML={{ __html: html }}
      {...props}
    />
  );
};
