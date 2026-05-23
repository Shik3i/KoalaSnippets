import { NextResponse } from "next/server";
import prettier from "prettier";
import * as parserBabel from "prettier/plugins/babel";
import * as parserHtml from "prettier/plugins/html";
import * as parserCss from "prettier/plugins/postcss";
import * as parserMarkdown from "prettier/plugins/markdown";
import * as parserEstree from "prettier/plugins/estree";
import { getSession } from "@/features/auth/utils/session";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { code, language } = await request.json();

    if (!code || !language) {
      return NextResponse.json({ error: "Missing code or language" }, { status: 400 });
    }

    let parser = "babel"; // Default to babel (JS/TS)
    const plugins = [parserBabel, parserHtml, parserCss, parserMarkdown, parserEstree];

    if (language === "html") parser = "html";
    else if (language === "css" || language === "scss") parser = "css";
    else if (language === "json") parser = "json";
    else if (language === "markdown") parser = "markdown";
    else if (language === "typescript" || language === "javascript") parser = "babel-ts";

    // Skip if it's a language prettier doesn't support easily without extra plugins (e.g. go, rust, python)
    if (!["babel", "babel-ts", "html", "css", "json", "markdown"].includes(parser)) {
      return NextResponse.json({ error: "Language not supported for formatting" }, { status: 400 });
    }

    const formatted = await prettier.format(code, {
      parser,
      plugins,
      semi: true,
      singleQuote: false,
    });

    return NextResponse.json({ code: formatted });
  } catch (error) {
    console.error("Format error:", error);
    return NextResponse.json({ error: "Failed to format code" }, { status: 500 });
  }
}
