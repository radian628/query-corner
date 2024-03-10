import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import Icon from "@mdi/react";
import { mdiFile } from "@mdi/js";
import { Button } from "./ui/button";

const PromptCard = (props: {
  prompt: {
    _id: string;
    title: string;
    description: string;
    prompt: string;
    likes: number;
    platform: string | null;
    tags: string[] | null;
  };
}) => {
  return (
    <Card className="m-2 p-2 w-[calc(100% - 2)]">
      {props.prompt.tags?.map((tag) => {
        return (
          <Badge key={tag} className="m-1">
            {tag}
          </Badge>
        );
      })}
      <h2 className="text-xl">{props.prompt.title}</h2>
      <p className="text-s text-ellipsis overflow-hidden line-clamp-3">
        {props.prompt.description}
      </p>
      <Card className="text-xs p-2 mt-2">
        {
          <div className="flex">
            <Button className="align-self-stretch flex self-start me-2 p-2">
              <Icon className="w-[2rem]" path={mdiFile}></Icon>
            </Button>
            <div>{props.prompt.prompt}</div>
          </div>
        }
      </Card>
    </Card>
  );
};

export default PromptCard;
