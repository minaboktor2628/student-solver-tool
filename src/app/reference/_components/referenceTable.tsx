"use client";

import React, { Suspense, useCallback, useEffect } from "react";

import {
  AllocationsReference,
  TaPreferenceReference,
  PlaPreferenceReference,
} from "@/app/reference/_components/jsonReferenceSheets";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ReferenceTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams);
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  const tabFromUrl = searchParams.get("tab");
  const validTabs = ["allocations", "taPref", "plaPref"];
  const initialTab = validTabs.includes(tabFromUrl ?? "") ? tabFromUrl! : "allocations";
  const [activeTab, setActiveTab] = React.useState(initialTab);

  useEffect(() => {
    const currentTab = searchParams.get("tab");
    if (activeTab !== currentTab) {
      router.replace((`${pathname}?${createQueryString("tab", activeTab)}`) as any);
    }
  }, [activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div>
        <h3 className="justify-left m-3 flex text-sm font-medium">
          JSON Reference Sheets
        </h3>
        <div>
          <div className="flex w-screen justify-center">
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="flex items-center gap-6 border-b p-2"
            >
              <TabsList>
                <TabsTrigger value="allocations">Allocations</TabsTrigger>
                <TabsTrigger value="taPref">TA Preferences</TabsTrigger>
                <TabsTrigger value="plaPref">PLA Preferences</TabsTrigger>
              </TabsList>
            <div className="border-p mx-16 my-4 overflow-hidden">
              <TabsContent value="allocations">
                <AllocationsReference />
              </TabsContent>
              <TabsContent value="taPref">
                <TaPreferenceReference />
              </TabsContent>
              <TabsContent value="plaPref">
                <PlaPreferenceReference />
              </TabsContent>
            </div>
            </Tabs>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
