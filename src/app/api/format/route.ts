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

    const lang = language.toLowerCase();
    let parser = "";
    const plugins = [parserBabel, parserHtml, parserCss, parserMarkdown, parserEstree];

    if (["javascript", "typescript", "js", "ts", "jsx", "tsx"].includes(lang)) {
      parser = "babel-ts";
    } else if (lang === "html") {
      parser = "html";
    } else if (lang === "css" || lang === "scss") {
      parser = "css";
    } else if (lang === "json") {
      parser = "json";
    } else if (lang === "markdown" || lang === "md") {
      parser = "markdown";
    } else {
      return NextResponse.json({ error: `Formatting is not supported for ${language}` }, { status: 400 });
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
