import { source } from "@/lib/source";
import { notFound } from "next/navigation";
import { DocsBody, DocsPage } from "fumadocs-ui/page";

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
  const { slug } = await props.params;
  const page = source.getPage(slug);
  if (!page) return notFound();
  const MDX = page.data.body;
  return (
    <DocsPage toc={page.data.toc}>
      <DocsBody className="prose dark:prose-invert">
        <MDX />
      </DocsBody>
    </DocsPage>
  );
}
