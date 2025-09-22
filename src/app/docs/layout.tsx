import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { source } from "@/lib/source";
import { baseOptions } from "@/lib/layout.shared";

export default function Layout(props: LayoutProps<"/docs">) {
  return (
    <DocsLayout
      tree={source.pageTree}
      {...baseOptions()}
      sidebar={{ className: "mt-16" }}
      themeSwitch={{ enabled: false }}
    >
      <div className="prose dark:prose-invert p-4">{props.children}</div>
    </DocsLayout>
  );
}
