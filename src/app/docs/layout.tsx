import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { source } from "@/lib/source";
import { baseOptions } from "@/lib/layout.shared";

export default function Layout(props: LayoutProps<"/docs">) {
  return (
    <DocsLayout
      tree={source.pageTree}
      themeSwitch={{ enabled: false }}
      {...baseOptions()}
    >
      {props.children}
    </DocsLayout>
  );
}
