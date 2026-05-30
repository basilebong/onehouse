import type { ReactElement } from "react";
import type { GroceryAuthor } from "../shared/index.ts";
import { paletteFor } from "./colors.ts";

type AvatarProps = {
  author: GroceryAuthor;
  size?: number;
};

const paletteKey = (author: GroceryAuthor): string =>
  author.kind === "user" ? author.id : `unknown:${author.name}`;

export const Avatar = ({ author, size = 24 }: AvatarProps): ReactElement => {
  const palette = paletteFor(paletteKey(author));
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
