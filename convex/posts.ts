import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import {
  query,
  action,
  mutation,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { mustGetCurrentUser } from "./users";
import { EXAMPLE_DATA } from "./constants";


export type SearchResult = {
    _id: string;
    _score: number;
    _authorId: string | null;
    title: string;
    description: string;
    prompt: string;
    likes: number;
    platform: string | null;
    tags: string[] | null;
  };

//For initially populating the posts table with the example data
  export const populate = action({
    args: {},
    handler: async (ctx) => {

      for (const doc of EXAMPLE_DATA) {
        const embedding = await embed(doc.title + doc.description + doc.prompt);
        await ctx.runMutation(internal.posts.insertRow, {
        //   authorId: author._id,
          title: doc.title,
          description: doc.description,
          prompt: doc.prompt,
          likes: 0,
          embedding: embedding,
        });
      }
    },
  });

  // Helper function, given a title, description, and prompt, returns the embedding of the text using the OpenAI API
  export async function embed(text: string): Promise<number[]> {
    const key = process.env.OPENAI_KEY;
    if (!key) {
      throw new Error("OPENAI_KEY environment variable not set!");
    }

    // Compute the embedding of the text using the OpenAI API
    const req = { input: text, model: "text-embedding-3-small" };
    const resp = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(req),
    });

    if (!resp.ok) {
      const msg = await resp.text();
      throw new Error(`OpenAI API error: ${msg}`);
    }
    const json = await resp.json();
    const vector = json["data"][0]["embedding"];
    console.log(`Computed embedding of "${text}" post: ${vector.length} dimensions`);
    return vector;
  }

  //Helper for adding a new post to the posts table
  export const insertRow = internalMutation({
    args: {
      description: v.string(),
      prompt: v.string(),
      title: v.string(),
      likes: v.number(),
      tags: v.optional(v.array(v.string())),
      platform: v.optional(v.string()),
      embedding: v.array(v.float64()),
    },
    handler: async (ctx, args) => {

        //Get the current user and add their id to the post
      const user = await mustGetCurrentUser(ctx);

      const post = {
        authorId: user._id,
        ...args,
      }

      await ctx.db.insert("posts", post);
    },
  });

  
  //Function to add a post from the client 
  // First generates the embedding of the post then uses a mutation to add it to the posts table
  export const addPosts = action({
      args: {
          title: v.string(),
          description: v.string(),
          prompt: v.string(),
          tags: v.optional(v.array(v.string())),
          platform: v.optional(v.string()),    
        },
        handler: async (ctx, args) => {
            
            //Generate the embedding
            const embedding = await embed(args.title + args.description + args.prompt);

            //Add the post to the posts table
            await ctx.runMutation(internal.posts.insertRow, {
                title: args.title,
                description: args.description,
                prompt: args.prompt,
                likes: 0,
                tags: args.tags,
                platform: args.platform,
                embedding: embedding,
            });
        },
    });


  //For getting the posts from the posts table
  export const list = query({
    args: { paginationOpts: paginationOptsValidator },
    handler: async (ctx, args) => {
        const docs = await ctx.db
            .query("posts")
            .order("desc")
            .paginate(args.paginationOpts);

        return docs;
    }
  });
    
  //Helper function for getting the matching posts based on the query and tags
  export const fetchResults = internalQuery({
        args: {
          results: v.array(v.object({ _id: v.id("posts"), _score: v.float64() })),
        },
        handler: async (ctx, args) => {
          const out: SearchResult[] = [];
          for (const result of args.results) {
            const doc = await ctx.db.get(result._id);
            if (!doc) {
              continue;
            }
            out.push({
              _id: doc._id,
              _score: result._score,
              _authorId: doc.authorId !== undefined ? doc.authorId : null,
                title: doc.title,
                description: doc.description,
                prompt: doc.prompt,
                likes: doc.likes,
                platform: doc.platform !== undefined ? doc.platform : null,
                tags: doc.tags !== undefined ? doc.tags : null
            });
          }
          return out;
        },
      });
    

      //Function to delete a post
      export const deletePost = mutation({
        args: {
          _id: v.id("posts"),
        },
        handler: async (ctx, args) => {
          await ctx.db.delete(args._id);
        },
      });