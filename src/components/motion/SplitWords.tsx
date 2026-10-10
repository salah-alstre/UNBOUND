import type { ElementType } from "react";

interface Props {
  text: string;
  as?: ElementType;
  className?: string;
  id?: string;
}

/**
 * Renders a line as masked words. The words are animated by MotionRoot
 * (any element carrying `data-split`); without JS the text simply reads normally.
 */
export function SplitWords({ text, as: Tag = "span", className, id }: Props) {
  const words = text.split(" ");
  return (
    <Tag className={className} id={id} data-split aria-label={text}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} aria-hidden="true">
          <span className="w">
            <span>{word}</span>
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}
