import { source } from "@/lib/source";
import { notFound } from "next/navigation";

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
  const { slug } = await props.params;
  const page = source.getPage(slug);
  if (!page) return notFound();
  const MDX = page.data.body;
  return <MDX />;
}
