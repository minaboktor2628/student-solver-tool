"use client"

import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { useState } from "react"

import { 
    AllocationsReference,
    AssignmentsReference,
    TaReference,
    PlaReference,
    GlaReference,
    TaPreferenceReference,
    PlaPreferenceReference,

 } from "@/app/reference/_components/jsonReferenceSheets"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const FormSchema = z.object({
  reference: z
    .string({
      required_error: "Please select a JSON reference sheet to display",
    })
})

export default function ReferencePage() {
    const [ActiveComponent, setActiveComponent] = useState<React.FC | null>(null);

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
    })

    function onSubmit(data: z.infer<typeof FormSchema>) {

        const componentsMap: Record<string, React.FC> = {
            allocations: AllocationsReference,
            assignments: AssignmentsReference,
            ta: TaReference,
            pla: PlaReference,
            gla: GlaReference,
            plaPref: PlaPreferenceReference,
            taPref: TaPreferenceReference,
        };
        
        const Component = componentsMap[data.reference];
        setActiveComponent(() => Component || null);

        console.log(data.reference)
  }



    return (
        /*<div>
            <h3 className="flex items-center border-b p-2 text-sm font-medium">JSON Reference Sheets</h3>
            <div className="flex justify-center m-2">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                        <FormField
                            control={form.control}
                            name="reference"
                            render={({ field }) => (
                                <FormItem>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a JSON reference sheet to display" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="allocations">Allocations.json</SelectItem>
                                            <SelectItem value="assignments">Assignments.json</SelectItem>
                                            <SelectItem value="ta">TAs.json</SelectItem>
                                            <SelectItem value="pla">PLAs.json</SelectItem>
                                            <SelectItem value="gla">GLAs.json</SelectItem>
                                            <SelectItem value="plaPref">PLA Preferences.json</SelectItem>
                                            <SelectItem value="taPref">TA Preferences.json</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit">Submit</Button>
                    </form>
                </Form>
            </div>
            <div className="overflow-hidden border-p my-4 mx-16">
                {ActiveComponent && <ActiveComponent />}
            </div>
            
        </div>
        */
        <div>
            <div className="flex items-center border-b p-2 gap-6">
                <h3 className="flex justify-left text-sm font-medium">JSON Reference Sheets</h3>
                <div className="flex justify-center w-screen">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                            <FormField
                                control={form.control}
                                name="reference"
                                render={({ field }) => (
                                    <FormItem>
                                        <Tabs onValueChange={ field.onChange } defaultValue="allocations">
                                            <FormControl>
                                                <TabsList>
                                                    <TabsTrigger type="submit" value="allocations">Allocations</TabsTrigger>
                                                    <TabsTrigger type="submit" value="assignments">Assignments</TabsTrigger>
                                                    <TabsTrigger type="submit" value="ta">TAs</TabsTrigger>
                                                    <TabsTrigger type="submit" value="pla">PLAs</TabsTrigger>
                                                    <TabsTrigger type="submit" value="gla">GLAs</TabsTrigger>
                                                    <TabsTrigger type="submit" value="taPref">TA Preferences</TabsTrigger>
                                                    <TabsTrigger type="submit" value="plaPref">PLA Preferences</TabsTrigger>
                                                </TabsList>
                                            </FormControl>
                                        </Tabs>
                                    </FormItem>
                                )}
                            />
                        </form>
                    </Form>
                </div>
            </div>
            <div className="overflow-hidden border-p my-4 mx-16">
                    {ActiveComponent && <ActiveComponent />}
            </div>
        </div>
    );
    
    
}
