import type { ReactElement } from "react";
import type { GroceryAuthor } from "../shared/index.ts";
import { paletteFor } from "./colors.ts";

type AvatarProps = {
  author: GroceryAuthor;
  size?: number;
};

export const Avatar = ({ author, size = 24 }: AvatarProps): ReactElement => {
  const palette = paletteFor(author.id);
  return (
    <div
      role="img"
      aria-label={`Added by ${author.name}`}
      title={author.name}
      className="grid shrink-0 place-items-center rounded-full font-semibold text-[10px]"
      style={{
        width: size,
        height: size,
        background: palette.bg,
        color: palette.fg,
      }}
    >
      <span aria-hidden="true">{author.initial}</span>
    </div>
  );
};
