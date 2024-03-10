"use client";

import PromptCard from "@/components/PromptCard";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

export default function Dashboard() {
  const prompts = useQuery(api.posts.list);

  return (
    <div>
      <p>Dashboard</p>
      {prompts &&
        prompts.map((p) => {
          return <PromptCard prompt={p} key={p._id}></PromptCard>;
        })}
    </div>
  );
}
