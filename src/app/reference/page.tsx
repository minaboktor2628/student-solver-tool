"use client";

import { useState } from "react";

import {
  AllocationsReference,
  TaPreferenceReference,
  PlaPreferenceReference,
} from "@/app/reference/_components/jsonReferenceSheets";
import { useRouter, useSearchParams } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from "react";

export default function ReferencePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  //Checks URL for tab names, if url = to tab name, set that tab to activeTab, if not default to allocations
  const TAB_NAMES = ["allocations", "taPref", "plaPref"];
  const [activeTab, setActiveTab] = useState<string>(() => {
    const referenceParam = searchParams.get("reference");
    return TAB_NAMES.includes(referenceParam ?? "")
      ? (referenceParam!)
      : "allocations";
  });

  function handleTabChange(value: string) {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("reference", value);
    router.replace(`?${params.toString()}`);
  }

  return (
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
  );
}
