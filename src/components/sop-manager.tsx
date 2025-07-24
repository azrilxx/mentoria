"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState, useTransition, useEffect } from "react";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, FileText, UploadCloud } from "lucide-react";
import { getSopsByCompany, saveSop, deleteSop, Sop } from "@/services/firebase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

const sopFormSchema = z.object({
    department: z.string().min(2, { message: "Department is required." }),
    tags: z.string().min(2, { message: "At least one tag is required." }),
    file: z.any().refine(file => file?.length == 1, "File is required."),
});

type SopFormValues = z.infer<typeof sopFormSchema>;

export function SopManager({ companyId, userId }: { companyId: string, userId: string }) {
    const [isPending, startTransition] = useTransition();
    const [sops, setSops] = useState<Sop[]>([]);
    const { toast } = useToast();

    const form = useForm<SopFormValues>({
        resolver: zodResolver(sopFormSchema),
    });

    const fetchSops = async () => {
        const companySops = await getSopsByCompany(companyId);
        setSops(companySops);
    };

    useEffect(() => {
        fetchSops();
    }, [companyId]);


    const onSubmit = (data: SopFormValues) => {
        startTransition(async () => {
            try {
                const file = data.file[0];
                if (!file) {
                    toast({ variant: "destructive", title: "Error", description: "No file selected." });
                    return;
                }

                const tagsArray = data.tags.split(',').map(tag => tag.trim().toLowerCase());

                // This simulates the upload and saving process
                await saveSop({
                    companyId,
                    uploadedBy: userId,
                    department: data.department,
                    tags: tagsArray,
                    fileName: file.name,
                    fileUrl: `/sops/${companyId}/${file.name}`, // Simulated URL
                });

                toast({
                    title: "SOP Uploaded",
                    description: `${file.name} has been saved.`,
                });
                form.reset({ department: '', tags: '', file: undefined });
                // Refresh the list
                fetchSops();
            } catch (error) {
                console.error(error);
                toast({
                    variant: "destructive",
                    title: "Upload Failed",
                    description: "Could not upload the SOP. Please try again.",
                });
            }
        });
    };
    
    const handleDelete = (sopId: string, fileName: string) => {
        startTransition(async () => {
            try {
                await deleteSop(sopId);
                toast({
                    title: "SOP Deleted",
                    description: `${fileName} has been removed.`,
                });
                fetchSops();
            } catch (error) {
                console.error(error);
                toast({
                    variant: "destructive",
                    title: "Deletion Failed",
                    description: "Could not delete the SOP. Please try again.",
                });
            }
        });
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Upload New SOP</CardTitle>
                        <CardDescription>Add a new document to the company repository.</CardDescription>
                    </CardHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <CardContent className="grid gap-4">
                                <FormField
                                    control={form.control}
                                    name="department"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Department</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Finance" {...field} disabled={isPending} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="tags"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tags</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., audit, compliance, safety" {...field} disabled={isPending} />
                                            </FormControl>
                                            <FormDescription>Comma-separated keywords for searching.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="file"
                                    render={({ field: { onChange, value, ...rest } }) => (
                                      <FormItem>
                                        <FormLabel>SOP Document</FormLabel>
                                        <FormControl>
                                          <Input type="file" onChange={(e) => onChange(e.target.files)} {...rest} accept=".pdf,.docx,.txt" disabled={isPending} />
                                        </FormControl>
                                        <FormDescription>Accepted formats: PDF, DOCX, TXT.</FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={isPending}>
                                    {isPending ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                                    ) : (
                                        <><UploadCloud className="mr-2 h-4 w-4" /> Upload SOP</>
                                    )}
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
                </Card>
            </div>
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Uploaded SOPs</CardTitle>
                        <CardDescription>List of all company-specific documents.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Filename</TableHead>
                                    <TableHead>Tags</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Uploaded</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {isPending && sops.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : sops.length > 0 ? (
                                    sops.map((sop) => (
                                        <TableRow key={sop.id}>
                                            <TableCell className="font-medium flex items-center gap-2">
                                               <FileText className="h-4 w-4 text-muted-foreground" />
                                               {sop.fileName}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {sop.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                                                </div>
                                            </TableCell>
                                            <TableCell>{sop.department}</TableCell>
                                            <TableCell>{format(new Date(sop.createdAt), 'dd MMM yyyy')}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(sop.id!, sop.fileName)} disabled={isPending}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No SOPs uploaded yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
