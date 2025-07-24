import type { LucideProps } from "lucide-react";
import { BookOpenCheck } from "lucide-react";

export type Icon = typeof BookOpenCheck;

export const Icons = {
  logo: (props: LucideProps) => <BookOpenCheck {...props} />,
};
