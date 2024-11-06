/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";

// SWR fetcher function
const fetcher = (url: string) => fetch(url).then((res) => res.json());

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Upload } from "lucide-react";

import { searchContacts, uploadFile } from "./actions";
import Link from "next/link";

export default function Component() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [selectedWorkspaceId, setSelectedWorkspace] = useState<string>();
  const { data: workspaces } = useSWR("/api/workspaces", fetcher);

  useEffect(() => {
    if (workspaces) {
      setSelectedWorkspace(workspaces[0].id);
    }
  }, [workspaces]);

  const onSearch = useCallback(async () => {
    const results = await searchContacts(searchTerm, selectedWorkspaceId!);
    console.log("results", results);
    setSearchResults(results);
  }, [selectedWorkspaceId, searchTerm]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Select
            onValueChange={(value) => setSelectedWorkspace(value)}
            value={selectedWorkspaceId}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Workspace" />
            </SelectTrigger>
            <SelectContent>
              {workspaces?.map((workspace: any) => (
                <SelectItem key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <form action={uploadFile}>
            <input
              type="hidden"
              name="workspaceId"
              value={selectedWorkspaceId}
            />
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Input
                  type="file"
                  className="sr-only"
                  id="file-upload"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2"
                >
                  Choose File
                </label>
                <span className="ml-2">
                  {selectedFile ? selectedFile.name : "No file chosen"}
                </span>
              </div>
              <Button disabled={!selectedFile}>
                <Upload className="mr-2 h-4 w-4" /> Upload
              </Button>
            </div>
          </form>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-6">
          <div className="relative flex items-center gap-4">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              name="query"
              placeholder="Search contacts..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <Button onClick={onSearch}>Search</Button>
          </div>
        </div>

        {searchResults.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((contactInfo, key) => (
              <Card key={key}>
                <CardContent className="p-6 whitespace-pre-line">
                  {contactInfo}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="mt-8 w-full">
            <CardContent className="p-6 text-center">
              <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">
                Search for Contacts
              </h2>
              <p className="text-muted-foreground">
                ex: &quot;HR in San Francisco&quot;
              </p>
            </CardContent>
          </Card>
        )}
      </main>
      <footer className="border-t py-6 bg-muted/50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Powered by{" "}
          <Link
            href="https://neon.tech/"
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Neon
          </Link>{" "}
          and{" "}
          <Link
            href="https://inngest.com/"
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Inngest
          </Link>
        </div>
      </footer>
    </div>
  );
}
